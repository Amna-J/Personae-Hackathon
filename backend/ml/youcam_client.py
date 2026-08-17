from __future__ import annotations

import os
import time

import requests
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env"))


class YouCamError(RuntimeError):
    pass


def _base_url() -> str:
    return os.getenv("YOUCAM_BASE_URL", "https://yce-api-01.makeupar.com").rstrip("/")


def _auth_headers() -> dict:
    api_key = os.getenv("YOUCAM_API_KEY")
    if not api_key:
        raise YouCamError(
            "Missing YOUCAM_API_KEY environment variable. "
            "Set it in backend/.env before calling any YouCam endpoint."
        )
    return {"Authorization": f"Bearer {api_key}"}


def _json_headers() -> dict:
    headers = _auth_headers()
    headers["Content-Type"] = "application/json"
    return headers


def _handle_response(response: requests.Response, action: str) -> dict:
    if response.status_code >= 400:
        raise YouCamError(
            f"YouCam {action} failed with HTTP {response.status_code}: {response.text[:500]}"
        )
    try:
        return response.json()
    except ValueError as exc:
        raise YouCamError(
            f"YouCam {action} returned a non-JSON response: {response.text[:200]}"
        ) from exc


def _post(path: str, payload: dict, action: str) -> dict:
    response = requests.post(
        _base_url() + path, headers=_json_headers(), json=payload, timeout=60
    )
    return _handle_response(response, action)


def _get(path: str, action: str) -> dict:
    response = requests.get(_base_url() + path, headers=_auth_headers(), timeout=60)
    return _handle_response(response, action)


def _is_url(value) -> bool:
    return isinstance(value, str) and value.startswith(("http://", "https://"))


def _guess_mime_type(filename: str) -> str:
    extension = os.path.splitext(filename)[1].lower()
    return {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".gif": "image/gif",
    }.get(extension, "image/jpeg")


def _read_file(path: str) -> bytes:
    with open(path, "rb") as file:
        return file.read()


def upload_file(file_bytes: bytes, filename: str, feature: str = "cloth") -> str:
    """Upload raw image bytes via the YouCam File API and return the file_id.

    POSTs the file metadata to /s2s/v2.0/file/{feature}, then PUTs the bytes
    to the presigned URL returned by that response.
    """
    payload = {
        "files": [
            {
                "content_type": _guess_mime_type(filename),
                "file_name": filename,
                "file_size": len(file_bytes),
            }
        ]
    }
    response = _post(f"/s2s/v2.0/file/{feature}", payload, "file upload")
    files = response.get("data", {}).get("files") or []
    if not files:
        raise YouCamError("YouCam file upload returned no file entries.")
    file_info = files[0]
    file_id = file_info.get("file_id")
    if not file_id:
        raise YouCamError("YouCam file upload returned no file_id.")
    upload_request = file_info.get("requests") or []
    if not upload_request:
        raise YouCamError("YouCam file upload returned no presigned upload URL.")
    upload_url = upload_request[0]["url"]
    upload_headers = dict(upload_request[0].get("headers") or {})
    upload_headers.setdefault("Content-Type", _guess_mime_type(filename))
    put_response = requests.put(
        upload_url, data=file_bytes, headers=upload_headers, timeout=120
    )
    if put_response.status_code >= 400:
        raise YouCamError(
            f"Presigned upload failed with HTTP {put_response.status_code}: "
            f"{put_response.text[:300]}"
        )
    return file_id


def _build_source_reference_body(src_file_id_or_url: str, ref_file_id_or_url: str) -> dict:
    body = {}
    if _is_url(src_file_id_or_url):
        body["src_file_url"] = src_file_id_or_url
    else:
        body["src_file_id"] = src_file_id_or_url
    if _is_url(ref_file_id_or_url):
        body["ref_file_url"] = ref_file_id_or_url
    else:
        body["ref_file_id"] = ref_file_id_or_url
    return body


def _create_task(feature: str, payload: dict) -> str:
    response = _post(f"/s2s/v2.0/task/{feature}", payload, f"task creation ({feature})")
    task_id = response.get("data", {}).get("task_id")
    if not task_id:
        raise YouCamError(
            f"YouCam task creation ({feature}) returned no task_id: {response}"
        )
    return task_id


def run_cloth_vto(
    src_file_id_or_url: str, ref_file_id_or_url: str, garment_category: str
) -> str:
    """Start an AI Clothes virtual try-on task and return the task_id."""
    payload = _build_source_reference_body(src_file_id_or_url, ref_file_id_or_url)
    payload["garment_category"] = garment_category
    payload["change_shoes"] = False
    return _create_task("cloth", payload)


def run_shoes_vto(
    src_file_id_or_url: str, ref_file_id_or_url: str, gender: str, style: str = "style_minimalist"
) -> str:
    """Start an AI Shoes virtual try-on task and return the task_id.

    style controls how much the engine restyles the outfit/background.
    Default "style_minimalist" preserves the original scene while applying
    the shoes; "random" (API default) tends to regenerate a different scene.
    Other options: "style_bohemian", "style_cottagecore",
    "style_french_elegance", "style_retro_fashion".
    """
    payload = _build_source_reference_body(src_file_id_or_url, ref_file_id_or_url)
    payload["gender"] = gender
    payload["style"] = style
    return _create_task("shoes", payload)


