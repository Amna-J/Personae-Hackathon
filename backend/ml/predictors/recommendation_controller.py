"""
Recommendation Controller
=========================
This module is the bridge between your three upstream analysis models
and the fuzzy recommendation engine.  Drop it into your Visual Studio
project and call ``run_recommendation()`` from whatever view / page
drives the recommendation screen.

Responsibilities
----------------
* Collect the three model outputs from wherever your project stores them
  (session, database, in-memory state, etc.)
* Validate completeness – detect missing values before the engine runs.
* On validation failure → surface per-field errors and signal a redirect
  to the analysis page.
* On success → call the engine, receive results, and return them for
  display.

Usage example (plain Python / console)
---------------------------------------
    from recommendation_controller import RecommendationController

    # Simulate model outputs being partially saved
    controller = RecommendationController()
    controller.set_model_outputs(
        skin_tone  = "Fair",
        under_tone = None,       # ← not yet saved
        body_shape = "Hourglass"
    )

    success, payload = controller.run_recommendation()
    if not success:
        # payload = {"errors": [...], "redirect_to": "analysis_page"}
        print("Redirect to:", payload["redirect_to"])
        for err in payload["errors"]:
            print("  ✗", err)
    else:
        # payload = RecommendationResult
        payload.pretty_print()

Django / Flask integration
--------------------------
    controller.set_model_outputs(**session_data)
    success, payload = controller.run_recommendation()
    if not success:
        return redirect(url_for(payload["redirect_to"]),
                        errors=payload["errors"])
    return render_template("results.html", result=payload.to_dict())
"""

from __future__ import annotations
import logging
from typing import Optional, Union

from .fuzzy_recommendation_engine import (
    FuzzyRecommendationEngine,
    MissingModelValueError,
    RecommendationResult,
    VALID_SKIN_TONES,
    VALID_UNDER_TONES,
    VALID_BODY_SHAPES,
)
logger = logging.getLogger(__name__)


# ===========================================================================
# Error payload helpers
# ===========================================================================

def _error_payload(
    missing_fields: list[str],
    redirect_to:    str = "analysis_page",
    extra_message:  str = "",
) -> dict:
    """Build a standardised error dict that the UI layer can consume."""
    return {
        "success":       False,
        "redirect_to":   redirect_to,
        "missing_fields": missing_fields,
        "errors":        [
            f"Missing required value: {field}" for field in missing_fields
        ] + ([extra_message] if extra_message else []),
        "user_message":  (
            "Some analyses are incomplete. "
            "Please finish all three scans before requesting recommendations."
        ),
    }


# ===========================================================================
# Controller
# ===========================================================================

class RecommendationController:
    """
    Stateful controller that holds the three model outputs and drives the
    recommendation pipeline.

    Parameters (constructor)
    ------------------------
    analysis_page_route : str
        Name / URL of the analysis page to redirect to on failure.
        Defaults to ``"analysis_page"``.
    """

    def __init__(self, analysis_page_route: str = "analysis_page") -> None:
        self._engine               = FuzzyRecommendationEngine()
        self._analysis_page_route  = analysis_page_route

        # Model outputs – populated via set_model_outputs()
        self._skin_tone:  Optional[str] = None
        self._under_tone: Optional[str] = None
        self._body_shape: Optional[str] = None

    # -----------------------------------------------------------------------
    # Setters
    # -----------------------------------------------------------------------

    def set_model_outputs(
        self,
        skin_tone:  Optional[str] = None,
        under_tone: Optional[str] = None,
        body_shape: Optional[str] = None,
    ) -> None:
        """
        Save the outputs from the three upstream models.

        Call this after each individual model completes, or pass all three
        at once.  Passing ``None`` for a field leaves the previous value
        unchanged, so you can call it incrementally.
        """
        if skin_tone  is not None:
            self._skin_tone  = skin_tone
        if under_tone is not None:
            self._under_tone = under_tone
        if body_shape is not None:
            self._body_shape = body_shape

    def clear_model_outputs(self) -> None:
        """Reset all saved model outputs (e.g. when starting a new session)."""
        self._skin_tone  = None
        self._under_tone = None
        self._body_shape = None

    # -----------------------------------------------------------------------
    # Validation (standalone – call before run_recommendation if needed)
    # -----------------------------------------------------------------------

    def validate(self) -> dict:
        """
        Check which model outputs are present without running the engine.

        Returns
        -------
        dict with keys:
            ``valid``         – bool
            ``missing_fields`` – list of field names that are missing
            ``field_status``  – dict mapping each field to True/False
        """
        status = {
            "Skin Tone (skin-tone model)":    bool(self._skin_tone),
            "Under Tone (under-tone model)":  bool(self._under_tone),
            "Body Shape (body-shape model)":  bool(self._body_shape),
        }
        missing = [name for name, present in status.items() if not present]
        return {
            "valid":          len(missing) == 0,
            "missing_fields": missing,
            "field_status":   status,
        }

    # -----------------------------------------------------------------------
    # Main entry point
    # -----------------------------------------------------------------------

    def run_recommendation(
        self,
    ) -> tuple[bool, Union[RecommendationResult, dict]]:
        """
        Execute the full recommendation pipeline.

        Returns
        -------
        (True,  RecommendationResult)  – on success
        (False, error_dict)            – on validation failure

        The ``error_dict`` on failure contains:
            ``success``        : False
            ``redirect_to``    : route name / URL string
            ``missing_fields`` : list[str] of absent model outputs
            ``errors``         : list[str] of human-readable error lines
            ``user_message``   : single summary sentence for UI banner
        """
        # ── 1. Pre-flight validation ────────────────────────────────────────
        validation = self.validate()
        if not validation["valid"]:
            logger.warning(
                "Recommendation blocked – missing fields: %s",
                validation["missing_fields"],
            )
            return False, _error_payload(
                missing_fields=validation["missing_fields"],
                redirect_to=self._analysis_page_route,
            )

        # ── 2. Run engine ───────────────────────────────────────────────────
        try:
            result = self._engine.recommend(
                skin_tone  = self._skin_tone,
                under_tone = self._under_tone,
                body_shape = self._body_shape,
            )
            logger.info("Recommendation generated successfully. Confidence: %.2f", result.confidence)
            return True, result

        except MissingModelValueError as exc:
            # Should not normally reach here after the pre-flight check,
            # but handled defensively.
            logger.error("MissingModelValueError in engine: %s", exc)
            return False, _error_payload(
                missing_fields=exc.missing_fields,
                redirect_to=exc.redirect_to,
            )

        except ValueError as exc:
            logger.error("Invalid category value: %s", exc)
            return False, _error_payload(
                missing_fields=[],
                redirect_to=self._analysis_page_route,
                extra_message=str(exc),
            )

    # -----------------------------------------------------------------------
    # UI helper – current input snapshot
    # -----------------------------------------------------------------------

    def get_current_inputs(self) -> dict:
        """Return the currently stored model outputs as a dict."""
        return {
            "skin_tone":  self._skin_tone,
            "under_tone": self._under_tone,
            "body_shape": self._body_shape,
        }

    def get_valid_options(self) -> dict:
        """Return all accepted input values – useful for populating UI dropdowns."""
        return self._engine.list_valid_inputs()
