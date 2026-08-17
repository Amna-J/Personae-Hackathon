"""Vision-LLM profile classification from a person photo.

Classifies skin_tone, under_tone, and body_shape from a full-length photo
using a Groq vision LLM.  This replaces the trained CV models (Xception,
Keras, LightGBM/RF/PyTorch) for the profile step so the style-check
pipeline works end-to-end from two photos alone.
"""

from __future__ import annotations

import json
import logging
import os
import re

from dotenv import load_dotenv
from groq import Groq

from ml.predictors.fuzzy_recommendation_engine import (
    VALID_BODY_SHAPES,
    VALID_SKIN_TONES,
    VALID_UNDER_TONES,
)
from ml.moodboard_decomposer import (
    MODEL_NAME,
    _prepare_image_payload,
    _strip_markdown_fences,
)

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env"))

logger = logging.getLogger(__name__)

_PROFILE_SYSTEM_PROMPT = """You are a personal color-and-style analysis engine. You analyze a full-length photo of a person and classify exactly three attributes.

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

_PROFILE_USER_MESSAGE = (
    "Analyze this full-length person photo and return the JSON object with "
    "skin_tone, under_tone, and body_shape using only the allowed values."
)


def _normalise_title(value) -> str | None:
    if not isinstance(value, str) or not value.strip():
        return None
    return value.strip().title()


def _normalise_body_shape(value) -> str | None:
    if not isinstance(value, str) or not value.strip():
        return None
    return " ".join(w.capitalize() for w in value.strip().split())


def validate_profile(raw: dict) -> dict:
    """Normalise + enforce the fixed category sets. Raises on out-of-category values."""
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


def classify_profile_from_photo(
    image_path_or_bytes: str | bytes,
    max_attempts: int = 3,
) -> dict:
    """Classify skin_tone / under_tone / body_shape from a person photo via a vision LLM.

    Uses the same Groq provider / model / prompt pattern as moodboard_decomposer.py.
    Retries up to *max_attempts* times on parse / validation errors.
    Returns a validated dict with keys skin_tone, under_tone, body_shape.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError(
            "Missing GROQ_API_KEY environment variable. "
            "Set it in backend/.env to enable profile classification."
        )
    client = Groq(api_key=api_key)
    image_payload = _prepare_image_payload(image_path_or_bytes)

    last_error = None
    for attempt in range(1, max_attempts + 1):
        try:
            completion = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[
                    {"role": "system", "content": _PROFILE_SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": _PROFILE_USER_MESSAGE},
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
            message = completion.choices[0].message
            content = message.content
            if isinstance(content, list):
                text = "".join(
                    block.get("text", "") if isinstance(block, dict) else str(block)
                    for block in content
                )
            else:
                text = str(content or "")

            if not text.strip():
                raise ValueError("Groq returned an empty response.")

            parsed = json.loads(_strip_markdown_fences(text))
            return validate_profile(parsed)

        except (ValueError, json.JSONDecodeError) as exc:
            last_error = exc
            logger.warning("profile attempt %d/%d failed: %s", attempt, max_attempts, exc)

    raise RuntimeError(
        f"Profile classification failed after {max_attempts} attempt(s). "
        f"Last error: {last_error}"
    )