def run_bag_vto(
    src_file_id_or_url: str, ref_file_id_or_url: str, gender: str = "female"
) -> str:
    """Start an AI Bag virtual try-on task and return the task_id."""
    payload = _build_source_reference_body(src_file_id_or_url, ref_file_id_or_url)
    payload["gender"] = gender
    return _create_task("bag", payload)


def run_color_tone_analysis_task(
    src_file_id_or_url: str, face_angle_strictness_level: str = "high"
) -> str:
    """Start an AI Facial Color Tones Analyzer task and return the task_id.

    The source is a face selfie (jpg/jpeg only, face at least 60% of the image
    width, forward-facing). face_angle_strictness_level defaults to "high" per
    the API docs and may be one of strict/high/medium/low/flexible.
    """
    payload = {}
    if _is_url(src_file_id_or_url):
        payload["src_file_url"] = src_file_id_or_url
    else:
        payload["src_file_id"] = src_file_id_or_url
    if face_angle_strictness_level:
        payload["face_angle_strictness_level"] = face_angle_strictness_level
    return _create_task("skin-tone-analysis", payload)


def get_color_tone_result(
    task_id: str, poll_interval: float = 2.0, timeout: float = 180.0
) -> dict:
    """Poll a skin-tone-analysis task and return data['results']['color'].

    Unlike cloth/shoes/bag tasks there is no result image URL — the outcome is
    the color dict in the status response, so this cannot reuse
    get_task_result().
    """
    deadline = time.monotonic() + timeout
    while True:
        response = _get(
            f"/s2s/v2.0/task/skin-tone-analysis/{task_id}",
            "task status (skin-tone-analysis)",
        )
        data = response.get("data") or {}
        status = data.get("task_status") or response.get("task_status")
        if status == "success":
            color = (data.get("results") or {}).get("color")
            if isinstance(color, dict):
                return color
            raise YouCamError(
                f"YouCam task {task_id} succeeded but returned no color result."
            )
        if status in ("error", "failed"):
            message = data.get("error") or response.get("error") or "unknown error"
            raise YouCamError(f"YouCam task {task_id} failed: {message}")
        if time.monotonic() > deadline:
            raise YouCamError(
                f"YouCam task {task_id} did not complete within {timeout}s."
            )
        time.sleep(poll_interval)


def analyze_color_tones(
    src_file_id_or_url: str,
    face_angle_strictness_level: str = "high",
    poll_interval: float = 2.0,
    timeout: float = 180.0,
) -> dict:
    """Run one AI Facial Color Tones Analyzer task and return the color dict.

    The result contains skin_color (hex), eye_color/eye_color_name,
    lip_color, eyebrow_color, and hair_color/hair_color_name. See
    interpret_youcam_color() for mapping skin_color onto Personae's buckets.
    """
    task_id = run_color_tone_analysis_task(
        src_file_id_or_url, face_angle_strictness_level
    )
    return get_color_tone_result(task_id, poll_interval=poll_interval, timeout=timeout)


# AI Facial Color Tones Analyzer returns skin_color as a raw hex value, not a
# Personae category. interpret_youcam_color() buckets that hex onto Personae's
# own categories (VALID_SKIN_TONES / undertone classes in the fuzzy engine)
# with a transparent heuristic so the two reads are comparable. Supporting
# signal only — never used as the scoring input.
_SKIN_TONE_LUMA_CUTOFFS = (
    (190.0, "Fair"),
    (150.0, "Medium"),
    (95.0, "Dark"),
    (0.0, "Black"),
)
_UNDERTONE_RB_DELTA = 14.0


def interpret_youcam_color(color: dict) -> dict:
    """Map YouCam's skin_color hex onto Personae skin-tone/undertone buckets.

    Skin tone is bucketed by perceived luminance (rec.601 weights): >=190 Fair,
    >=150 Medium, >=95 Dark, else Black. Undertone is bucketed by red-blue
    balance: |R-B| above 14 is Warm (R>B) or Cool (B>R), otherwise Neutral.
    """
    skin_hex = (color or {}).get("skin_color")
    if not isinstance(skin_hex, str) or not skin_hex:
        raise YouCamError("Color tone result has no usable skin_color.")
    hex_value = skin_hex.lstrip("#")
    if len(hex_value) != 6:
        raise YouCamError(f"Unexpected skin_color format: {skin_hex!r}")
    r, g, b = (int(hex_value[i : i + 2], 16) for i in (0, 2, 4))
    luma = 0.299 * r + 0.587 * g + 0.114 * b
    skin_tone = next(
        bucket for cutoff, bucket in _SKIN_TONE_LUMA_CUTOFFS if luma >= cutoff
    )
    delta = r - b
    if delta > _UNDERTONE_RB_DELTA:
        undertone = "Warm"
    elif delta < -_UNDERTONE_RB_DELTA:
        undertone = "Cool"
    else:
        undertone = "Neutral"
    return {
        "skin_color_hex": skin_hex.lower(),
        "skin_tone": skin_tone,
        "undertone": undertone,
    }


