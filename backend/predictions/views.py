
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser
from ml.registry import registry
from ml.predictors.skin_tone import predict_skin_tone
from ml.predictors.undertone import predict_undertone
from ml.predictors.face_shape import predict_face_shape


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

            result = registry.body_shape.predict(
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
            result = predict_skin_tone(image_file)
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