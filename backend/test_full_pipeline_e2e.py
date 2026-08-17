"""End-to-end integration test for the Personae style-check pipeline.

Replaces the manual testing that used the trained CV models (Xception skin
tone, Keras undertone, LightGBM/RandomForest/PyTorch body-shape ensemble),
whose weights are deliberately not part of the repo. This test derives the
user profile with a vision LLM (same Groq provider/pattern as
ml/moodboard_decomposer.py) and then runs the real, unmocked pipeline:

    vision-LLM profile
      -> FuzzyRecommendationEngine.recommend()
      -> decompose_moodboard()
      -> item_matcher (fuzzy engine + LLM color-fallback for uncovered colors)
      -> split_passing_items() + attach_reference_images()
      -> chain_vto_steps() via the real YouCam API
      -> StyleCheckView (the real /api/users/style-check/ endpoint logic) with
         the LLM profile injected into the DB in place of a stored one

Every network call hits the real Groq and YouCam APIs. The final render is
saved under test_output/ (gitignored) and a full results.json is written so
failures and fallback usage are diagnosable without re-running.

Usage (from Personae/backend with the venv active):

    python test_full_pipeline_e2e.py
    python test_full_pipeline_e2e.py --moodboard <flat-lay.jpg> --person <full-length.png>
    python test_full_pipeline_e2e.py --skip-endpoint

Exit code is 0 only if every stage passes; any failure/skip yields a non-zero
exit and a per-stage PASS/FAIL/SKIP summary.
"""

from __future__ import annotations

import argparse
import io
import json
import os
import sys
import time
from collections import Counter
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))
load_dotenv(BACKEND_DIR / ".env")

TEST_OUTPUT_DIR = BACKEND_DIR / "test_output"
RESULTS_JSON = TEST_OUTPUT_DIR / "results.json"
FINAL_RENDER_PATH = TEST_OUTPUT_DIR / "final_render.jpg"
REF_OUTPUT_DIR = TEST_OUTPUT_DIR / "refs"
DEFAULT_MOODBOARD = BACKEND_DIR / "ml" / "testimages" / "pinterest.jpg"
DEFAULT_PERSON_PHOTO = BACKEND_DIR / "ml" / "testimages" / "full look.png"
DEFAULT_TEST_USER_EMAIL = "e2e.pipeline@personae.local"

import requests
from groq import Groq
from PIL import Image

from ml.moodboard_decomposer import (
    MODEL_NAME,
    _prepare_image_payload,
    _strip_markdown_fences,
    decompose_moodboard,
)
from ml.item_matcher import (
    color_is_covered_by_recommendation,
    score_all_items_with_color_fallback,
)
from ml.predictors.fuzzy_recommendation_engine import (
    VALID_BODY_SHAPES,
    VALID_SKIN_TONES,
    VALID_UNDER_TONES,
    FuzzyRecommendationEngine,
)
from ml.vto_pipeline import (
    annotate_render_status,
    assign_item_ids,
    attach_reference_images,
    run_core_vto_render,
    split_passing_items,
)

VALID_ITEM_CATEGORIES = frozenset(
    {
        "top", "bottom", "full_outfit", "shoes", "bag", "hat", "scarf",
        "ring", "bracelet", "earrings", "necklace", "watch",
        "hairstyle_reference", "sunglasses", "other",
    }
)
VALID_VERDICT_SOURCES = frozenset({"fuzzy_engine", "llm_color_fallback"})
VERDICT_KEYS = {"matches", "confidence", "matched_criteria", "mismatched_criteria", "reasoning"}

PASS = "PASS"
FAIL = "FAIL"
SKIP = "SKIP"

# ---------------------------------------------------------------------------
# Vision-LLM profile classification
# ---------------------------------------------------------------------------

