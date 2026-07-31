from __future__ import annotations

import base64
import json
import os
import re
import sys
from typing import Any

from dotenv import load_dotenv
from groq import Groq

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env"))


MODEL_NAME = "qwen/qwen3.6-27b"
SYSTEM_PROMPT = """You are a fashion outfit decomposition engine. You analyze a single image containing a styled outfit — typically a Pinterest-style flat-lay, moodboard, or styled photo — and detect every distinct, clearly separable fashion item in it.

For each item you detect, extract:

- "category": exactly one of ["top", "bottom", "full_outfit", "shoes", "bag", "hat", "scarf", "ring", "bracelet", "earrings", "necklace", "watch", "hairstyle_reference", "sunglasses", "other"]
- "label": a short, human-readable description (e.g. "beige double-breasted blazer", "gold hoop earrings")
- "bounding_box": normalized coordinates [x_min, y_min, x_max, y_max], each between 0 and 1, relative to image width/height
- "confidence": a float between 0 and 1 representing how certain you are this is a real, distinct, identifiable item
- "color": the dominant color in plain everyday language (e.g. "sage green", "beige", "black", "gold")
- "silhouette": the cut, shape, or fit (e.g. "tailored", "oversized", "A-line", "wide-leg", "cropped"). Use null if not applicable to this category (e.g. jewelry, sunglasses).
- "pattern": e.g. "solid", "striped", "floral", "checked", "textured". Use null if not clearly visible or not applicable.
- "material_texture": e.g. "cotton", "leather", "knit", "denim", "satin". Use null if not visually inferable.

Rules:
1. Only include items where your confidence is 0.7 or higher. Omit ambiguous, heavily occluded, or uncertain items entirely rather than guessing.
2. If a single garment reads as a co-ordinated top+bottom set (e.g. a matching suit), still output them as two separate entries — one "top", one "bottom" — each with its own bounding box.
3. Sunglasses should still be extracted with full color/label/silhouette detail even though no virtual try-on exists for this category — downstream logic decides what to do with it, not you.
4. Do not invent items that aren't visually present. Do not guess brand names.
5. CRITICAL: The category enum ["top", "bottom", "full_outfit", "shoes", "bag", "hat", "scarf", "ring", "bracelet", "earrings", "necklace", "watch", "hairstyle_reference", "sunglasses", "other"] is EXHAUSTIVE. Do NOT include items that do not map to one of these fashion/wearable categories. Specifically exclude: phones, perfume bottles, makeup, cosmetics, home goods, food, or any other non-fashion objects. "other" should only be used for truly wearable/fashion items that don't fit other categories.
6. Output ONLY a valid JSON array of objects, one per detected item. Every single item in your output MUST include all 8 fields: category, label, bounding_box, confidence, color, silhouette, pattern, material_texture. If a field doesn't clearly apply, set its value to null — do not omit the key. No markdown code fences, no preamble, no explanation, no trailing text — the response must be parseable directly as JSON.
"""
USER_MESSAGE = "Analyze this image and return the JSON array of detected fashion items following the rules above."


def _infer_image_mime_type(image_bytes: bytes) -> str:
    if image_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if image_bytes.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if image_bytes.startswith((b"GIF87a", b"GIF89a")):
        return "image/gif"
    if image_bytes.startswith(b"RIFF") and image_bytes[8:12] == b"WEBP":
        return "image/webp"
    raise ValueError(
        "Unsupported image bytes. Provide a PNG, JPEG, GIF, or WebP file or bytes."
    )


def _prepare_image_payload(image_path_or_bytes: str | bytes) -> dict[str, Any]:
    if isinstance(image_path_or_bytes, bytes):
        mime_type = _infer_image_mime_type(image_path_or_bytes)
        encoded = base64.b64encode(image_path_or_bytes).decode("utf-8")
        return {
            "type": "image_url",
            "image_url": {"url": f"data:{mime_type};base64,{encoded}"},
        }

    if isinstance(image_path_or_bytes, str):
        if image_path_or_bytes.startswith(("http://", "https://", "data:")):
            return {
                "type": "image_url",
                "image_url": {"url": image_path_or_bytes},
            }

        if os.path.isfile(image_path_or_bytes):
            with open(image_path_or_bytes, "rb") as image_file:
                image_bytes = image_file.read()
            mime_type = _infer_image_mime_type(image_bytes)
            encoded = base64.b64encode(image_bytes).decode("utf-8")
            return {
                "type": "image_url",
                "image_url": {"url": f"data:{mime_type};base64,{encoded}"},
            }

        raise FileNotFoundError(
            f"Image file not found: {image_path_or_bytes}. Provide a valid file path or raw bytes."
        )

    raise TypeError("image_path_or_bytes must be a file path string or raw image bytes")


def _strip_markdown_fences(response_text: str) -> str:
    cleaned = response_text.strip()
    
    # Remove <think>...</think> tags and their content
    cleaned = re.sub(r"<think>.*?</think>", "", cleaned, flags=re.DOTALL)
    cleaned = cleaned.strip()
    
    # Remove markdown code fences (```json ... ```)
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)

    # Extract JSON array
    start = cleaned.find("[")
    end = cleaned.rfind("]")
    if start != -1 and end != -1 and end > start:
        cleaned = cleaned[start : end + 1]

    return cleaned


def decompose_moodboard(image_path_or_bytes: str | bytes) -> list[dict]:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError(
            "Missing GROQ_API_KEY environment variable. Set it before calling decompose_moodboard()."
        )

    try:
        client = Groq(api_key=api_key)
    except Exception as exc:  # pragma: no cover - defensive path
        raise RuntimeError(f"Failed to initialize Groq client: {exc}") from exc

    try:
        image_payload = _prepare_image_payload(image_path_or_bytes)
        completion = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": USER_MESSAGE},
                        image_payload,
                    ],
                },
            ],
            temperature=0,
            max_completion_tokens=4096,
            top_p=1,
            stream=False,
            stop=None,
            reasoning_effort="none",
            response_format={"type": "json_object"},
        )
    except Exception as exc:  # pragma: no cover - defensive path
        raise RuntimeError(f"Groq API request failed: {exc}") from exc

    try:
        message = completion.choices[0].message
        content = message.content
        if isinstance(content, list):
            text = "".join(
                block.get("text", "") if isinstance(block, dict) else str(block)
                for block in content
            )
        else:
            text = str(content or "")
    except Exception as exc:  # pragma: no cover - defensive path
        raise RuntimeError(f"Groq returned an unexpected response structure: {exc}") from exc

    if not text.strip():
        raise RuntimeError("Groq returned an empty response.")

    try:
        parsed = json.loads(_strip_markdown_fences(text))
    except json.JSONDecodeError as exc:
        raise ValueError(f"Groq response was not valid JSON: {exc}") from exc

    if not isinstance(parsed, list):
        raise ValueError(
            f"Groq response was not a JSON array. Received: {type(parsed).__name__}"
        )

    return parsed


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python moodboard_decomposer.py <image_path>")

    image_path = sys.argv[1]
    result = decompose_moodboard(image_path)
    print(json.dumps(result, indent=2))
