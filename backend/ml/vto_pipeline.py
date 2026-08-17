from __future__ import annotations

import logging
import os

import numpy as np
from PIL import Image

from ml.youcam_client import chain_vto_steps

logger = logging.getLogger(__name__)

# Categories that go through the CORE Clothes render. AI Clothes is a
# preservation-based virtual try-on: it swaps the garment onto the user's
# source photo and keeps the original background and identity, which is what
# the "see yourself in your photo" promise requires.
CORE_RENDER_CATEGORIES = frozenset({"top", "bottom", "full_outfit"})

# Shoes and Bag are intentionally NOT part of the default chain. Confirmed by
# diag_bg.py measurements and the AI Shoes / AI Bag OpenAPI specs: both
# endpoints re-synthesize the entire scene/background by design (they expose
# only restyle presets such as style_minimalist / style_parisian_chic and no
# background-lock parameter) and re-frame their output to a fixed size.
# Running them inside the chain destroys the preserved background, so passing
# matches are surfaced to the caller via scene_styled_items instead of being
# silently dropped.
SCENE_STYLED_CATEGORIES = frozenset({"shoes", "bag"})

# Jewelry 2d-vto endpoints use a different request schema and currently fail
# with HTTP 400 at task creation; they stay out of the default chain until
# that schema is fixed.
EXCLUDED_CATEGORIES = frozenset(
    {"necklace", "earrings", "ring", "bracelet", "watch"}
)

# VTO body regions (youcam_client._CATEGORY_TO_FEATURE maps each category to a
# cloth garment_category): a top swaps upper_body, a bottom swaps lower_body,
# and a full_outfit swaps the whole body, i.e. BOTH regions. Because the chain
# renders one sequential cloth swap per item, two items mapped to the same
# region cannot both appear in the final render — the second swap overwrites
# the first — so split_passing_items keeps only the highest-confidence item per
# region and surfaces the rest via superseded_items.
BODY_REGIONS_BY_CATEGORY = {
    "top": frozenset({"upper_body"}),
    "bottom": frozenset({"lower_body"}),
    "full_outfit": frozenset({"upper_body", "lower_body"}),
}

# Heuristic warning threshold for reference crops that look like a person
# wearing the item instead of a clean garment. Confirmed via testing: AI
# Clothes VTO rejects reference crops with meaningful skin-pixel content
# (error_editing_failed) and accepts clean garment-on-background crops.
SKIN_FRACTION_WARNING_THRESHOLD = 0.05


def _skin_fraction_pixels(image: Image.Image) -> float:
    """Fraction of pixels matching a heuristic skin-tone detector.

    Same heuristic used in classify_images.py. A high value means the crop
    contains exposed human skin (i.e. a person wearing the item) rather than a
    clean garment laid out on a plain background.
    """
    v = np.asarray(image).astype(np.float32)
    r, g, b = v[..., 0], v[..., 1], v[..., 2]
    mn = v.min(axis=2)
    skin = (
        (r > 95) & (g > 40) & (b > 20) & (r > g) & (r > b)
        & ((r - g) > 15) & ((r - mn) > 15) & ((r - g) < 160) & (r < 245)
    )
    return float(skin.mean())


def _body_regions_for_category(category: str) -> frozenset:
    return BODY_REGIONS_BY_CATEGORY.get((category or "").strip().lower(), frozenset())


def assign_item_ids(items: list[dict]) -> list[dict]:
    """Assign a stable "_item_id" to each item for downstream identity matching.

    Later pipeline steps copy item dicts via {**item, ...} (score_all_items(),
    attach_reference_images(), ...), which breaks id()-based identity — a
    rendered item's copy would never match its original. Call this once, right
    after decompose_moodboard() and before any downstream copy, so every step
    can match items on "_item_id". Mutates and returns the list.

    Non-dict elements (e.g. stray floats leaked out of an upstream parse) are
    skipped with a warning instead of raising an unhelpful TypeError — cheap
    insurance if any future upstream bug of that shape slips past
    decompose_moodboard()'s own element validation.
    """
    for index, item in enumerate(items):
        if not isinstance(item, dict):
            logger.warning(
                "assign_item_ids: skipping non-dict item at index %d "
                "(type=%s) — decompose_moodboard should have filtered this",
                index, type(item).__name__,
            )
            continue
        item["_item_id"] = index
    return items


def _item_identity(item: dict):
    """Stable identity used to match items across dict-copy boundaries."""
    if "_item_id" in item:
        return item["_item_id"]
    return id(item)