def _extract_result_url(response: dict):
    data = response.get("data") or {}
    results = data.get("results") or response.get("results")
    candidates = []
    if isinstance(results, dict):
        candidates.append(results.get("url"))
        for value in results.values():
            if isinstance(value, str) and value.startswith("http"):
                candidates.append(value)
    elif isinstance(results, list):
        for item in results:
            if isinstance(item, dict) and item.get("url"):
                candidates.append(item["url"])
            elif isinstance(item, str) and item.startswith("http"):
                candidates.append(item)
    candidates.append(data.get("url"))
    candidates.append(response.get("url"))
    for candidate in candidates:
        if isinstance(candidate, str) and candidate.startswith(("http://", "https://")):
            return candidate
    return None


def get_task_result(
    task_id: str, feature: str = "cloth", poll_interval: float = 2.0, timeout: float = 300.0
) -> str:
    """Poll the task status endpoint until the task completes and return the result URL."""
    deadline = time.monotonic() + timeout
    while True:
        response = _get(f"/s2s/v2.0/task/{feature}/{task_id}", f"task status ({feature})")
        data = response.get("data") or {}
        status = data.get("task_status") or response.get("task_status")
        if status == "success":
            url = _extract_result_url(response)
            if url:
                return url
            raise YouCamError(
                f"YouCam task {task_id} succeeded but returned no result URL."
            )
        if status in ("error", "failed"):
            message = data.get("error") or response.get("error") or "unknown error"
            raise YouCamError(f"YouCam task {task_id} failed: {message}")
        if time.monotonic() > deadline:
            raise YouCamError(
                f"YouCam task {task_id} did not complete within {timeout}s."
            )
        time.sleep(poll_interval)


_CATEGORY_TO_FEATURE = {
    "top": ("cloth", "upper_body"),
    "bottom": ("cloth", "lower_body"),
    "full_outfit": ("cloth", "full_body"),
    "dress": ("cloth", "full_body"),
    "shoes": ("shoes", None),
    "bag": ("bag", None),
    "necklace": ("2d-vto/necklace", None),
    "earrings": ("2d-vto/earring", None),
    "ring": ("2d-vto/ring", None),
    "bracelet": ("2d-vto/bracelet", None),
    "watch": ("2d-vto/watch", None),
}


def _item_feature(category: str) -> tuple:
    key = (category or "").strip().lower()
    if key not in _CATEGORY_TO_FEATURE:
        raise YouCamError(f"Unsupported VTO category for chaining: {category!r}")
    return _CATEGORY_TO_FEATURE[key]


def _upload_reference(item: dict, feature: str) -> str:
    if item.get("image_url"):
        return item["image_url"]
    image_path = item.get("image_path")
    if not image_path:
        raise YouCamError(
            f"Item {item.get('label', item)} has neither 'image_path' nor 'image_url'."
        )
    return upload_file(_read_file(image_path), os.path.basename(image_path), feature=feature)


def chain_vto_steps(user_photo_path: str, items: list[dict]) -> list[dict]:
    """Run multiple VTO steps in sequence.

    The user photo is uploaded once. Each item becomes one virtual try-on
    step; the previous step's result URL (valid for 2 hours) is fed in as the
    next step's src_file_url, since these endpoints do not support dst_id
    chaining.

    Ordering constraint (verified empirically): the shoes engine re-synthesizes
    the whole person, destroying any garment applied by a previous step, while
    the cloth engine preserves context faithfully. Therefore shoes/bag steps
    MUST run before cloth steps; callers should sort items accordingly
    (e.g. shoes first, tops/dresses last).
    """
    if not items:
        raise YouCamError("No items provided for VTO chaining.")
    items = sorted(
        items, key=lambda item: 1 if _item_feature(item.get("category"))[0] == "cloth" else 0
    )

    first_feature, _ = _item_feature(items[0].get("category"))
    src = upload_file(
        _read_file(user_photo_path),
        os.path.basename(user_photo_path),
        feature=first_feature,
    )

    steps = []
    for index, item in enumerate(items):
        category = (item.get("category") or "").strip().lower()
        feature, garment_category = _item_feature(category)
        ref = _upload_reference(item, feature)

        if feature == "cloth":
            task_id = run_cloth_vto(src, ref, garment_category)
        elif feature == "shoes":
            task_id = run_shoes_vto(
                src, ref, item.get("gender") or "female", item.get("style") or "style_minimalist"
            )
        elif feature == "bag":
            task_id = run_bag_vto(src, ref, item.get("gender") or "female")
        else:
            task_id = _create_task(feature, _build_source_reference_body(src, ref))

        result_url = get_task_result(task_id, feature=feature)
        steps.append(
            {
                "index": index,
                "category": category,
                "task_id": task_id,
                "result_url": result_url,
            }
        )
        src = result_url

    return steps
