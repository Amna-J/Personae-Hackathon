"""
Fuzzy Logic Fashion Recommendation Engine
==========================================
Inputs  : Skin Tone  (Black | Dark | Fair | Medium)
          Under Tone (Cool  | Neutral | Warm)
          Body Shape (Apple | Hourglass | Inverted Triangle | Pear | Rectangle)

Outputs : 10 personalised fashion attributes derived from all 60 rule combinations.

Usage
-----
    from fuzzy_recommendation_engine import FuzzyRecommendationEngine, MissingModelValueError

    engine = FuzzyRecommendationEngine()
    result = engine.recommend(
        skin_tone="Fair",
        under_tone="Warm",
        body_shape="Hourglass"
    )
    print(result)
"""

from __future__ import annotations
import os
import logging
from dataclasses import dataclass, asdict
from typing import Optional

# ---------------------------------------------------------------------------
# Optional: install numpy/pandas only if present; engine works without them
# ---------------------------------------------------------------------------
try:
    import numpy as np
    _HAS_NUMPY = True
except ImportError:
    _HAS_NUMPY = False

logging.basicConfig(level=logging.INFO, format="%(levelname)s | %(message)s")
logger = logging.getLogger(__name__)


# ===========================================================================
# Custom Exception
# ===========================================================================

class MissingModelValueError(ValueError):
    """
    Raised when one or more upstream model outputs have not been saved.

    Attributes
    ----------
    missing_fields : list[str]
        Names of the fields that are None / empty.
    redirect_to    : str
        A hint for the UI layer – which page/route to redirect to.
    """

    def __init__(self, missing_fields: list[str], redirect_to: str = "analysis_page"):
        self.missing_fields = missing_fields
        self.redirect_to    = redirect_to
        field_list          = ", ".join(missing_fields)
        super().__init__(
            f"Missing model output(s): [{field_list}]. "
            f"Please complete the analysis before running recommendations. "
            f"Redirect → {redirect_to}"
        )


# ===========================================================================
# Result dataclass
# ===========================================================================

@dataclass
class RecommendationResult:
    """Holds all 10 fashion recommendation outputs for a single combination."""

    skin_tone:                           str
    under_tone:                          str
    body_shape:                          str
    confidence:                          float           # fuzzy match confidence 0-1

    recommended_clothing_colors:         str
    avoid_clothing_colors:               str
    recommended_fitting_style:           str
    recommended_materials:               str
    recommended_patterns:                str
    recommended_jewelry_metal:           str
    recommended_color_wheel_region:      str
    avoid_color_wheel_region:            str
    dont_exaggerate:                     str
    do_exaggerate:                       str

    def to_dict(self) -> dict:
        return asdict(self)

    def pretty_print(self) -> None:
        divider = "=" * 65
        print(f"\n{divider}")
        print(f"  FASHION RECOMMENDATION  |  Confidence: {self.confidence:.0%}")
        print(divider)
        print(f"  Skin Tone   : {self.skin_tone}")
        print(f"  Under Tone  : {self.under_tone}")
        print(f"  Body Shape  : {self.body_shape}")
        print(divider)
        print(f"  ✅  Recommended Colors  : {self.recommended_clothing_colors}")
        print(f"  ❌  Avoid Colors        : {self.avoid_clothing_colors}")
        print(f"  👗  Fitting Style       : {self.recommended_fitting_style}")
        print(f"  🧵  Materials           : {self.recommended_materials}")
        print(f"  🔲  Patterns            : {self.recommended_patterns}")
        print(f"  💍  Jewelry Metal       : {self.recommended_jewelry_metal}")
        print(f"  🎨  Color Wheel (Yes)   : {self.recommended_color_wheel_region}")
        print(f"  🎨  Color Wheel (Avoid) : {self.avoid_color_wheel_region}")
        print(f"  ⚠️   Don't Exaggerate    : {self.dont_exaggerate}")
        print(f"  ✨  Do Exaggerate       : {self.do_exaggerate}")
        print(divider)

# ===========================================================================
# Fuzzy Membership Functions
# ===========================================================================

