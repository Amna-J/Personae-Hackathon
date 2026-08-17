import os
import tempfile

from PIL import Image

from ml.vto_pipeline import (
    annotate_render_status,
    assign_item_ids,
    attach_reference_images,
    split_passing_items,
    strip_internal_item_fields,
)


def _item(category, label, confidence, passes=True):
    return {
        "category": category,
        "label": label,
        "confidence": confidence,
        "verdict": {"confidence": confidence},
        "passes_threshold": passes,
        "bounding_box": [0.05, 0.05, 0.45, 0.45],
    }


def _run_with_real_pipeline_shape(items):
    """Mirror views.StyleCheckView._run_pipeline's copy-heavy flow."""
    scored_items = assign_item_ids(items)
    passing = [i for i in scored_items if i.get("passes_threshold")]
    split = split_passing_items(passing)
    with tempfile.TemporaryDirectory(prefix="vto_pipeline_test_") as tmp:
        moodboard_path = os.path.join(tmp, "moodboard.jpg")
        Image.new("RGB", (200, 200), (230, 220, 210)).save(moodboard_path)
        ref_dir = os.path.join(tmp, "refs")
        os.makedirs(ref_dir, exist_ok=True)
        core_with_refs = attach_reference_images(
            split["core_items"], moodboard_path, ref_dir
        )
        usable_core = [i for i in core_with_refs if i.get("image_path")]
    return scored_items, split, usable_core


def test_rendered_winner_survives_attach_reference_images_copy():
    """Regression test for the id()-identity bug.

    attach_reference_images() copies every item via {**item, ...}, which broke
    id()-based matching: the actually-rendered winner was mislabeled
    "render_failed" even though it rendered fine. Matching must run on the
    stable "_item_id" assigned before any copy.
    """
    scored_items, split, usable_core = _run_with_real_pipeline_shape(
        [
            _item("top", "coat", 0.9),
            _item("top", "sweater", 0.7),
            _item("shoes", "sneakers", 0.95),
        ]
    )

    assert len(usable_core) == 1
    assert all("_item_id" in item for item in usable_core)

    annotated = annotate_render_status(scored_items, split, usable_core)
    statuses = {i["label"]: i["render_status"] for i in annotated}
    assert statuses == {
        "coat": "rendered",
        "sweater": "superseded_by_higher_confidence",
        "sneakers": "not_rendered_category",
    }


def test_unrendered_winner_is_render_failed():
    scored_items, split, usable_core = _run_with_real_pipeline_shape(
        [
            _item("top", "coat", 0.9),
            _item("bottom", "jeans", 0.8),
        ]
    )

    assert len(usable_core) == 2
    # Render never completed: the caller passes no rendered items.
    annotated = annotate_render_status(scored_items, split, [])
    statuses = {i["label"]: i["render_status"] for i in annotated}
    assert statuses == {
        "coat": "render_failed",
        "jeans": "render_failed",
    }


def test_internal_item_ids_stripped_for_response():
    scored_items, split, usable_core = _run_with_real_pipeline_shape(
        [
            _item("top", "coat", 0.9),
            _item("shoes", "sneakers", 0.95),
        ]
    )

    assert all("_item_id" in i for i in scored_items)
    assert all("_item_id" in i for i in split["core_items"])

    annotated = annotate_render_status(scored_items, split, usable_core)
    assert all("_item_id" in i for i in annotated)

    clean_items = strip_internal_item_fields(annotated)
    assert all("_item_id" not in i for i in clean_items)
    assert {i["label"] for i in clean_items} == {"coat", "sneakers"}
    assert {i["render_status"] for i in clean_items} == {
        "rendered",
        "not_rendered_category",
    }

    clean_core = strip_internal_item_fields(split["core_items"])
    assert all("_item_id" not in i for i in clean_core)
