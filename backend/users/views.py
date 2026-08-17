
import sys
import os

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from .models import PersonaUser
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    ForgotCheckEmailSerializer,
    ForgotResetPasswordSerializer,
    UpdateProfileSerializer,
)

# ML recommendation engine

from ml.predictors.recommendation_controller import RecommendationController

# Full style-check pipeline (moodboard → decompose → match → VTO)

import concurrent.futures
import logging
import tempfile

from ml.moodboard_decomposer import decompose_moodboard
from ml.item_matcher import score_all_items_with_color_fallback
from ml.profile_classifier import classify_profile_from_photo
from ml.vto_pipeline import (
    split_passing_items,
    annotate_render_status,
    assign_item_ids,
    strip_internal_item_fields,
    attach_reference_images,
    run_core_vto_render,
)
from ml.predictors.fuzzy_recommendation_engine import FuzzyRecommendationEngine

logger = logging.getLogger(__name__)

# Upper bound for the whole synchronous pipeline (decomposition + item
# matching + chained VTO rendering). Configurable so the demo timeline can
# tighten/loosen it without a redeploy of the constants.
STYLE_CHECK_TIMEOUT_SECONDS = int(os.getenv("STYLE_CHECK_TIMEOUT_SECONDS", "360"))


class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                {"id": user.id, "username": user.username, "email": user.email},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data
            return Response(
                {"id": user.id, "username": user.username,
                 "email": user.email, "message": "Login successful"},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ForgotCheckEmailView(APIView):
    def post(self, request):
        serializer = ForgotCheckEmailSerializer(data=request.data)
        if serializer.is_valid():
            return Response({"message": "Email found."}, status=status.HTTP_200_OK)
        return Response({"detail": "No account found with this email."},
                        status=status.HTTP_404_NOT_FOUND)


class ForgotResetPasswordView(APIView):
    def post(self, request):
        serializer = ForgotResetPasswordSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Password reset successfully."},
                            status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(APIView):
    def get(self, request):
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({"detail": "user_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = PersonaUser.objects.get(id=user_id)
        except PersonaUser.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response({
            "id":         user.id,
            "username":   user.username,
            "email":      user.email,
            "undertone":  user.undertone  or "-",
            "skin_tone":  user.skin_tone  or "-",
            "body_type":  user.body_type  or "-",
            "face_shape": user.face_shape or "-",
        }, status=status.HTTP_200_OK)

    def patch(self, request):
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({"detail": "user_id is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = PersonaUser.objects.get(id=user_id)
        except PersonaUser.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = UpdateProfileSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Profile updated successfully.", **serializer.data},
                            status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RecommendationView(APIView):
    def get(self, request):
        try:
            user_id = request.query_params.get('user_id')
            if not user_id:
                return Response({"detail": "user_id is required."}, status=400)

            user = PersonaUser.objects.get(id=user_id)

            fields = {
                "body_type":  user.body_type,
                "skin_tone":  user.skin_tone,
                "undertone":  user.undertone,
            }

            for key, value in fields.items():
                if value in [None, "", "-"]:
                    return Response(
                        {"detail": f"{key} is missing. Complete analysis first."},
                        status=400
                    )
                fields[key] = value.strip()

            print("SENT TO ML:", fields)

            controller = RecommendationController()
            controller.set_model_outputs(
                skin_tone  = fields["skin_tone"],
                under_tone = fields["undertone"],
                body_shape = fields["body_type"],
            )

            success, payload = controller.run_recommendation()

            if not success:
                return Response(
                    {
                        "detail": payload["user_message"],
                        "errors": payload["errors"],
                        "missing_fields": payload["missing_fields"],
                    },
                    status=400
                )

            recommendations = payload.to_dict()
            print("RECOMMENDATIONS:", recommendations)

            return Response({"recommendations": recommendations}, status=200)

        except PersonaUser.DoesNotExist:
            return Response({"detail": "User not found."}, status=404)

        except Exception as e:
            print("BACKEND ERROR:", str(e))
            return Response(
                {"detail": "Internal server error", "error": str(e)},
                status=500
            )


class StyleCheckView(APIView):
    """POST /api/users/style-check/

    Runs the complete moodboard pipeline server-side for one user:

        person photo → vision-LLM profile auto-classify (if profile incomplete)
        profile      →  FuzzyRecommendationEngine.recommend()
        image        →  decompose_moodboard()
        items        →  score_all_items_with_color_fallback()
        passing      →  split_passing_items()
        core         →  attach_reference_images() → run_core_vto_render()

    Profile auto-classification uses a Groq vision LLM (same model / pattern
    as ml/moodboard_decomposer.py) and saves the result to the user, so even
    a brand-new user with no prior analysis can run the style-check from two
    photos alone — no trained CV models required.

    Request (multipart/form-data) — both image files are required and uploaded
    fresh in this request. Nothing is pulled from stored data and nothing is
    persisted: this matches every other image endpoint in the app
    (skin-tone / undertone / body-shape), which process bytes in-memory and
    only save derived text fields (skin_tone, undertone, body_type, ...) to
    PersonaUser:
        - user_id        : int, the PersonaUser id
        - moodboard_image: the moodboard / outfit-inspiration image file
                           (flat-lay / product-style) — used for
                           decompose_moodboard() and reference crops
        - person_photo   : the user's own full-length photo, uploaded fresh in
                           this request — used as the src image for
                           run_core_vto_render()

    Response (JSON):
        - user_id, username
        - status        : "completed" | "no_items_detected" | "no_items_passed"
                          | "no_core_items" | "vto_skipped_no_person_photo"
                          | "vto_skipped_no_usable_references" | "vto_failed"
        - vto_status    : "rendered" | "skipped_*" | "failed" | "not_attempted"
        - recommendation: the fuzzy recommendation dict
        - items         : the FULL scored item list (all items, not only passing
                           ones) in the exact score_all_items_with_color_fallback() shape that
                          AIchat.jsx's recommendationContext.itemVerdicts expects.
                          Each item carries an extra "render_status" field
                          ("rendered" | "render_failed" |
                          "not_rendered_category" |
                          "superseded_by_higher_confidence" | "not_attempted")
                          so the UI can distinguish items actually in render_url
                          from items that passed the match but were not shown.
        - render_url    : final chained VTO result URL, or null
        - passed_item_count, split (core/scene_styled/excluded/superseded buckets)

    This is a blocking synchronous call for now (no async task queue). It is
    bounded by STYLE_CHECK_TIMEOUT_SECONDS and returns 504 on timeout.
    """

    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        moodboard_file = request.FILES.get("moodboard_image")
        if moodboard_file is None:
            return Response(
                {
                    "detail": (
                        "No moodboard image provided. Send a multipart request "
                        "with a 'moodboard_image' file."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not getattr(moodboard_file, "size", None):
            return Response(
                {"detail": "Uploaded moodboard image is empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        person_photo = request.FILES.get("person_photo")
        if person_photo is None:
            return Response(
                {
                    "detail": (
                        "No person photo provided. Send a multipart request "
                        "with a 'person_photo' file — it is the VTO source "
                        "image and the app never stores user photos."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not getattr(person_photo, "size", None):
            return Response(
                {"detail": "Uploaded person photo is empty."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        raw_user_id = request.data.get("user_id")
        if raw_user_id in (None, ""):
            return Response(
                {"detail": "user_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            user_id = int(raw_user_id)
        except (TypeError, ValueError):
            return Response(
                {"detail": f"user_id must be an integer, got: {raw_user_id!r}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = PersonaUser.objects.get(id=user_id)
        except PersonaUser.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Profile fields (skin_tone, undertone, body_type) are auto-classified
        # from the person photo via a vision LLM if missing, so there is no
        # hard requirement up front — the style-check works from two photos
        # alone, even with a brand-new user with an empty profile.

        # Run the heavy pipeline in a worker thread so we can enforce a hard
        # wall-clock timeout cross-platform (Windows has no signal.alarm).
        # The worker is pure network/IO (Groq + YouCam) — no ORM access — so
        # it is safe to run detached from the request thread.
        executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)
        future = executor.submit(self._run_pipeline, user, moodboard_file, person_photo)
        try:
            result = future.result(timeout=STYLE_CHECK_TIMEOUT_SECONDS)
        except concurrent.futures.TimeoutError:
            executor.shutdown(wait=False)
            return Response(
                {
                    "detail": (
                        "The style check took longer than the allowed "
                        f"{STYLE_CHECK_TIMEOUT_SECONDS}s and was aborted. "
                        "Please try again — a smaller moodboard image helps."
                    ),
                    "status": "timeout",
                },
                status=status.HTTP_504_GATEWAY_TIMEOUT,
            )
        except (ValueError, TypeError) as exc:
            executor.shutdown(wait=False)
            message = str(exc)
            if "Unsupported image bytes" in message:
                return Response(
                    {"detail": f"Invalid image: {message}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            return Response(
                {"detail": f"Style check failed: {message}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        except Exception as exc:
            executor.shutdown(wait=False)
            logger.exception("Style check pipeline raised an unexpected error")
            return Response(
                {"detail": f"Style check failed: {exc}"},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        executor.shutdown(wait=True)
        return Response(result, status=status.HTTP_200_OK)

    @staticmethod
    def _run_pipeline(user, moodboard_file, person_photo) -> dict:
        """Run the pipeline and return the payload dict. Executes off-thread."""
        moodboard_bytes = moodboard_file.read()
        person_bytes = person_photo.read() if person_photo is not None else None

        with tempfile.TemporaryDirectory(prefix="style_check_") as tmp_dir:
            moodboard_path = os.path.join(
                tmp_dir, "moodboard" + os.path.splitext(moodboard_file.name)[1]
            )
            with open(moodboard_path, "wb") as fh:
                fh.write(moodboard_bytes)

            person_path = None
            if person_bytes:
                person_ext = os.path.splitext(person_photo.name)[1] or ".jpg"
                person_path = os.path.join(tmp_dir, "person" + person_ext)
                with open(person_path, "wb") as fh:
                    fh.write(person_bytes)

            ref_dir = os.path.join(tmp_dir, "refs")
            os.makedirs(ref_dir, exist_ok=True)

            # Auto-classify profile from the person photo if any field is
            # missing — the style-check works end-to-end from two photos even
            # with a brand-new user (no CV models needed).
            if not user.skin_tone or not user.undertone or not user.body_type:
                if person_path is None:
                    raise ValueError(
                        "User has no style profile and no person photo was "
                        "uploaded — cannot auto-classify. Upload a person photo."
                    )
                profile = classify_profile_from_photo(person_path)
                user.skin_tone = profile["skin_tone"]
                user.undertone = profile["under_tone"]
                user.body_type = profile["body_shape"]
                user.save(update_fields=["skin_tone", "undertone", "body_type"])
                logger.info("Auto-classified profile from photo: %s", profile)

            engine = FuzzyRecommendationEngine()
            recommendation = engine.recommend(
                skin_tone=user.skin_tone,
                under_tone=user.undertone,
                body_shape=user.body_type,
            ).to_dict()

            items = decompose_moodboard(moodboard_path)
            # Assign a stable id BEFORE any downstream function copies these
            # dicts (score_all_items_with_color_fallback, attach_reference_images). annotate_render_status
            # matches items on this id, and it is stripped before the response.
            assign_item_ids(items)
            if not items:
                return StyleCheckView._payload(
                    user,
                    recommendation,
                    items=[],
                    status_label="no_items_detected",
                    vto_status="not_attempted",
                )

            scored_items = score_all_items_with_color_fallback(items, recommendation)
            passing_items = [item for item in scored_items if item.get("passes_threshold")]
            split = split_passing_items(passing_items)
            core_items = split["core_items"]

            if not passing_items:
                return StyleCheckView._payload(
                    user,
                    recommendation,
                    items=annotate_render_status(scored_items, split, []),
                    status_label="no_items_passed",
                    vto_status="skipped_no_passing_items",
                    split=split,
                )

            core_with_refs = attach_reference_images(core_items, moodboard_path, ref_dir)
            usable_core = [item for item in core_with_refs if item.get("image_path")]

            render_url = None
            if not core_items:
                status_label = "no_core_items"
                vto_status = "skipped_no_core_items"
            elif not usable_core:
                status_label = "vto_skipped_no_usable_references"
                vto_status = "skipped_no_usable_references"
            elif not person_path:
                status_label = "vto_skipped_no_person_photo"
                vto_status = "skipped_no_person_photo"
            else:
                steps = run_core_vto_render(person_path, usable_core)
                if steps:
                    render_url = steps[-1]["result_url"]
                    status_label = "completed"
                    vto_status = "rendered"
                else:
                    status_label = "vto_failed"
                    vto_status = "failed"

            return StyleCheckView._payload(
                user,
                recommendation,
                items=annotate_render_status(
                    scored_items, split, usable_core if render_url else []
                ),
                status_label=status_label,
                vto_status=vto_status,
                render_url=render_url,
                split=split,
            )

    @staticmethod
    def _payload(
        user,
        recommendation,
        items,
        status_label,
        vto_status,
        render_url=None,
        split=None,
    ) -> dict:
        # Strip internal pipeline bookkeeping (_item_id) before serialization:
        # items and split are the final API response, consumed by the UI/chatbot.
        clean_items = strip_internal_item_fields(items)
        clean_split = (
            {
                bucket: strip_internal_item_fields(bucket_items)
                for bucket, bucket_items in split.items()
            }
            if split
            else {
                "core_items": [],
                "superseded_items": [],
                "scene_styled_items": [],
                "excluded_items": [],
            }
        )
        return {
            "user_id": user.id,
            "username": user.username,
            "status": status_label,
            "vto_status": vto_status,
            "recommendation": recommendation,
            "items": clean_items,
            "render_url": render_url,
            "passed_item_count": sum(
                1 for item in items if item.get("passes_threshold")
            ),
            "split": clean_split,
        }