class FuzzyMembership:
    """
    Computes soft membership degrees for each categorical input.

    Because the three upstream models produce discrete labels, adjacency
    is encoded here so that borderline predictions still receive partial
    credit from neighbouring rules rather than a hard zero.
    """

    # Adjacency weights for Skin Tone (ordered light → dark)
    _SKIN_TONE_ORDER = ["Fair", "Medium", "Dark", "Black"]

    # Adjacency weights for Under Tone (ordered cool → warm)
    _UNDER_TONE_ORDER = ["Cool", "Neutral", "Warm"]

    # Body shape groups that share structural advice
    _BODY_SHAPE_NEIGHBOURS: dict[str, list[str]] = {
        "Rectangle":          ["Hourglass"],
        "Hourglass":          ["Rectangle", "Pear"],
        "Pear":               ["Hourglass", "Apple"],
        "Apple":              ["Pear"],
        "Inverted Triangle":  ["Rectangle"],
    }

    @classmethod
    def skin_tone_membership(cls, input_val: str, rule_val: str) -> float:
        """Return membership degree in [0, 1] of input relative to rule target."""
        if input_val == rule_val:
            return 1.0
        try:
            i_idx = cls._SKIN_TONE_ORDER.index(input_val)
            r_idx = cls._SKIN_TONE_ORDER.index(rule_val)
            distance = abs(i_idx - r_idx)
        except ValueError:
            return 0.0
        # Adjacent tones get 0.55, two-apart get 0.20, further → 0.0
        return {1: 0.55, 2: 0.20}.get(distance, 0.0)

    @classmethod
    def under_tone_membership(cls, input_val: str, rule_val: str) -> float:
        if input_val == rule_val:
            return 1.0
        try:
            i_idx = cls._UNDER_TONE_ORDER.index(input_val)
            r_idx = cls._UNDER_TONE_ORDER.index(rule_val)
            distance = abs(i_idx - r_idx)
        except ValueError:
            return 0.0
        return {1: 0.50}.get(distance, 0.0)

    @classmethod
    def body_shape_membership(cls, input_val: str, rule_val: str) -> float:
        if input_val == rule_val:
            return 1.0
        neighbours = cls._BODY_SHAPE_NEIGHBOURS.get(input_val, [])
        return 0.45 if rule_val in neighbours else 0.0

    @classmethod
    def combined_activation(
        cls,
        input_skin: str,
        input_under: str,
        input_body: str,
        rule_skin: str,
        rule_under: str,
        rule_body: str,
    ) -> float:
        """
        Overall rule activation = weighted product of three memberships.
        Exact matches yield 1.0; partial matches produce values > 0.
        """
        ms = cls.skin_tone_membership(input_skin, rule_skin)
        mu = cls.under_tone_membership(input_under, rule_under)
        mb = cls.body_shape_membership(input_body, rule_body)

        # Fuzzy AND via product t-norm
        activation = ms * mu * mb
        return round(activation, 4)


# ===========================================================================
# Rule Base  (all 60 combinations encoded from the CSV)
# ===========================================================================

# Each rule is a dict:
#   keys   – (skin_tone, under_tone, body_shape)
#   values – 10-tuple of recommendation strings

