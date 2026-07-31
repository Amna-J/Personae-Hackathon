from django.urls import path
from .views import BodyShapePredictView, SkinTonePredictView,UndertonePredictView, FaceShapePredictView

urlpatterns = [
    path('body-shape/', BodyShapePredictView.as_view()),
    path('skin-tone/', SkinTonePredictView.as_view()),
    path('undertone/', UndertonePredictView.as_view()),
    path('face-shape/', FaceShapePredictView.as_view()),
]