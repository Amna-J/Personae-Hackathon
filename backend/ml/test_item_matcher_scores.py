from __future__ import annotations

import json
import os

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env"))

from item_matcher import score_item_against_recommendation

RECOMMENDATION = {
    "skin_tone": "Fair",
    "under_tone": "Warm",
    "body_shape": "Hourglass",
    "confidence": 1.0,
    "recommended_clothing_colors": "Earth Tones, Olive, Coral, Peach, Mustard, Warm Red",
    "avoid_clothing_colors": "Cool Blue, Icy Gray, Jewel Tones",
    "recommended_fitting_style": "Tailored Fit",
    "recommended_materials": "Stretchy, Soft Fabric",
    "recommended_patterns": "Subtle Prints",
    "recommended_jewelry_metal": "Gold",
    "recommended_color_wheel_region": "Warm colors (red, orange, yellow, warm greens)",
    "avoid_color_wheel_region": "Opposite on color wheel",
    "dont_exaggerate": "Don't exaggerate curves excessively",
    "do_exaggerate": "Highlight waistline",
}

ITEMS = [
    {
        "category": "top",
        "label": "beige linen shirt",
        "color": "beige",
        "silhouette": "tailored",
        "pattern": "solid",
        "material_texture": "linen",
        "confidence": 0.9,
    },
    {
        "category": "top",
        "label": "oversized olive green sweater",
        "color": "olive green",
        "silhouette": "oversized",
        "pattern": "solid",
        "material_texture": "wool",
        "confidence": 0.9,
    },
    {
        "category": "necklace",
        "label": "rose gold pendant necklace",
        "color": "rose gold",
        "silhouette": None,
        "pattern": None,
        "material_texture": "metal",
        "confidence": 0.9,
    },
    {
        "category": "top",
        "label": "coral silk blouse",
        "color": "coral",
        "silhouette": "tailored",
        "pattern": "solid",
        "material_texture": "silk",
        "confidence": 0.9,
    },
]


def main() -> None:
    for i, item in enumerate(ITEMS, start=1):
        print(f"{'='*70}")
        print(f"ITEM {i}: {item['label']}")
        print(f"{'='*70}")
        verdict = score_item_against_recommendation(item, RECOMMENDATION)
        print(json.dumps(verdict, indent=2))
        print()


if __name__ == "__main__":
    main()