_RULE_BASE: dict[tuple, tuple] = {
    # ── BLACK ──────────────────────────────────────────────────────────────
    ("Black", "Cool", "Apple"): (
        "Jewel Tones, Icy Blue, Lavender, Silver, Emerald",
        "Orange, Mustard, Brown",
        "Empire Waist",
        "Drapey Fabric",
        "Dark Solid Tops",
        "Silver",
        "Cool colors (blue, green, violet, cool grays)",
        "Opposite on color wheel",
        "Don't exaggerate waist",
        "Exaggerate shoulders and legs",
    ),
    ("Black", "Cool", "Hourglass"): (
        "Jewel Tones, Icy Blue, Lavender, Silver, Emerald",
        "Orange, Mustard, Brown",
        "Tailored Fit",
        "Stretchy, Soft Fabric",
        "Subtle Prints",
        "Silver",
        "Cool colors (blue, green, violet, cool grays)",
        "Opposite on color wheel",
        "Don't exaggerate curves excessively",
        "Highlight waistline",
    ),
    ("Black", "Cool", "Inverted Triangle"): (
        "Jewel Tones, Icy Blue, Lavender, Silver, Emerald",
        "Orange, Mustard, Brown",
        "A-Line Bottoms",
        "Flowy Fabric",
        "Vertical Stripes",
        "Silver",
        "Cool colors (blue, green, violet, cool grays)",
        "Opposite on color wheel",
        "Don't exaggerate shoulders",
        "Exaggerate hips",
    ),
    ("Black", "Cool", "Pear"): (
        "Jewel Tones, Icy Blue, Lavender, Silver, Emerald",
        "Orange, Mustard, Brown",
        "Emphasize Top",
        "Lightweight Cotton",
        "Bright Tops",
        "Silver",
        "Cool colors (blue, green, violet, cool grays)",
        "Opposite on color wheel",
        "Don't exaggerate hips",
        "Exaggerate upper body",
    ),
    ("Black", "Cool", "Rectangle"): (
        "Jewel Tones, Icy Blue, Lavender, Silver, Emerald",
        "Orange, Mustard, Brown",
        "Defined Waist",
        "Structured Cotton",
        "Curved Lines",
        "Silver",
        "Cool colors (blue, green, violet, cool grays)",
        "Opposite on color wheel",
        "Don't exaggerate straight lines",
        "Exaggerate waistline",
    ),
    ("Black", "Neutral", "Apple"): (
        "Soft Pinks, Plums, Teal, Neutral Beige",
        "Fluorescents, Harsh Yellow",
        "Empire Waist",
        "Drapey Fabric",
        "Dark Solid Tops",
        "Rose Gold",
        "Neutral-friendly zones (balanced warm/cool like teal, plum, taupe)",
        "Avoid clashing or harsh contrasts",
        "Don't exaggerate waist",
        "Exaggerate shoulders and legs",
    ),
    ("Black", "Neutral", "Hourglass"): (
        "Soft Pinks, Plums, Teal, Neutral Beige",
        "Fluorescents, Harsh Yellow",
        "Tailored Fit",
        "Stretchy, Soft Fabric",
        "Subtle Prints",
        "Rose Gold",
        "Neutral-friendly zones (balanced warm/cool like teal, plum, taupe)",
        "Avoid clashing or harsh contrasts",
        "Don't exaggerate curves excessively",
        "Highlight waistline",
    ),
    ("Black", "Neutral", "Inverted Triangle"): (
        "Soft Pinks, Plums, Teal, Neutral Beige",
        "Fluorescents, Harsh Yellow",
        "A-Line Bottoms",
        "Flowy Fabric",
        "Vertical Stripes",
        "Rose Gold",
        "Neutral-friendly zones (balanced warm/cool like teal, plum, taupe)",
        "Avoid clashing or harsh contrasts",
        "Don't exaggerate shoulders",
        "Exaggerate hips",
    ),
    ("Black", "Neutral", "Pear"): (
        "Soft Pinks, Plums, Teal, Neutral Beige",
        "Fluorescents, Harsh Yellow",
        "Emphasize Top",
        "Lightweight Cotton",
        "Bright Tops",
        "Rose Gold",
        "Neutral-friendly zones (balanced warm/cool like teal, plum, taupe)",
        "Avoid clashing or harsh contrasts",
        "Don't exaggerate hips",
        "Exaggerate upper body",
    ),
    ("Black", "Neutral", "Rectangle"): (
        "Soft Pinks, Plums, Teal, Neutral Beige",
        "Fluorescents, Harsh Yellow",
        "Defined Waist",
        "Structured Cotton",
        "Curved Lines",
        "Rose Gold",
        "Neutral-friendly zones (balanced warm/cool like teal, plum, taupe)",
        "Avoid clashing or harsh contrasts",
        "Don't exaggerate straight lines",
        "Exaggerate waistline",
    ),
    ("Black", "Warm", "Apple"): (
        "Earth Tones, Olive, Coral, Peach, Mustard, Warm Red",
        "Cool Blue, Icy Gray, Jewel Tones",
        "Empire Waist",
        "Drapey Fabric",
        "Dark Solid Tops",
        "Gold",
        "Warm colors (red, orange, yellow, warm greens)",
        "Opposite on color wheel",
        "Don't exaggerate waist",
        "Exaggerate shoulders and legs",
    ),
    ("Black", "Warm", "Hourglass"): (
        "Earth Tones, Olive, Coral, Peach, Mustard, Warm Red",
        "Cool Blue, Icy Gray, Jewel Tones",
        "Tailored Fit",
        "Stretchy, Soft Fabric",
        "Subtle Prints",
        "Gold",
        "Warm colors (red, orange, yellow, warm greens)",
        "Opposite on color wheel",
        "Don't exaggerate curves excessively",
        "Highlight waistline",
    ),
    ("Black", "Warm", "Inverted Triangle"): (
        "Earth Tones, Olive, Coral, Peach, Mustard, Warm Red",
        "Cool Blue, Icy Gray, Jewel Tones",
        "A-Line Bottoms",
        "Flowy Fabric",
        "Vertical Stripes",
        "Gold",
        "Warm colors (red, orange, yellow, warm greens)",
        "Opposite on color wheel",
        "Don't exaggerate shoulders",
        "Exaggerate hips",
    ),
    ("Black", "Warm", "Pear"): (
        "Earth Tones, Olive, Coral, Peach, Mustard, Warm Red",
        "Cool Blue, Icy Gray, Jewel Tones",
        "Emphasize Top",
        "Lightweight Cotton",
        "Bright Tops",
        "Gold",
        "Warm colors (red, orange, yellow, warm greens)",
        "Opposite on color wheel",
        "Don't exaggerate hips",
        "Exaggerate upper body",
    ),
    ("Black", "Warm", "Rectangle"): (
        "Earth Tones, Olive, Coral, Peach, Mustard, Warm Red",
        "Cool Blue, Icy Gray, Jewel Tones",
        "Defined Waist",
        "Structured Cotton",
        "Curved Lines",
        "Gold",
        "Warm colors (red, orange, yellow, warm greens)",
        "Opposite on color wheel",
        "Don't exaggerate straight lines",
        "Exaggerate waistline",
    ),

    # ── DARK ───────────────────────────────────────────────────────────────
    ("Dark", "Cool", "Apple"): (
        "Jewel Tones, Icy Blue, Lavender, Silver, Emerald",
        "Orange, Mustard, Brown",
        "Empire Waist",
        "Drapey Fabric",
        "Dark Solid Tops",
        "Silver",
        "Cool colors (blue, green, violet, cool grays)",
        "Opposite on color wheel",
        "Don't exaggerate waist",
        "Exaggerate shoulders and legs",
    ),
    ("Dark", "Cool", "Hourglass"): (
        "Jewel Tones, Icy Blue, Lavender, Silver, Emerald",
        "Orange, Mustard, Brown",
        "Tailored Fit",
        "Stretchy, Soft Fabric",
        "Subtle Prints",
        "Silver",
        "Cool colors (blue, green, violet, cool grays)",
        "Opposite on color wheel",
        "Don't exaggerate curves excessively",
        "Highlight waistline",
    ),
    ("Dark", "Cool", "Inverted Triangle"): (
        "Jewel Tones, Icy Blue, Lavender, Silver, Emerald",
        "Orange, Mustard, Brown",
        "A-Line Bottoms",
        "Flowy Fabric",
        "Vertical Stripes",
        "Silver",
        "Cool colors (blue, green, violet, cool grays)",
        "Opposite on color wheel",
        "Don't exaggerate shoulders",
        "Exaggerate hips",
    ),
    ("Dark", "Cool", "Pear"): (
        "Jewel Tones, Icy Blue, Lavender, Silver, Emerald",
        "Orange, Mustard, Brown",
        "Emphasize Top",
        "Lightweight Cotton",
        "Bright Tops",
        "Silver",
        "Cool colors (blue, green, violet, cool grays)",
        "Opposite on color wheel",
        "Don't exaggerate hips",
        "Exaggerate upper body",
    ),
    ("Dark", "Cool", "Rectangle"): (
        "Jewel Tones, Icy Blue, Lavender, Silver, Emerald",
        "Orange, Mustard, Brown",
        "Defined Waist",
        "Structured Cotton",
        "Curved Lines",
        "Silver",
        "Cool colors (blue, green, violet, cool grays)",
        "Opposite on color wheel",
        "Don't exaggerate straight lines",
        "Exaggerate waistline",
    ),
    ("Dark", "Neutral", "Apple"): (
        "Soft Pinks, Plums, Teal, Neutral Beige",
        "Fluorescents, Harsh Yellow",
        "Empire Waist",
        "Drapey Fabric",
        "Dark Solid Tops",
        "Rose Gold",
        "Neutral-friendly zones (balanced warm/cool like teal, plum, taupe)",
        "Avoid clashing or harsh contrasts",
        "Don't exaggerate waist",
        "Exaggerate shoulders and legs",
    ),
    ("Dark", "Neutral", "Hourglass"): (
        "Soft Pinks, Plums, Teal, Neutral Beige",
        "Fluorescents, Harsh Yellow",
        "Tailored Fit",
        "Stretchy, Soft Fabric",
        "Subtle Prints",
        "Rose Gold",
        "Neutral-friendly zones (balanced warm/cool like teal, plum, taupe)",
        "Avoid clashing or harsh contrasts",
        "Don't exaggerate curves excessively",
        "Highlight waistline",
    ),
    ("Dark", "Neutral", "Inverted Triangle"): (
        "Soft Pinks, Plums, Teal, Neutral Beige",
        "Fluorescents, Harsh Yellow",
        "A-Line Bottoms",
        "Flowy Fabric",
        "Vertical Stripes",
        "Rose Gold",
        "Neutral-friendly zones (balanced warm/cool like teal, plum, taupe)",
        "Avoid clashing or harsh contrasts",
        "Don't exaggerate shoulders",
        "Exaggerate hips",
    ),
    ("Dark", "Neutral", "Pear"): (
        "Soft Pinks, Plums, Teal, Neutral Beige",
        "Fluorescents, Harsh Yellow",
        "Emphasize Top",
        "Lightweight Cotton",
        "Bright Tops",
        "Rose Gold",
        "Neutral-friendly zones (balanced warm/cool like teal, plum, taupe)",
        "Avoid clashing or harsh contrasts",
        "Don't exaggerate hips",
        "Exaggerate upper body",
    ),
    ("Dark", "Neutral", "Rectangle"): (
        "Soft Pinks, Plums, Teal, Neutral Beige",
        "Fluorescents, Harsh Yellow",
        "Defined Waist",
        "Structured Cotton",
        "Curved Lines",
        "Rose Gold",
        "Neutral-friendly zones (balanced warm/cool like teal, plum, taupe)",
        "Avoid clashing or harsh contrasts",
        "Don't exaggerate straight lines",
        "Exaggerate waistline",
    ),
    ("Dark", "Warm", "Apple"): (
        "Earth Tones, Olive, Coral, Peach, Mustard, Warm Red",
        "Cool Blue, Icy Gray, Jewel Tones",
        "Empire Waist",
        "Drapey Fabric",
        "Dark Solid Tops",
        "Gold",
        "Warm colors (red, orange, yellow, warm greens)",
        "Opposite on color wheel",
        "Don't exaggerate waist",
        "Exaggerate shoulders and legs",
    ),
    ("Dark", "Warm", "Hourglass"): (
        "Earth Tones, Olive, Coral, Peach, Mustard, Warm Red",
        "Cool Blue, Icy Gray, Jewel Tones",
        "Tailored Fit",
        "Stretchy, Soft Fabric",
        "Subtle Prints",
        "Gold",
        "Warm colors (red, orange, yellow, warm greens)",
        "Opposite on color wheel",
        "Don't exaggerate curves excessively",
        "Highlight waistline",
    ),
    ("Dark", "Warm", "Inverted Triangle"): (
        "Earth Tones, Olive, Coral, Peach, Mustard, Warm Red",
        "Cool Blue, Icy Gray, Jewel Tones",
        "A-Line Bottoms",
        "Flowy Fabric",
        "Vertical Stripes",
        "Gold",
        "Warm colors (red, orange, yellow, warm greens)",
        "Opposite on color wheel",
        "Don't exaggerate shoulders",
        "Exaggerate hips",
    ),
    ("Dark", "Warm", "Pear"): (
        "Earth Tones, Olive, Coral, Peach, Mustard, Warm Red",
        "Cool Blue, Icy Gray, Jewel Tones",
        "Emphasize Top",
        "Lightweight Cotton",
        "Bright Tops",
        "Gold",
        "Warm colors (red, orange, yellow, warm greens)",
        "Opposite on color wheel",
        "Don't exaggerate hips",
        "Exaggerate upper body",
    ),
    ("Dark", "Warm", "Rectangle"): (
        "Earth Tones, Olive, Coral, Peach, Mustard, Warm Red",
        "Cool Blue, Icy Gray, Jewel Tones",
        "Defined Waist",
        "Structured Cotton",
        "Curved Lines",
        "Gold",
        "Warm colors (red, orange, yellow, warm greens)",
        "Opposite on color wheel",
        "Don't exaggerate straight lines",
        "Exaggerate waistline",
    ),

    # ── FAIR ───────────────────────────────────────────────────────────────
    ("Fair", "Cool", "Apple"): (
        "Jewel Tones, Icy Blue, Lavender, Silver, Emerald",
        "Orange, Mustard, Brown",
        "Empire Waist",
        "Drapey Fabric",
        "Dark Solid Tops",
        "Silver",
        "Cool colors (blue, green, violet, cool grays)",
        "Opposite on color wheel",
        "Don't exaggerate waist",
        "Exaggerate shoulders and legs",
    ),
    ("Fair", "Cool", "Hourglass"): (
        "Jewel Tones, Icy Blue, Lavender, Silver, Emerald",
        "Orange, Mustard, Brown",
        "Tailored Fit",
        "Stretchy, Soft Fabric",
        "Subtle Prints",
        "Silver",
        "Cool colors (blue, green, violet, cool grays)",
        "Opposite on color wheel",
        "Don't exaggerate curves excessively",
        "Highlight waistline",
    ),
    ("Fair", "Cool", "Inverted Triangle"): (
        "Jewel Tones, Icy Blue, Lavender, Silver, Emerald",
        "Orange, Mustard, Brown",
        "A-Line Bottoms",
        "Flowy Fabric",
        "Vertical Stripes",
        "Silver",
        "Cool colors (blue, green, violet, cool grays)",
        "Opposite on color wheel",
        "Don't exaggerate shoulders",
        "Exaggerate hips",
    ),
    ("Fair", "Cool", "Pear"): (
        "Jewel Tones, Icy Blue, Lavender, Silver, Emerald",
        "Orange, Mustard, Brown",
        "Emphasize Top",
        "Lightweight Cotton",
        "Bright Tops",
        "Silver",
        "Cool colors (blue, green, violet, cool grays)",
        "Opposite on color wheel",
        "Don't exaggerate hips",
        "Exaggerate upper body",
    ),
    ("Fair", "Cool", "Rectangle"): (
        "Jewel Tones, Icy Blue, Lavender, Silver, Emerald",
        "Orange, Mustard, Brown",
        "Defined Waist",
        "Structured Cotton",
        "Curved Lines",
        "Silver",
        "Cool colors (blue, green, violet, cool grays)",
        "Opposite on color wheel",
        "Don't exaggerate straight lines",
        "Exaggerate waistline",
    ),
    ("Fair", "Neutral", "Apple"): (
        "Soft Pinks, Plums, Teal, Neutral Beige",
        "Fluorescents, Harsh Yellow",
        "Empire Waist",
        "Drapey Fabric",
        "Dark Solid Tops",
        "Rose Gold",
        "Neutral-friendly zones (balanced warm/cool like teal, plum, taupe)",
        "Avoid clashing or harsh contrasts",
        "Don't exaggerate waist",
        "Exaggerate shoulders and legs",
    ),
    ("Fair", "Neutral", "Hourglass"): (
        "Soft Pinks, Plums, Teal, Neutral Beige",
        "Fluorescents, Harsh Yellow",
        "Tailored Fit",
        "Stretchy, Soft Fabric",
        "Subtle Prints",
        "Rose Gold",
        "Neutral-friendly zones (balanced warm/cool like teal, plum, taupe)",
        "Avoid clashing or harsh contrasts",
        "Don't exaggerate curves excessively",
        "Highlight waistline",
    ),
    ("Fair", "Neutral", "Inverted Triangle"): (
        "Soft Pinks, Plums, Teal, Neutral Beige",
        "Fluorescents, Harsh Yellow",
        "A-Line Bottoms",
        "Flowy Fabric",
        "Vertical Stripes",
        "Rose Gold",
        "Neutral-friendly zones (balanced warm/cool like teal, plum, taupe)",
        "Avoid clashing or harsh contrasts",
        "Don't exaggerate shoulders",
        "Exaggerate hips",
    ),
    ("Fair", "Neutral", "Pear"): (
        "Soft Pinks, Plums, Teal, Neutral Beige",
        "Fluorescents, Harsh Yellow",
        "Emphasize Top",
        "Lightweight Cotton",
        "Bright Tops",
        "Rose Gold",
        "Neutral-friendly zones (balanced warm/cool like teal, plum, taupe)",
        "Avoid clashing or harsh contrasts",
        "Don't exaggerate hips",
        "Exaggerate upper body",
    ),
    ("Fair", "Neutral", "Rectangle"): (
        "Soft Pinks, Plums, Teal, Neutral Beige",
        "Fluorescents, Harsh Yellow",
        "Defined Waist",
        "Structured Cotton",
        "Curved Lines",
        "Rose Gold",
        "Neutral-friendly zones (balanced warm/cool like teal, plum, taupe)",
        "Avoid clashing or harsh contrasts",
        "Don't exaggerate straight lines",
        "Exaggerate waistline",
    ),
    ("Fair", "Warm", "Apple"): (
        "Earth Tones, Olive, Coral, Peach, Mustard, Warm Red",
        "Cool Blue, Icy Gray, Jewel Tones",
        "Empire Waist",
        "Drapey Fabric",
        "Dark Solid Tops",
        "Gold",
        "Warm colors (red, orange, yellow, warm greens)",
        "Opposite on color wheel",
        "Don't exaggerate waist",
        "Exaggerate shoulders and legs",
    ),
    ("Fair", "Warm", "Hourglass"): (
        "Earth Tones, Olive, Coral, Peach, Mustard, Warm Red",
        "Cool Blue, Icy Gray, Jewel Tones",
        "Tailored Fit",
        "Stretchy, Soft Fabric",
        "Subtle Prints",
        "Gold",
        "Warm colors (red, orange, yellow, warm greens)",
        "Opposite on color wheel",
        "Don't exaggerate curves excessively",
        "Highlight waistline",
    ),
    ("Fair", "Warm", "Inverted Triangle"): (
        "Earth Tones, Olive, Coral, Peach, Mustard, Warm Red",
        "Cool Blue, Icy Gray, Jewel Tones",
        "A-Line Bottoms",
        "Flowy Fabric",
        "Vertical Stripes",
        "Gold",
        "Warm colors (red, orange, yellow, warm greens)",
        "Opposite on color wheel",
        "Don't exaggerate shoulders",
        "Exaggerate hips",
    ),
    ("Fair", "Warm", "Pear"): (
        "Earth Tones, Olive, Coral, Peach, Mustard, Warm Red",
        "Cool Blue, Icy Gray, Jewel Tones",
        "Emphasize Top",
        "Lightweight Cotton",
        "Bright Tops",
        "Gold",
        "Warm colors (red, orange, yellow, warm greens)",
        "Opposite on color wheel",
        "Don't exaggerate hips",
        "Exaggerate upper body",
    ),
    ("Fair", "Warm", "Rectangle"): (
        "Earth Tones, Olive, Coral, Peach, Mustard, Warm Red",
        "Cool Blue, Icy Gray, Jewel Tones",
        "Defined Waist",
        "Structured Cotton",
        "Curved Lines",
        "Gold",
        "Warm colors (red, orange, yellow, warm greens)",
        "Opposite on color wheel",
        "Don't exaggerate straight lines",
        "Exaggerate waistline",
    ),

    # ── MEDIUM ─────────────────────────────────────────────────────────────
    ("Medium", "Cool", "Apple"): (
        "Jewel Tones, Icy Blue, Lavender, Silver, Emerald",
        "Orange, Mustard, Brown",
        "Empire Waist",
        "Drapey Fabric",
        "Dark Solid Tops",
        "Silver",
        "Cool colors (blue, green, violet, cool grays)",
        "Opposite on color wheel",
        "Don't exaggerate waist",
        "Exaggerate shoulders and legs",
    ),
    ("Medium", "Cool", "Hourglass"): (
        "Jewel Tones, Icy Blue, Lavender, Silver, Emerald",
        "Orange, Mustard, Brown",
        "Tailored Fit",
        "Stretchy, Soft Fabric",
        "Subtle Prints",
        "Silver",
        "Cool colors (blue, green, violet, cool grays)",
        "Opposite on color wheel",
        "Don't exaggerate curves excessively",
        "Highlight waistline",
    ),
    ("Medium", "Cool", "Inverted Triangle"): (
        "Jewel Tones, Icy Blue, Lavender, Silver, Emerald",
        "Orange, Mustard, Brown",
        "A-Line Bottoms",
        "Flowy Fabric",
        "Vertical Stripes",
        "Silver",
        "Cool colors (blue, green, violet, cool grays)",
        "Opposite on color wheel",
        "Don't exaggerate shoulders",
        "Exaggerate hips",
    ),
    ("Medium", "Cool", "Pear"): (
        "Jewel Tones, Icy Blue, Lavender, Silver, Emerald",
        "Orange, Mustard, Brown",
        "Emphasize Top",
        "Lightweight Cotton",
        "Bright Tops",
        "Silver",
        "Cool colors (blue, green, violet, cool grays)",
        "Opposite on color wheel",
        "Don't exaggerate hips",
        "Exaggerate upper body",
    ),
    ("Medium", "Cool", "Rectangle"): (
        "Jewel Tones, Icy Blue, Lavender, Silver, Emerald",
        "Orange, Mustard, Brown",
        "Defined Waist",
        "Structured Cotton",
        "Curved Lines",
        "Silver",
        "Cool colors (blue, green, violet, cool grays)",
        "Opposite on color wheel",
        "Don't exaggerate straight lines",
        "Exaggerate waistline",
    ),
    ("Medium", "Neutral", "Apple"): (
        "Soft Pinks, Plums, Teal, Neutral Beige",
        "Fluorescents, Harsh Yellow",
        "Empire Waist",
        "Drapey Fabric",
        "Dark Solid Tops",
        "Rose Gold",
        "Neutral-friendly zones (balanced warm/cool like teal, plum, taupe)",
        "Avoid clashing or harsh contrasts",
        "Don't exaggerate waist",
        "Exaggerate shoulders and legs",
    ),
    ("Medium", "Neutral", "Hourglass"): (
        "Soft Pinks, Plums, Teal, Neutral Beige",
        "Fluorescents, Harsh Yellow",
        "Tailored Fit",
        "Stretchy, Soft Fabric",
        "Subtle Prints",
        "Rose Gold",
        "Neutral-friendly zones (balanced warm/cool like teal, plum, taupe)",
        "Avoid clashing or harsh contrasts",
        "Don't exaggerate curves excessively",
        "Highlight waistline",
    ),
    ("Medium", "Neutral", "Inverted Triangle"): (
        "Soft Pinks, Plums, Teal, Neutral Beige",
        "Fluorescents, Harsh Yellow",
        "A-Line Bottoms",
        "Flowy Fabric",
        "Vertical Stripes",
        "Rose Gold",
        "Neutral-friendly zones (balanced warm/cool like teal, plum, taupe)",
        "Avoid clashing or harsh contrasts",
        "Don't exaggerate shoulders",
        "Exaggerate hips",
    ),
    ("Medium", "Neutral", "Pear"): (
        "Soft Pinks, Plums, Teal, Neutral Beige",
        "Fluorescents, Harsh Yellow",
        "Emphasize Top",
        "Lightweight Cotton",
        "Bright Tops",
        "Rose Gold",
        "Neutral-friendly zones (balanced warm/cool like teal, plum, taupe)",
        "Avoid clashing or harsh contrasts",
        "Don't exaggerate hips",
        "Exaggerate upper body",
    ),
    ("Medium", "Neutral", "Rectangle"): (
        "Soft Pinks, Plums, Teal, Neutral Beige",
        "Fluorescents, Harsh Yellow",
        "Defined Waist",
        "Structured Cotton",
        "Curved Lines",
        "Rose Gold",
        "Neutral-friendly zones (balanced warm/cool like teal, plum, taupe)",
        "Avoid clashing or harsh contrasts",
        "Don't exaggerate straight lines",
        "Exaggerate waistline",
    ),
    ("Medium", "Warm", "Apple"): (
        "Earth Tones, Olive, Coral, Peach, Mustard, Warm Red",
        "Cool Blue, Icy Gray, Jewel Tones",
        "Empire Waist",
        "Drapey Fabric",
        "Dark Solid Tops",
        "Gold",
        "Warm colors (red, orange, yellow, warm greens)",
        "Opposite on color wheel",
        "Don't exaggerate waist",
        "Exaggerate shoulders and legs",
    ),
    ("Medium", "Warm", "Hourglass"): (
        "Earth Tones, Olive, Coral, Peach, Mustard, Warm Red",
        "Cool Blue, Icy Gray, Jewel Tones",
        "Tailored Fit",
        "Stretchy, Soft Fabric",
        "Subtle Prints",
        "Gold",
        "Warm colors (red, orange, yellow, warm greens)",
        "Opposite on color wheel",
        "Don't exaggerate curves excessively",
        "Highlight waistline",
    ),
    ("Medium", "Warm", "Inverted Triangle"): (
        "Earth Tones, Olive, Coral, Peach, Mustard, Warm Red",
        "Cool Blue, Icy Gray, Jewel Tones",
        "A-Line Bottoms",
        "Flowy Fabric",
        "Vertical Stripes",
        "Gold",
        "Warm colors (red, orange, yellow, warm greens)",
        "Opposite on color wheel",
        "Don't exaggerate shoulders",
        "Exaggerate hips",
    ),
    ("Medium", "Warm", "Pear"): (
        "Earth Tones, Olive, Coral, Peach, Mustard, Warm Red",
        "Cool Blue, Icy Gray, Jewel Tones",
        "Emphasize Top",
        "Lightweight Cotton",
        "Bright Tops",
        "Gold",
        "Warm colors (red, orange, yellow, warm greens)",
        "Opposite on color wheel",
        "Don't exaggerate hips",
        "Exaggerate upper body",
    ),
    ("Medium", "Warm", "Rectangle"): (
        "Earth Tones, Olive, Coral, Peach, Mustard, Warm Red",
        "Cool Blue, Icy Gray, Jewel Tones",
        "Defined Waist",
        "Structured Cotton",
        "Curved Lines",
        "Gold",
        "Warm colors (red, orange, yellow, warm greens)",
        "Opposite on color wheel",
        "Don't exaggerate straight lines",
        "Exaggerate waistline",
    ),
}