def _without_bookkeeping(item: dict) -> dict:
    return {key: value for key, value in item.items() if key != "_item_id"}


def strip_internal_item_fields(items: list[dict]) -> list[dict]:
    """Drop internal bookkeeping (e.g. _item_id) before it reaches the response.

    _item_id is pipeline plumbing; AIchat.jsx and the UI have no use for it.
    """
    return [_without_bookkeeping(item) for item in items]


def _item_confidence(item: dict) -> float:
    """Best confidence signal for deciding which item owns a body region.

    Prefers the matcher verdict confidence (how well the item matched the
    user's style) and falls back to the decomposer detection confidence so
    callers that never ran score_all_items() still dedupe deterministically.
    """
    verdict = item.get("verdict")
    if isinstance(verdict, dict) and verdict.get("confidence") is not None:
        try:
            return float(verdict["confidence"])
        except (TypeError, ValueError):
            pass
    raw = item.get("confidence")
    try:
        return float(raw) if raw is not None else 0.0
    except (TypeError, ValueError):
        return 0.0


def _select_core_by_region(core_items: list[dict]) -> tuple[list[dict], list[dict]]:
    """Keep at most one passing core item per VTO body region.

    top -> upper_body, bottom -> lower_body, full_outfit -> both. Two items
    sharing a region cannot both appear in the final render — a later sequential
    cloth swap on the same region overwrites the earlier one — so the
    highest-confidence item claims the region (sorted by match confidence, then
    detection confidence, then label for deterministic ties) and the rest are
    returned as superseded so callers/UI can surface them instead of silently
    dropping them.

    Returns (winners, superseded).
    """
    winners: list[dict] = []
    superseded: list[dict] = []
    claimed: set = set()
    ordered = sorted(
        core_items,
        key=lambda item: (
            -_item_confidence(item),
            item.get("label") or item.get("category") or "",
        ),
    )
    for item in ordered:
        regions = _body_regions_for_category(item.get("category"))
        if regions & claimed:
            superseded.append(item)
            continue
        claimed |= regions
        winners.append(item)
    return winners, superseded


def split_passing_items(passing_items: list[dict]) -> dict[str, list[dict]]:
    """Bucket item-matcher passing items for the default render flow.

    Items with passes_threshold=True are split into four lists:

    - core_items:         categories in CORE_RENDER_CATEGORIES, deduplicated so
                          at most one item is kept per VTO body region
                          (see BODY_REGIONS_BY_CATEGORY). Only these are
                          chained via chain_vto_steps; the highest-confidence
                          item wins each region because a second sequential
                          cloth swap on the same region would overwrite the
                          first in the render.
    - superseded_items:   core-renderable items that passed the match but lost
                          their body region to a higher-confidence item. Kept
                          so callers/UI can surface them rather than dropping
                          them silently.
    - scene_styled_items: shoes/bag that matched the styling but are excluded
                          from the default chain (see SCENE_STYLED_CATEGORIES
                          comment for why). Kept so callers/UI can still show
                          they passed the match.
    - excluded_items:     everything else (jewelry, hats, sunglasses, ...).

    No passing item is silently dropped; items that match but are not rendered
    are always returned in one of the non-core lists.

    Buckets hold the same dict objects passed in (no copies), so each item's
    "_item_id" (see assign_item_ids) is preserved as-is.
    """
    core_items: list[dict] = []
    scene_styled_items: list[dict] = []
    excluded_items: list[dict] = []
    for item in passing_items:
        category = (item.get("category") or "").strip().lower()
        if category in CORE_RENDER_CATEGORIES:
            core_items.append(item)
        elif category in SCENE_STYLED_CATEGORIES:
            scene_styled_items.append(item)
        else:
            excluded_items.append(item)

    core_items, superseded_items = _select_core_by_region(core_items)

    return {
        "core_items": core_items,
        "superseded_items": superseded_items,
        "scene_styled_items": scene_styled_items,
        "excluded_items": excluded_items,
    }


