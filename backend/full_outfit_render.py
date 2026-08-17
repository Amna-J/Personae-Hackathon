import os
import sys
import json

BACKEND = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BACKEND)
os.chdir(BACKEND)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
import django
django.setup()

from ml.moodboard_decomposer import decompose_moodboard
from ml.vto_pipeline import (
    assign_item_ids,
    split_passing_items,
    attach_reference_images,
    run_core_vto_render,
)
from PIL import Image

MOODBOARD = "ml/testimages/Aug 4, 2026, 01_56_35 AM.png"
PERSON = "ml/testimages/full look.png"
REF_DIR = os.path.join(BACKEND, "ml", "testimages", "_full_outfit_refs")
os.makedirs(REF_DIR, exist_ok=True)

items = decompose_moodboard(MOODBOARD)
print(f"DECOMPOSE: {len(items)} item(s)")
for i, it in enumerate(items):
    print(f"  [{i}] category={it.get('category')!r} label={it.get('label')!r} bbox={it.get('bounding_box')}")
    it["verdict"] = {"matches": True, "confidence": 0.9, "matched_criteria": ["bypassed scorer (quota)"], "mismatched_criteria": [], "reasoning": "Scoring bypassed on user decision; dress forced through as passing."}
    it["passes_threshold"] = True
assign_item_ids(items)

passing = [it for it in items if it.get("passes_threshold")]
split = split_passing_items(passing)
print(f"SPLIT: core={len(split['core_items'])} superseded={len(split['superseded_items'])} scene_styled={len(split['scene_styled_items'])} excluded={len(split['excluded_items'])}")

core_with_refs = attach_reference_images(split["core_items"], MOODBOARD, REF_DIR)
usable_core = [it for it in core_with_refs if it.get("image_path")]
print(f"CORE REFS: {len(usable_core)} usable -> {[c.get('image_path') for c in usable_core]}")

print(f"\nRUNNING chain_vto_steps (YouCam AI Clothes, garment_category=full_body)...")
steps = run_core_vto_render(PERSON, usable_core)
print(f"RENDER STEPS: {json.dumps(steps, indent=2)}")
render_url = steps[-1]["result_url"]
print(f"\nFINAL RENDER URL: {render_url}")

import requests
out_path = os.path.join(REF_DIR, "full_outfit_render.jpg")
resp = requests.get(render_url, timeout=120)
resp.raise_for_status()
with open(out_path, "wb") as fh:
    fh.write(resp.content)
print(f"DOWNLOADED: {out_path} ({len(resp.content)} bytes)")
with open(os.path.join(REF_DIR, "render_url.txt"), "w") as fh:
    fh.write(render_url)
