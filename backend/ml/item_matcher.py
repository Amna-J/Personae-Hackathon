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


def score_item_against_recommendation(item: dict, recommendation: dict) -> dict:
    client = _get_client()

    user_message = (
        f"Item: {json.dumps(item, indent=2)}\n\n"
        f"User's styling recommendation: {json.dumps(recommendation, indent=2)}\n\n"
        "Judge this match."
    )

    try:
        completion = client.chat.completions.create(
            model=_MODEL,
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
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
    from django.conf import settings

    SQLITE_DB = os.path.join(BACKEND_DIR, "db.sqlite3")
    if os.path.isfile(SQLITE_DB):
        settings.DATABASES["default"] = {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": SQLITE_DB,
        }

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
