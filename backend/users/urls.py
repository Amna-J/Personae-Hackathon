
# from django.urls import path
# from .views import (
#     RegisterView,
#     LoginView,
#     ForgotCheckEmailView,
#     ForgotResetPasswordView,
#     ProfileView,
# )

# urlpatterns = [
#     path("register/",              RegisterView.as_view()),
#     path("login/",                 LoginView.as_view()),
#     path("forgot-check-email/",    ForgotCheckEmailView.as_view()),
#     path("forgot-reset-password/", ForgotResetPasswordView.as_view()),
#     path("profile/",               ProfileView.as_view()),
# ]
from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    ForgotCheckEmailView,
    ForgotResetPasswordView,
    ProfileView,
    RecommendationView,
    StyleCheckView,
)

urlpatterns = [
    path("register/",              RegisterView.as_view()),
    path("login/",                 LoginView.as_view()),
    path("forgot-check-email/",    ForgotCheckEmailView.as_view()),
    path("forgot-reset-password/", ForgotResetPasswordView.as_view()),
    path("profile/",               ProfileView.as_view()),
    path("recommendations/",       RecommendationView.as_view()),
    path("style-check/",           StyleCheckView.as_view()),
]