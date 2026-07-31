
import sys
import os

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
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

            print("🔥 SENT TO ML:", fields)

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
            print("✅ RECOMMENDATIONS:", recommendations)

            return Response({"recommendations": recommendations}, status=200)

        except PersonaUser.DoesNotExist:
            return Response({"detail": "User not found."}, status=404)

        except Exception as e:
            print("🔥 BACKEND ERROR:", str(e))
            return Response(
                {"detail": "Internal server error", "error": str(e)},
                status=500
            )