PROFILE_SYSTEM_PROMPT = """You are a personal color-and-style analysis engine. You analyze a full-length photo of a person and classify exactly three attributes.

You MUST answer using ONLY these exact category values — no free text, no paraphrases, no extra keys:

- skin_tone: one of ["Fair", "Medium", "Dark", "Black"]
- under_tone: one of ["Warm", "Cool", "Neutral"]
- body_shape: one of ["Hourglass", "Inverted Triangle", "Pear", "Apple", "Rectangle"]

Body shape must be judged from whole-body proportions (shoulder/bust width, waist definition, hip width, and where weight is carried):
- Hourglass: balanced shoulders and hips with a clearly defined waist
- Inverted Triangle: shoulders/bust noticeably wider than hips
- Pear: hips noticeably wider than shoulders, waist defined
- Apple: weight carried around the midsection, waist undefined
- Rectangle: shoulders, waist, and hips roughly equal

Respond with ONLY a single JSON object containing exactly these three keys: "skin_tone", "under_tone", "body_shape". No markdown code fences, no preamble, no explanation — the response must be parseable directly as JSON."""

PROFILE_USER_MESSAGE = (
    "Analyze this full-length person photo and return the JSON object with "
    "skin_tone, under_tone, and body_shape using only the allowed values."
)


def _extract_message_text(completion) -> str:
    try:
        message = completion.choices[0].message
        content = message.content
        if isinstance(content, list):
            return "".join(
                block.get("text", "") if isinstance(block, dict) else str(block)
                for block in content
            )
        return str(content or "")
    except Exception as exc:
        raise RuntimeError(
            f"Groq returned an unexpected response structure: {exc}"
        ) from exc


def _normalise_title(value) -> str | None:
    if not isinstance(value, str) or not value.strip():
        return None
    return value.strip().title()


def _normalise_body_shape(value) -> str | None:
    if not isinstance(value, str) or not value.strip():
        return None
    return " ".join(w.capitalize() for w in value.strip().split())


def validate_profile(raw) -> dict:
    """Normalise + enforce the fixed category sets. Raises on anything outside them."""
    if not isinstance(raw, dict):
        raise ValueError(
            f"Profile classification response was not a JSON object "
            f"(got {type(raw).__name__})."
        )
    skin_tone = _normalise_title(raw.get("skin_tone"))
    under_tone = _normalise_title(raw.get("under_tone") or raw.get("undertone"))
    body_shape = _normalise_body_shape(raw.get("body_shape") or raw.get("body_type"))

    problems = []
    if skin_tone not in VALID_SKIN_TONES:
        problems.append(f"skin_tone={skin_tone!r} not in {sorted(VALID_SKIN_TONES)}")
    if under_tone not in VALID_UNDER_TONES:
        problems.append(f"under_tone={under_tone!r} not in {sorted(VALID_UNDER_TONES)}")
    if body_shape not in VALID_BODY_SHAPES:
        problems.append(f"body_shape={body_shape!r} not in {sorted(VALID_BODY_SHAPES)}")
    if problems:
        raise ValueError("LLM returned out-of-category values: " + "; ".join(problems))

    return {"skin_tone": skin_tone, "under_tone": under_tone, "body_shape": body_shape}


