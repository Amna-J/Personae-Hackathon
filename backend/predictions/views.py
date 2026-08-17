
import io
import os

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser
from PIL import Image
from ml.registry import registry
from ml.predictors.skin_tone import predict_skin_tone
from ml.predictors.undertone import predict_undertone
from ml.predictors.face_shape import predict_face_shape
from ml.youcam_client import (
    analyze_color_tones,
    interpret_youcam_color,
    upload_file,
)

# One YouCam Color Tones Analyzer call is fired per skin-tone analysis (the
# first analysis in the profile flow, so effectively once per session). It is
# a supporting signal beside Personae's own skin-tone read and is never used
# as the scoring input. Set YOUCAM_COLOR_TONE_CROSSCHECK=0 to disable.
YOUCAM_COLOR_TONE_CROSSCHECK_ENABLED = (
    os.getenv("YOUCAM_COLOR_TONE_CROSSCHECK", "1").strip().lower()
    not in ("0", "false", "no", "")
)


def _youcam_color_cross_check(image_bytes: bytes) -> dict:
    """Run the YouCam color-tone cross-check for a face selfie.

    Re-encodes the image as JPEG (YouCam requires jpg/jpeg) and keeps the long
    side under 4096px. Any YouCam failure is non-fatal — the Personae skin-tone
    prediction still stands.
    """
    if not YOUCAM_COLOR_TONE_CROSSCHECK_ENABLED:
        return {"status": "disabled"}
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        if max(img.size) > 4096:
            img.thumbnail((4096, 4096))
        buffer = io.BytesIO()
        img.save(buffer, "JPEG", quality=90)
        file_id = upload_file(
            buffer.getvalue(),
            "color_tone_selfie.jpg",
            feature="skin-tone-analysis",
        )
        color = analyze_color_tones(file_id)
        return {
            "status": "ok",
            **interpret_youcam_color(color),
            "raw": color,
        }
    except Exception as exc:
        return {"status": "unavailable", "reason": str(exc)}


class BodyShapePredictView(APIView):

    def post(self, request):
        required_features = ['shoulder', 'bust', 'waist', 'hip']
        missing_features = [f for f in required_features if request.data.get(f) is None]

        if missing_features:
            return Response({
                'error': f'Missing required measurements: {missing_features}'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            shoulder = float(request.data.get('shoulder'))
            bust     = float(request.data.get('bust'))
            waist    = float(request.data.get('waist'))
            hip      = float(request.data.get('hip'))

            image_bytes = request.FILES['image'].read() if 'image' in request.FILES else None

            result = registry.body_shape_model.predict(
                shoulder=shoulder,
                bust=bust,
                waist=waist,
                hip=hip,
                image_bytes=image_bytes
            )

            return Response(result, status=status.HTTP_200_OK)

        except ValueError as e:
            return Response({'error': f'Invalid number: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': f'Prediction failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SkinTonePredictView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request):
        image_file = request.FILES.get('image')
        if not image_file:
            return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            image_bytes = image_file.read()
            result = predict_skin_tone(io.BytesIO(image_bytes))
            result['youcam_cross_check'] = _youcam_color_cross_check(image_bytes)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': f'Skin tone prediction failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class UndertonePredictView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request):
        image_file = request.FILES.get('image')
        if not image_file:
            return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            result = predict_undertone(image_file)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': f'Undertone prediction failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FaceShapePredictView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request):
        image_file = request.FILES.get('image')
        if not image_file:
            return Response({'error': 'No image provided'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            result = predict_face_shape(image_file)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': f'Face shape prediction failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)