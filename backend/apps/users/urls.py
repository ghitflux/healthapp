from django.urls import path

from . import views

app_name = "users"

urlpatterns = [
    # Auth endpoints
    path("auth/register/", views.RegisterView.as_view(), name="register"),
    path("auth/login/", views.LoginView.as_view(), name="login"),
    path("auth/token/refresh/", views.RefreshTokenView.as_view(), name="token-refresh"),
    path("auth/forgot-password/", views.ForgotPasswordView.as_view(), name="forgot-password"),
    path("auth/reset-password/", views.ResetPasswordView.as_view(), name="reset-password"),
    path("auth/verify-email/", views.VerifyEmailView.as_view(), name="verify-email"),
    path("auth/verify-phone/", views.VerifyPhoneView.as_view(), name="verify-phone"),
    # User endpoints
    path("users/me/", views.ProfileView.as_view(), name="profile"),
    path("users/me/change-password/", views.ChangePasswordView.as_view(), name="change-password"),
    path("users/me/export-data/", views.ExportDataView.as_view(), name="export-data"),
]