def annotate_render_status(
    scored_items: list[dict],
    split: dict,
    rendered_items: list[dict],
) -> list[dict]:
    """Attach item["render_status"] for the StyleCheck response.

    Distinguishes items actually present in the chained render_url from items
    that passed the match but were never sent to VTO:

    - "rendered":                        passed AND present in the final render.
    - "render_failed":                   passed and won its body region (it was
                                         a core candidate for chain_vto_steps)
                                         but the render never completed
                                         successfully — the chain raised, timed
                                         out, or ended in "failed"/skipped. This
                                         is a transient outcome a retry might
                                         fix, not a structural limitation.
    - "not_rendered_category":           passed, but its category is not part of
                                         the core VTO chain (shoes/bag/jewelry/
                                         sunglasses/...).
    - "superseded_by_higher_confidence": passed and core-renderable, but a
                                         higher-confidence item owns the same
                                         body region so it was dropped from the
                                         chain (see split_passing_items).
    - "not_attempted":                   did not pass the match (or its category
                                         was never eligible for rendering at
                                         all), so it was never sent to VTO.

    Items are matched on their stable "_item_id" (see assign_item_ids) because
    downstream steps such as attach_reference_images() copy dicts via
    {**item, ...}, which would break id()-based matching. assign_item_ids() must
    run before any such copy; callers that skip it fall back to id().
    """
    rendered_ids = {_item_identity(item) for item in rendered_items}
    superseded_ids = {_item_identity(item) for item in split.get("superseded_items") or []}
    scene_styled_ids = {_item_identity(item) for item in split.get("scene_styled_items") or []}
    excluded_ids = {_item_identity(item) for item in split.get("excluded_items") or []}

    annotated = []
    for item in scored_items:
        item_id = _item_identity(item)
        if not item.get("passes_threshold"):
            status = "not_attempted"
        elif item_id in rendered_ids:
            status = "rendered"
        elif item_id in superseded_ids:
            status = "superseded_by_higher_confidence"
        elif item_id in scene_styled_ids or item_id in excluded_ids:
            status = "not_rendered_category"
        else:
            # Passing core item that won its body region but was not rendered:
            # render_url is null because the chain was skipped or failed.
            status = "render_failed"
        annotated.append({**item, "render_status": status})
    return annotated


def attach_reference_images(
    items: list[dict],
    moodboard_path: str,
    ref_dir: str,
    pad: float = 0.02,
) -> list[dict]:
    """Crop each item's bounding box from the moodboard into a reference image.

    The cropped image path is attached as item["image_path"] so chain_vto_steps
    can upload it. Items without a usable bounding box are returned with
    image_path=None so callers can skip or surface them explicitly.

    IMPORTANT: moodboard_path must be a flat-lay/product-style image (items
    laid out or shown on a plain background), NOT a photo of a person wearing
    the items. Confirmed via testing: AI Clothes VTO rejects reference crops
    with meaningful skin-pixel content (error_editing_failed) but accepts
    clean garment-on-background crops. The user's own person photo must always
    be a separate image from the moodboard.
    """
    moodboard = Image.open(moodboard_path).convert("RGB")
    width, height = moodboard.size
    prepared: list[dict] = []
    for index, item in enumerate(items):
        bb = item.get("bounding_box")
        if not bb or len(bb) != 4:
            # Spread copy preserves every field, including the stable "_item_id"
            # (see assign_item_ids), so annotate_render_status() can still match
            # this item across the copy boundary.
            prepared.append({**item, "image_path": None})
            continue
        x0, y0, x1, y1 = bb
        cx0 = max(0, int((x0 - pad) * width))
        cy0 = max(0, int((y0 - pad) * height))
        cx1 = min(width, int((x1 + pad) * width))
        cy1 = min(height, int((y1 + pad) * height))
        if cx1 - cx0 < 10 or cy1 - cy0 < 10:
            prepared.append({**item, "image_path": None})
            continue
        crop = moodboard.crop((cx0, cy0, cx1, cy1))
        skin_fraction = _skin_fraction_pixels(crop)
        category = (item.get("category") or "item").strip().lower()
        out_path = os.path.join(ref_dir, "vto_ref_%02d_%s.jpg" % (index, category))
        crop.save(out_path, "JPEG")
        if skin_fraction > SKIN_FRACTION_WARNING_THRESHOLD:
            logger.warning(
                "Reference crop %s has %.1f%% skin-pixel content; AI Clothes VTO "
                "rejects person-wearing reference crops (error_editing_failed). "
                "moodboard_path must be a flat-lay/product image (items laid out "
                "or on a plain background), NOT a photo of a person wearing the "
                "items; the user's person photo must be a separate image.",
                out_path, skin_fraction * 100,
            )
        prepared.append({**item, "image_path": out_path})
    return prepared


def run_core_vto_render(user_photo_path: str, core_items: list[dict]) -> list[dict]:
    """Run the core cloth-only render chain via chain_vto_steps."""
    return chain_vto_steps(user_photo_path, core_items)
