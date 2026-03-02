from django.urls import path

from . import views

app_name = "users"

urlpatterns = [
    # Auth core
    path("auth/register/", views.RegisterView.as_view(), name="register"),
    path("auth/login/", views.LoginView.as_view(), name="login"),
    path("auth/logout/", views.LogoutView.as_view(), name="logout"),
    path("auth/token/refresh/", views.RefreshTokenView.as_view(), name="token-refresh"),
    # Password reset
    path("auth/forgot-password/", views.ForgotPasswordView.as_view(), name="forgot-password"),
    path("auth/reset-password/", views.ResetPasswordView.as_view(), name="reset-password"),
    # OTP verification
    path("auth/verify-email/", views.VerifyEmailView.as_view(), name="verify-email"),
    path("auth/verify-phone/", views.VerifyPhoneView.as_view(), name="verify-phone"),
    path("auth/resend-email-otp/", views.ResendEmailOTPView.as_view(), name="resend-email-otp"),
    path("auth/resend-phone-otp/", views.ResendPhoneOTPView.as_view(), name="resend-phone-otp"),
    # 2FA
    path("auth/2fa/setup/", views.Setup2FAView.as_view(), name="2fa-setup"),
    path("auth/2fa/verify/", views.Verify2FAView.as_view(), name="2fa-verify"),
    path("auth/2fa/disable/", views.Disable2FAView.as_view(), name="2fa-disable"),
    path("auth/2fa/login/", views.Login2FAView.as_view(), name="2fa-login"),
    # User profile
    path("users/me/", views.ProfileView.as_view(), name="profile"),
    path("users/me/change-password/", views.ChangePasswordView.as_view(), name="change-password"),
    path("users/me/export-data/", views.ExportDataView.as_view(), name="export-data"),
    path("users/me/consents/", views.ConsentsView.as_view(), name="consents"),
]