# ===========================================================================
# Valid category sets (used for validation)
# ===========================================================================

VALID_SKIN_TONES  = {"Black", "Dark", "Fair", "Medium"}
VALID_UNDER_TONES = {"Cool", "Neutral", "Warm"}
VALID_BODY_SHAPES = {"Apple", "Hourglass", "Inverted Triangle", "Pear", "Rectangle"}


# ===========================================================================
# Main Engine
# ===========================================================================

class FuzzyRecommendationEngine:
    """
    Fuzzy logic recommendation engine.

    Steps
    -----
    1. Validate inputs – raise MissingModelValueError if any are absent.
    2. Normalise & canonicalise labels.
    3. Evaluate all 60 rules and compute activation strength.
    4. Pick the rule with the highest activation (defuzzification by max).
    5. Return a RecommendationResult with all 10 fashion attributes.
    """

    def __init__(self) -> None:
        self._rules     = _RULE_BASE
        self._fuzzy     = FuzzyMembership
        logger.info("FuzzyRecommendationEngine initialised with %d rules.", len(self._rules))

    # -----------------------------------------------------------------------
    # Public API
    # -----------------------------------------------------------------------

    def recommend(
        self,
        skin_tone:  Optional[str],
        under_tone: Optional[str],
        body_shape: Optional[str],
    ) -> RecommendationResult:
        """
        Run the fuzzy recommendation pipeline.

        Parameters
        ----------
        skin_tone  : str or None  – output of the skin-tone model
        under_tone : str or None  – output of the under-tone model
        body_shape : str or None  – output of the body-shape model

        Returns
        -------
        RecommendationResult

        Raises
        ------
        MissingModelValueError  – if any input is None / empty
        ValueError              – if an input is not a recognised category
        """
        # ── Step 1: Validate presence ───────────────────────────────────────
        self._validate_presence(skin_tone, under_tone, body_shape)

        # ── Step 2: Normalise (strip whitespace, title-case) ────────────────
        skin_tone  = self._normalise(skin_tone)
        under_tone = self._normalise(under_tone)
        body_shape = self._normalise_body_shape(body_shape)

        # ── Step 3: Validate known categories ──────────────────────────────
        self._validate_categories(skin_tone, under_tone, body_shape)

        # ── Step 4: Fuzzy rule evaluation ───────────────────────────────────
        best_key, best_activation = self._evaluate_rules(skin_tone, under_tone, body_shape)

        logger.info(
            "Best match → %s | activation=%.4f", best_key, best_activation
        )

        # ── Step 5: Build and return result ────────────────────────────────
        outputs = self._rules[best_key]
        return RecommendationResult(
            skin_tone                      = skin_tone,
            under_tone                     = under_tone,
            body_shape                     = body_shape,
            confidence                     = best_activation,
            recommended_clothing_colors    = outputs[0],
            avoid_clothing_colors          = outputs[1],
            recommended_fitting_style      = outputs[2],
            recommended_materials          = outputs[3],
            recommended_patterns           = outputs[4],
            recommended_jewelry_metal      = outputs[5],
            recommended_color_wheel_region = outputs[6],
            avoid_color_wheel_region       = outputs[7],
            dont_exaggerate                = outputs[8],
            do_exaggerate                  = outputs[9],
        )

    # -----------------------------------------------------------------------
    # Private helpers
    # -----------------------------------------------------------------------

    @staticmethod
    def _validate_presence(
        skin_tone:  Optional[str],
        under_tone: Optional[str],
        body_shape: Optional[str],
    ) -> None:
        """Raise MissingModelValueError listing every absent field."""
        missing = []
        if not skin_tone  or str(skin_tone).strip()  == "":
            missing.append("Skin Tone (skin-tone model)")
        if not under_tone or str(under_tone).strip() == "":
            missing.append("Under Tone (under-tone model)")
        if not body_shape or str(body_shape).strip() == "":
            missing.append("Body Shape (body-shape model)")

        if missing:
            raise MissingModelValueError(
                missing_fields=missing,
                redirect_to="analysis_page",
            )

    @staticmethod
    def _validate_categories(skin_tone: str, under_tone: str, body_shape: str) -> None:
        """Raise ValueError for unrecognised category labels."""
        errors = []
        if skin_tone  not in VALID_SKIN_TONES:
            errors.append(
                f"Unknown skin tone '{skin_tone}'. "
                f"Valid: {sorted(VALID_SKIN_TONES)}"
            )
        if under_tone not in VALID_UNDER_TONES:
            errors.append(
                f"Unknown under tone '{under_tone}'. "
                f"Valid: {sorted(VALID_UNDER_TONES)}"
            )
        if body_shape not in VALID_BODY_SHAPES:
            errors.append(
                f"Unknown body shape '{body_shape}'. "
                f"Valid: {sorted(VALID_BODY_SHAPES)}"
            )
        if errors:
            raise ValueError("\n".join(errors))

    @staticmethod
    def _normalise(value: str) -> str:
        """Strip whitespace and apply title-case."""
        return value.strip().title()

    @staticmethod
    def _normalise_body_shape(value: str) -> str:
        """
        Special-case normalisation for body shapes:
        'inverted triangle' → 'Inverted Triangle'.
        """
        cleaned = value.strip()
        # Handle all-caps or irregular casing
        words = cleaned.split()
        return " ".join(w.capitalize() for w in words)

    def _evaluate_rules(
        self,
        skin_tone:  str,
        under_tone: str,
        body_shape: str,
    ) -> tuple[tuple, float]:
        """
        Iterate over all 60 rules, compute fuzzy activation for each,
        and return (best_rule_key, highest_activation).
        """
        best_key        = None
        best_activation = -1.0

        for (r_skin, r_under, r_body), _ in self._rules.items():
            activation = self._fuzzy.combined_activation(
                skin_tone,  under_tone,  body_shape,
                r_skin,     r_under,     r_body,
            )
            if activation > best_activation:
                best_activation = activation
                best_key        = (r_skin, r_under, r_body)

        return best_key, best_activation

    # -----------------------------------------------------------------------
    # Utility
    # -----------------------------------------------------------------------

    def list_valid_inputs(self) -> dict:
        """Return all accepted input categories – useful for UI dropdowns."""
        return {
            "skin_tones":  sorted(VALID_SKIN_TONES),
            "under_tones": sorted(VALID_UNDER_TONES),
            "body_shapes": sorted(VALID_BODY_SHAPES),
        }

    def get_all_rules_summary(self) -> list[dict]:
        """Return a list of all 60 rules as plain dicts – useful for debugging."""
        summary = []
        for (st, ut, bs), outputs in self._rules.items():
            summary.append({
                "skin_tone":                      st,
                "under_tone":                     ut,
                "body_shape":                     bs,
                "recommended_clothing_colors":    outputs[0],
                "avoid_clothing_colors":          outputs[1],
                "recommended_fitting_style":      outputs[2],
                "recommended_materials":          outputs[3],
                "recommended_patterns":           outputs[4],
                "recommended_jewelry_metal":      outputs[5],
                "recommended_color_wheel_region": outputs[6],
                "avoid_color_wheel_region":       outputs[7],
                "dont_exaggerate":                outputs[8],
                "do_exaggerate":                  outputs[9],
            })
        return summary
