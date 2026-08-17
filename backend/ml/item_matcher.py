from __future__ import annotations

import json
import os
import re
import sys
from typing import Any

from dotenv import load_dotenv
from groq import Groq

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env"))


_MODEL = "llama-3.3-70b-versatile"

_SYSTEM_PROMPT = """
You are a fashion-fit judge. You are given a specific fashion item's attributes and a person's styling recommendation profile. Decide whether the item is a good match for this person.

Respond with ONLY a JSON object with these fields:
- "matches": true or false
- "confidence": a float between 0 and 1
- "matched_criteria": a short list of specific ways the item aligns with the recommendation (e.g. "color falls within recommended earth tones")
- "mismatched_criteria": a short list of specific ways it conflicts, if any (e.g. "silhouette is oversized, but avoid list emphasizes fitted for this body shape")
- "reasoning": one or two plain-language sentences a non-technical user could read as an explanation

Judge primarily on: does the item's color fall within the recommended colors (not the avoid colors)? Does its silhouette align with the recommended fitting style (or a reasonable neighboring category)? Do pattern/material broadly fit what's recommended? For jewelry items, no silhouette/pattern applies — score primarily on whether the item's color/metal matches recommended_jewelry_metal.

Be moderately strict: a color adjacent to the recommended palette (e.g. a slightly warmer shade within a described category) can still score reasonably well, but a color explicitly on the avoid list should score low regardless of other factors. Do not output any text outside the JSON object.
"""

_COLOR_FALLBACK_SYSTEM_PROMPT = """
You are a color-fit judge. You are given a single fashion item's color and a person's skin tone and undertone.

This color is NOT listed in the person's explicitly recommended or avoid colors, so you must judge it on first principles for THIS skin tone and undertone — do not try to map it onto those lists.

Respond with ONLY a JSON object with these fields:
- "matches": true or false
- "confidence": a float between 0 and 1
- "matched_criteria": a short list of specific ways this color works for this skin tone/undertone (e.g. "warm beige flatters a warm undertone")
- "mismatched_criteria": a short list of specific ways it conflicts, if any (e.g. "too pale washes out a fair, cool complexion")
- "reasoning": one or two plain-language sentences a non-technical user could read as an explanation

Be moderately strict: a color that clearly clashes with the undertone or washes out the skin tone should score low; a color that broadly harmonizes should score reasonably well. Do not output any text outside the JSON object.
"""

# Splits fuzzy recommendation color lists ("Earth Tones, Olive, Coral, ...")
# into individual color phrases for coverage detection.
_COLOR_TOKEN_SPLIT_RE = re.compile(r"[,;]")


def _strip_markdown_fences(text: str) -> str:
    cleaned = text.strip()
    cleaned = re.sub(r"<think>.*?</think>", "", cleaned, flags=re.DOTALL)
    cleaned = cleaned.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start != -1 and end != -1 and end > start:
        cleaned = cleaned[start : end + 1]
    return cleaned


def _get_client() -> Groq:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError(
            "Missing GROQ_API_KEY environment variable. "
            "Set it before calling item-matching functions."
        )
    try:
        return Groq(api_key=api_key)
    except Exception as exc:
        raise RuntimeError(f"Failed to initialise Groq client: {exc}") from exc


def _request_verdict_json(system_prompt: str, user_message: str) -> dict:
    """Run one Groq judge call and return a validated verdict dict.

    Shared by the standard fuzzy item judge and the color-fallback judge so the
    request/parse/validate behaviour (and its error messages) stays identical.
    """
    client = _get_client()

    try:
        completion = client.chat.completions.create(
            model=_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            temperature=0,
            max_tokens=1024,
            top_p=1,
            stream=False,
            stop=None,
            response_format={"type": "json_object"},
        )
    except Exception as exc:
        raise RuntimeError(f"Groq API request failed: {exc}") from exc

    try:
        content = completion.choices[0].message.content
        if isinstance(content, list):
            text = "".join(
                block.get("text", "") if isinstance(block, dict) else str(block)
                for block in content
            )
        else:
            text = str(content or "")
    except Exception as exc:
        raise RuntimeError(f"Groq returned an unexpected response structure: {exc}") from exc

    if not text.strip():
        raise RuntimeError("Groq returned an empty response.")

    cleaned = _strip_markdown_fences(text)

    try:
        result = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        raise ValueError(
            f"Failed to parse Groq response as JSON (decoded: {exc}). "
            f"Raw text after fences (first 500 chars): {cleaned[:500]}"
        ) from exc

    required = {"matches", "confidence", "matched_criteria", "mismatched_criteria", "reasoning"}
    missing = required - set(result.keys())
    if missing:
        raise ValueError(
            f"Groq response JSON is missing required keys: {missing}. "
            f"Received keys: {list(result.keys())}"
        )

    return result


def score_item_against_recommendation(item: dict, recommendation: dict) -> dict:
    user_message = (
        f"Item: {json.dumps(item, indent=2)}\n\n"
        f"User's styling recommendation: {json.dumps(recommendation, indent=2)}\n\n"
        "Judge this match."
    )
    return _request_verdict_json(_SYSTEM_PROMPT, user_message)