def classify_profile_from_photo(image_path_or_bytes, max_attempts: int = 3) -> dict:
    """Classify skin_tone/under_tone/body_shape from a person photo via a vision LLM."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError(
            "Missing GROQ_API_KEY environment variable. Set it in backend/.env "
            "before running the e2e pipeline test."
        )
    client = Groq(api_key=api_key)
    image_payload = _prepare_image_payload(image_path_or_bytes)

    last_error = None
    for attempt in range(1, max_attempts + 1):
        try:
            completion = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[
                    {"role": "system", "content": PROFILE_SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": PROFILE_USER_MESSAGE},
                            image_payload,
                        ],
                    },
                ],
                temperature=0,
                max_completion_tokens=1024,
                top_p=1,
                stream=False,
                stop=None,
                reasoning_effort="none",
                response_format={"type": "json_object"},
            )
            text = _extract_message_text(completion)
            if not text.strip():
                raise ValueError("Groq returned an empty response.")
            parsed = json.loads(_strip_markdown_fences(text))
            return validate_profile(parsed)
        except (ValueError, json.JSONDecodeError) as exc:
            last_error = exc
            print(f"    profile attempt {attempt}/{max_attempts} failed: {exc}")

    raise RuntimeError(
        f"Profile classification failed after {max_attempts} attempt(s). "
        f"Last error: {last_error}"
    )


def profile_to_user_fields(profile: dict) -> dict:
    """Map the engine-style profile onto PersonaUser column names."""
    return {
        "skin_tone": profile["skin_tone"],
        "undertone": profile["under_tone"],
        "body_type": profile["body_shape"],
    }


# ---------------------------------------------------------------------------
# Stage runner
# ---------------------------------------------------------------------------

class Stages:
    def __init__(self) -> None:
        self.entries: list[dict] = []

    def is_pass(self, name: str) -> bool:
        return any(e["name"] == name and e["status"] == PASS for e in self.entries)

    def result(self, name: str) -> dict | None:
        for e in self.entries:
            if e["name"] == name and e["status"] == PASS:
                return e["result"]
        return None

    def run(self, name: str, fn, depends_on: str | None = None) -> dict | None:
        if depends_on is not None and not self.is_pass(depends_on):
            return self._record(
                name, SKIP, None, f"skipped: depends on failed stage {depends_on!r}", 0.0
            )
        start = time.monotonic()
        try:
            result = fn()
        except Exception as exc:
            return self._record(
                name, FAIL, None, f"{type(exc).__name__}: {exc}", time.monotonic() - start
            )
        return self._record(name, PASS, result, "", time.monotonic() - start)

    def _record(self, name, status, result, message, elapsed) -> dict | None:
        summary = ""
        if status == PASS and isinstance(result, dict):
            summary = result.get("summary", "")
        if status != PASS and message:
            summary = message
        print(f"  [{len(self.entries) + 1:02d}] {name:<24} {status}  ({elapsed:6.1f}s)  {summary}")
        self.entries.append(
            {
                "name": name,
                "status": status,
                "message": message if status != PASS else "",
                "elapsed": round(elapsed, 2),
                "result": result if status == PASS else None,
            }
        )
        return result if status == PASS else None


# ---------------------------------------------------------------------------
# Stages
# ---------------------------------------------------------------------------

def stage_profile(max_attempts: int):
    def _run() -> dict:
        profile = classify_profile_from_photo(str(PERSON_PHOTO), max_attempts=max_attempts)
        print(f"        profile = {json.dumps(profile)}")
        return {
            "profile": profile,
            "summary": (
                f"skin_tone={profile['skin_tone']} "
                f"under_tone={profile['under_tone']} "
                f"body_shape={profile['body_shape']}"
            ),
        }

    return _run


def stage_fuzzy_recommendation():
    def _run() -> dict:
        profile = STAGES.result("profile_classification")["profile"]
        recommendation = FuzzyRecommendationEngine().recommend(
            skin_tone=profile["skin_tone"],
            under_tone=profile["under_tone"],
            body_shape=profile["body_shape"],
        ).to_dict()
        for key in ("recommended_clothing_colors", "avoid_clothing_colors", "recommended_fitting_style"):
            if not recommendation.get(key):
                raise RuntimeError(f"recommendation.{key} is empty.")
        print(
            f"        recommended_colors = {recommendation['recommended_clothing_colors']}"
        )
        print(f"        avoid_colors      = {recommendation['avoid_clothing_colors']}")
        print(f"        fitting_style     = {recommendation['recommended_fitting_style']}")
        return {
            "recommendation": recommendation,
            "summary": f"confidence={recommendation['confidence']}",
        }

    return _run


def stage_decompose():
    def _run() -> dict:
        items = decompose_moodboard(str(MOODBOARD_PATH))
        if not items:
            raise RuntimeError("decompose_moodboard returned an empty item list.")
        invalid = [
            it for it in items
            if (it.get("category") or "").strip().lower() not in VALID_ITEM_CATEGORIES
        ]
        if invalid:
            raise RuntimeError(
                f"decompose_moodboard returned {len(invalid)} item(s) with "
                f"out-of-category values: {[it.get('category') for it in invalid]}"
            )
        print(
            "        " + "; ".join(
                f"{it.get('category')}={it.get('color')!r}" for it in items
            )
        )
        return {"items": items, "summary": f"{len(items)} items, categories valid"}

    return _run


def stage_matcher(threshold: float):
    def _run() -> dict:
        items = STAGES.result("decompose_moodboard")["items"]
        recommendation = STAGES.result("fuzzy_recommendation")["recommendation"]

        assign_item_ids(items)
        scored = score_all_items_with_color_fallback(items, recommendation, threshold=threshold)

        for item in scored:
            verdict = item.get("verdict")
            if not isinstance(verdict, dict):
                raise RuntimeError(f"item {item.get('label')!r} has no verdict dict")
            missing = VERDICT_KEYS - set(verdict)
            if missing:
                raise RuntimeError(f"item {item.get('label')!r} verdict missing keys: {missing}")
            source = verdict.get("verdict_source")
            if source not in VALID_VERDICT_SOURCES:
                raise RuntimeError(f"item {item.get('label')!r} has invalid verdict_source {source!r}")
            if not isinstance(verdict.get("matches"), bool):
                raise RuntimeError(f"item {item.get('label')!r} verdict.matches is not a bool")
            confidence = verdict.get("confidence")
            if not isinstance(confidence, (int, float)) or not 0.0 <= float(confidence) <= 1.0:
                raise RuntimeError(f"item {item.get('label')!r} verdict.confidence invalid: {confidence!r}")

        sources = Counter(item["verdict"]["verdict_source"] for item in scored)
        passing = [item for item in scored if item.get("passes_threshold")]

        print(f"        verdict sources: fuzzy_engine={sources.get('fuzzy_engine', 0)} "
              f"llm_color_fallback={sources.get('llm_color_fallback', 0)}")
        print(f"        passing: {len(passing)}/{len(scored)}")
        for item in scored:
            verdict = item["verdict"]
            print(
                f"        {str(item.get('label'))[:36]:<38} "
                f"{str(item.get('category')):<14} "
                f"{str(item.get('color'))[:14]:<16} "
                f"{verdict['verdict_source']:<18} "
                f"{'PASS' if item['passes_threshold'] else 'REJECT'} "
                f"conf={float(verdict['confidence']):.2f}"
            )
        return {
            "scored": scored,
            "sources": dict(sources),
            "passing": passing,
            "summary": (
                f"fuzzy={sources.get('fuzzy_engine', 0)} "
                f"llm_fallback={sources.get('llm_color_fallback', 0)} "
                f"passing={len(passing)}/{len(scored)}"
            ),
        }

    return _run


def stage_vto_chain():
    def _run() -> dict:
        scored = STAGES.result("item_matching")["scored"]
        passing = STAGES.result("item_matching")["passing"]
        if not passing:
            raise RuntimeError(
                "No items passed the matcher — cannot validate the VTO chain. "
                "See the item_matching stage output for per-item verdicts."
            )

        split = split_passing_items(passing)
        core_items = split["core_items"]
        if not core_items:
            raise RuntimeError(
                "No core-renderable items (top/bottom/full_outfit) passed — "
                "cannot validate the VTO chain. See the item_matching stage output."
            )

        REF_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        core_with_refs = attach_reference_images(
            core_items, str(MOODBOARD_PATH), str(REF_OUTPUT_DIR)
        )
        usable_core = [item for item in core_with_refs if item.get("image_path")]
        if not usable_core:
            raise RuntimeError(
                "attach_reference_images produced no usable reference crops — "
                "cannot run the VTO chain. Check that the moodboard is a flat-lay "
                "and each item has a valid bounding_box."
            )

        steps = run_core_vto_render(str(PERSON_PHOTO), usable_core)
        if not steps:
            raise RuntimeError("chain_vto_steps returned an empty step list.")

        render_url = steps[-1]["result_url"]
        if not isinstance(render_url, str) or not render_url.startswith(("http://", "https://")):
            raise RuntimeError(f"VTO chain returned an invalid render_url: {render_url!r}")

        response = requests.get(render_url, timeout=120)
        response.raise_for_status()
        image_bytes = response.content
        if not image_bytes:
            raise RuntimeError("VTO render URL returned empty bytes.")

        with io.BytesIO(image_bytes) as buf:
            Image.open(buf).verify()

        FINAL_RENDER_PATH.write_bytes(image_bytes)
        annotated = annotate_render_status(scored, split, usable_core)

        statuses = Counter(item.get("render_status") for item in annotated)
        print(f"        render_url: {render_url}")
        print(f"        saved: {FINAL_RENDER_PATH} ({len(image_bytes)} bytes)")
        print(f"        render_status: {dict(statuses)}")
        return {
            "render_url": render_url,
            "local_path": str(FINAL_RENDER_PATH),
            "steps": steps,
            "split": split,
            "annotated": annotated,
            "render_bytes": len(image_bytes),
            "summary": f"render saved ({len(image_bytes)} bytes), {len(steps)} VTO step(s)",
        }

    return _run


def stage_api_endpoint(test_user_email: str):
    def _run() -> dict:
        profile = STAGES.result("profile_classification")["profile"]
        return _run_endpoint_stage(profile, MOODBOARD_PATH, PERSON_PHOTO, test_user_email)

    return _run


def _run_endpoint_stage(profile, moodboard_path, person_path, test_user_email) -> dict:
    """Hit the real StyleCheckView endpoint logic with the LLM profile injected.

    The view is called directly via DRF's APIRequestFactory rather than through
    the URL router, because resolving config.urls eagerly imports
    predictions.views -> ml.registry, which loads the trained CV-model weights
    (Xception/Keras/LightGBM/PyTorch) that are deliberately not part of this
    repo. The view itself (multipart parsing, validation, DB profile lookup,
    worker-thread pipeline, YouCam chain, response payload) is the real,
    unmodified production code.
    """
    import django

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
    django.setup()

    from rest_framework.test import APIRequestFactory
    from users.models import PersonaUser
    from users.views import StyleCheckView

    user = None
    try:
        user, _ = PersonaUser.objects.update_or_create(
            email=test_user_email,
            defaults={
                "username": "e2e_pipeline_test_user",
                "password": "e2e-pipeline-test-pass!",
                **profile_to_user_fields(profile),
            },
        )
        print(
            f"        injected LLM profile into PersonaUser id={user.id} "
            f"email={user.email} (deleted after this stage)"
        )

        factory = APIRequestFactory()
        with open(moodboard_path, "rb") as moodboard_file, open(person_path, "rb") as person_file:
            request = factory.post(
                "/api/users/style-check/",
                {
                    "user_id": str(user.id),
                    "moodboard_image": moodboard_file,
                    "person_photo": person_file,
                },
                format="multipart",
            )
        view = StyleCheckView.as_view()
        response = view(request)

        if response.status_code != 200:
            raise RuntimeError(
                f"StyleCheckView returned HTTP {response.status_code}: "
                f"{json.dumps(response.data, default=str)[:2000]}"
            )

        data = response.data
        required = {
            "user_id", "username", "status", "vto_status", "recommendation",
            "items", "render_url", "passed_item_count", "split",
        }
        missing = required - set(data)
        if missing:
            raise RuntimeError(f"StyleCheckView response missing keys: {missing}")

        for item in data["items"]:
            if "render_status" not in item or "verdict" not in item:
                raise RuntimeError(
                    f"StyleCheckView item missing render_status/verdict: "
                    f"{json.dumps(item, default=str)[:400]}"
                )

        if data["status"] == "completed":
            render_url = data.get("render_url")
            if not render_url or not render_url.startswith(("http://", "https://")):
                raise RuntimeError(
                    f"endpoint status=completed but render_url invalid: {render_url!r}"
                )
        else:
            print(
                f"        NOTE: endpoint returned status={data['status']!r} "
                f"(vto_status={data.get('vto_status')!r}). The endpoint's matcher "
                "has no color-fallback, so this can differ from the direct stage — "
                "not a structural failure."
            )

        return {
            "status_code": response.status_code,
            "api_status": data["status"],
            "render_url": data.get("render_url"),
            "passed_item_count": data.get("passed_item_count"),
            "summary": (
                f"HTTP {response.status_code} status={data['status']} "
                f"passed={data.get('passed_item_count')} "
                f"render={'yes' if data.get('render_url') else 'no'}"
            ),
        }
    finally:
        if user is not None:
            user.delete()


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------

def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Run the Personae style-check pipeline end-to-end with real APIs."
    )
    parser.add_argument("--moodboard", type=Path, default=DEFAULT_MOODBOARD,
                        help="Flat-lay / moodboard image path (default: ml/testimages/pinterest.jpg)")
    parser.add_argument("--person", type=Path, default=DEFAULT_PERSON_PHOTO,
                        help="Full-length person photo path (default: ml/testimages/full look.png)")
    parser.add_argument("--max-attempts", type=int, default=3,
                        help="Vision-LLM profile retry attempts (default: 3)")
    parser.add_argument("--threshold", type=float, default=0.6,
                        help="Matcher pass confidence threshold (default: 0.6)")
    parser.add_argument("--skip-endpoint", action="store_true",
                        help="Skip the StyleCheckView endpoint stage (saves a second full VTO render)")
    parser.add_argument("--test-user-email", default=DEFAULT_TEST_USER_EMAIL,
                        help="PersonaUser email used for profile injection (deleted after the run)")
    return parser


def validate_image_pair(moodboard: Path, person: Path) -> None:
    for label, path in (("moodboard", moodboard), ("person", person)):
        if not path.is_file():
            raise SystemExit(f"Image not found: {label}={path}")
    if moodboard.resolve() == person.resolve():
        raise SystemExit(
            "The moodboard and person photo must be two distinct files — "
            "the person photo cannot be the same source image as the moodboard."
        )
    if moodboard.read_bytes() == person.read_bytes():
        raise SystemExit(
            "The moodboard and person photo contain identical bytes — they must "
            "be two distinct real images (the person photo cannot be a copy of "
            "the moodboard)."
        )
    moodboard_img = Image.open(moodboard)
    person_img = Image.open(person)
    if (
        person_img.size[0] < moodboard_img.size[0]
        and person_img.size[1] < moodboard_img.size[1]
    ):
        print(
            "    WARNING: the person photo is smaller than the moodboard in both "
            "dimensions — make sure it is a real full-length photo and not a crop "
            "of the moodboard."
        )


def _slim_items(annotated) -> list[dict]:
    slim = []
    for item in annotated:
        slim.append(
            {
                "label": item.get("label"),
                "category": item.get("category"),
                "color": item.get("color"),
                "passes_threshold": item.get("passes_threshold"),
                "render_status": item.get("render_status"),
                "verdict": {
                    "matches": item.get("verdict", {}).get("matches"),
                    "confidence": item.get("verdict", {}).get("confidence"),
                    "verdict_source": item.get("verdict", {}).get("verdict_source"),
                },
            }
        )
    return slim


def write_results(stages: Stages, artifacts: dict) -> None:
    TEST_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    stage_rows = [
        {
            "name": e["name"],
            "status": e["status"],
            "message": e["message"],
            "elapsed_seconds": e["elapsed"],
        }
        for e in stages.entries
    ]
    payload = {
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "moodboard": str(artifacts["moodboard"]),
        "person_photo": str(artifacts["person"]),
        "stages": stage_rows,
        "profile": artifacts.get("profile"),
        "recommendation": artifacts.get("recommendation"),
        "verdict_source_counts": artifacts.get("sources"),
        "items": _slim_items(artifacts.get("annotated") or []),
        "render_url": artifacts.get("render_url"),
        "render_saved_path": artifacts.get("render_saved_path"),
        "api_endpoint": artifacts.get("api_endpoint"),
    }
    RESULTS_JSON.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"    results written to {RESULTS_JSON}")


def print_summary(stages: Stages) -> None:
    divider = "=" * 78
    print(f"\n{divider}")
    print("  STYLE-CHECK E2E PIPELINE SUMMARY")
    print(divider)
    for index, entry in enumerate(stages.entries, start=1):
        print(f"  {index:02d}. {entry['name']:<24} {entry['status']:<7} "
              f"({entry['elapsed']:6.1f}s)  {entry['message']}")

    matcher = stages.result("item_matching")
    if matcher:
        sources = matcher.get("sources") or {}
        print(f"\n  VERDICT SOURCES: {sources.get('fuzzy_engine', 0)} from fuzzy engine | "
              f"{sources.get('llm_color_fallback', 0)} from LLM color-fallback")
        print(f"  ITEMS PASSING: {len(matcher.get('passing') or [])}/"
              f"{len(matcher.get('scored') or [])}")

    vto = stages.result("vto_chain")
    if vto:
        print(f"  FINAL RENDER: {vto.get('local_path')} ({vto.get('render_bytes')} bytes)")
        print(f"  RENDER URL: {vto.get('render_url')}")

    all_pass = all(e["status"] == PASS for e in stages.entries)
    print(divider)
    if all_pass:
        print(f"  RESULT: PASS ({sum(1 for e in stages.entries if e['status'] == PASS)}/{len(stages.entries)} stages)")
    else:
        failed = [e["name"] for e in stages.entries if e["status"] != PASS]
        print(f"  RESULT: FAIL — stages not passed: {failed}")
    print(divider)


def main() -> int:
    global MOODBOARD_PATH, PERSON_PHOTO, STAGES
    args = build_parser().parse_args()
    MOODBOARD_PATH = Path(args.moodboard)
    PERSON_PHOTO = Path(args.person)

    TEST_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"moodboard: {MOODBOARD_PATH}")
    print(f"person:    {PERSON_PHOTO}")
    print(f"output:    {TEST_OUTPUT_DIR}")

    validate_image_pair(MOODBOARD_PATH, PERSON_PHOTO)
    print()

    STAGES = Stages()
    stages = STAGES
    stages.run("profile_classification", stage_profile(args.max_attempts))
    stages.run("fuzzy_recommendation", stage_fuzzy_recommendation(),
               depends_on="profile_classification")
    stages.run("decompose_moodboard", stage_decompose(),
               depends_on="fuzzy_recommendation")
    stages.run("item_matching", stage_matcher(args.threshold),
               depends_on="decompose_moodboard")
    stages.run("vto_chain", stage_vto_chain(),
               depends_on="item_matching")
    if not args.skip_endpoint:
        stages.run("api_endpoint", stage_api_endpoint(args.test_user_email),
                   depends_on="profile_classification")

    artifacts = {
        "moodboard": MOODBOARD_PATH,
        "person": PERSON_PHOTO,
        "profile": (stages.result("profile_classification") or {}).get("profile"),
        "recommendation": (stages.result("fuzzy_recommendation") or {}).get("recommendation"),
        "sources": (stages.result("item_matching") or {}).get("sources"),
        "annotated": (stages.result("vto_chain") or {}).get("annotated"),
        "render_url": (stages.result("vto_chain") or {}).get("render_url"),
        "render_saved_path": (stages.result("vto_chain") or {}).get("local_path"),
        "api_endpoint": stages.result("api_endpoint"),
    }
    write_results(stages, artifacts)
    print_summary(stages)

    return 0 if all(e["status"] == PASS for e in stages.entries) else 1


if __name__ == "__main__":
    raise SystemExit(main())