def color_is_covered_by_recommendation(color: Any, recommendation: dict) -> bool:
    """Return True if `color` is mentioned in the fuzzy engine's color lists.

    The recommended/avoid lists are comma-separated phrases (e.g. "Jewel Tones,
    Icy Blue, Lavender, Silver, Emerald" / "Orange, Mustard, Brown"). Coverage
    is a deterministic textual heuristic: a color phrase counts as covered when
    it equals, contains, is contained by, or shares a word with any list entry
    ("olive green" matches "Olive"; "blue" matches "Icy Blue"; "warm red"
    matches "Warm Red").

    This drives the LLM color-fallback: uncovered colors get a dedicated LLM
    judge call instead of a silent pass/reject/guess by the fuzzy engine.
    """
    if not isinstance(color, str) or not color.strip():
        return False
    if not isinstance(recommendation, dict):
        return False

    corpus = " ".join(
        (
            recommendation.get("recommended_clothing_colors") or "",
            recommendation.get("avoid_clothing_colors") or "",
        )
    )
    if not corpus.strip():
        return False

    def _words(text: str) -> set[str]:
        return {w for w in re.findall(r"[a-z]+", text.lower()) if len(w) > 1}

    color_norm = re.sub(r"\s+", " ", color.strip().lower())
    color_words = _words(color_norm)

    for raw_token in _COLOR_TOKEN_SPLIT_RE.split(corpus):
        token_norm = re.sub(r"\s+", " ", raw_token.strip().lower())
        if not token_norm:
            continue
        if token_norm == color_norm:
            return True
        if token_norm in color_norm or color_norm in token_norm:
            return True
        if color_words & _words(token_norm):
            return True
    return False


def score_color_match_via_llm(item: dict, recommendation: dict) -> dict:
    """LLM judge call for an item whose color is NOT in the fuzzy color lists.

    Asks specifically whether the item's color is a reasonable match for the
    user's skin_tone/under_tone profile, independent of silhouette/pattern.
    Returns the same verdict schema as score_item_against_recommendation() so
    the caller can drop it into the pipeline unchanged.
    """
    profile = recommendation or {}
    user_message = (
        f"Item color: {(item or {}).get('color')!r}\n"
        f"Person profile — skin_tone: {profile.get('skin_tone')!r}, "
        f"under_tone: {profile.get('under_tone')!r}\n"
        f"Recommended colors (for context): "
        f"{(profile.get('recommended_clothing_colors') or 'n/a')}\n"
        f"Avoid colors (for context): {(profile.get('avoid_clothing_colors') or 'n/a')}\n\n"
        "Judge whether this specific color is a reasonable match for this person."
    )
    return _request_verdict_json(_COLOR_FALLBACK_SYSTEM_PROMPT, user_message)


def score_all_items_with_color_fallback(
    items: list[dict],
    recommendation: dict,
    threshold: float = 0.6,
) -> list[dict]:
    """Score items, routing uncovered colors to a dedicated LLM color judge.

    For each item:
      - if the item's color IS covered by the fuzzy engine's recommended/avoid
        color lists  → standard score_item_against_recommendation(), tagged
        verdict["verdict_source"] = "fuzzy_engine"
      - if it is NOT covered → score_color_match_via_llm(), tagged
        verdict["verdict_source"] = "llm_color_fallback"

    Every returned item carries the same shape as score_all_items() plus the
    verdict_source tag, so downstream code (passes_threshold, split, VTO) needs
    no changes — and callers can count how many verdicts came from each source.
    """
    results = []
    for item in items:
        color = item.get("color") if isinstance(item, dict) else None
        if color_is_covered_by_recommendation(color, recommendation):
            verdict = score_item_against_recommendation(item, recommendation)
            verdict["verdict_source"] = "fuzzy_engine"
        else:
            verdict = score_color_match_via_llm(item, recommendation)
            verdict["verdict_source"] = "llm_color_fallback"
        passes = verdict.get("matches", False) and verdict.get("confidence", 0.0) >= threshold
        augmented = {**item, "verdict": verdict, "passes_threshold": passes}
        results.append(augmented)
    return results


def score_all_items(
    items: list[dict],
    recommendation: dict,
    threshold: float = 0.6,
) -> list[dict]:
    results = []
    for item in items:
        verdict = score_item_against_recommendation(item, recommendation)
        passes = verdict.get("matches", False) and verdict.get("confidence", 0.0) >= threshold
        augmented = {**item, "verdict": verdict, "passes_threshold": passes}
        results.append(augmented)
    return results


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit(
            "Usage: python item_matcher.py <items.json> <user_id>\n\n"
            "  items.json  - a JSON file with a list of moodboard-decomposer items\n"
            "  user_id     - the PersonaUser id whose recommendation to fetch"
        )

    items_path = sys.argv[1]
    user_id = int(sys.argv[2])

    if not os.path.isfile(items_path):
        raise SystemExit(f"Items file not found: {items_path}")

    with open(items_path, "r", encoding="utf-8") as f:
        items = json.load(f)

    if not isinstance(items, list):
        raise SystemExit("Items file must contain a JSON array.")

    BACKEND_DIR = os.path.normpath(os.path.join(os.path.dirname(__file__), ".."))

    sys.path.insert(0, BACKEND_DIR)
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

    import django

    django.setup()

    from django.core.management import call_command
    call_command("migrate", run_syncdb=True, verbosity=0)

    from users.models import PersonaUser
    from ml.predictors.fuzzy_recommendation_engine import FuzzyRecommendationEngine

    user = PersonaUser.objects.filter(id=user_id).first()
    if user is None:
        raise SystemExit(f"No PersonaUser found with id={user_id}")

    engine = FuzzyRecommendationEngine()
    result = engine.recommend(
        skin_tone=user.skin_tone,
        under_tone=user.undertone,
        body_shape=user.body_type,
    )

    recommendation_dict = result.to_dict()
    scored_items = score_all_items(items, recommendation_dict)

    output = {
        "user_id": user.id,
        "username": user.username,
        "recommendation": recommendation_dict,
        "items": scored_items,
    }

    print(json.dumps(output, indent=2, ensure_ascii=False))
