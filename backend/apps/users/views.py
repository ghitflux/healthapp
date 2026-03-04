import logging
from typing import cast

from django.core.cache import cache
from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.throttles import (
    LoginRateThrottle,
    OTPResendThrottle,
    RegisterRateThrottle,
    ResetPasswordRateThrottle,
)

from .models import CONSENT_PURPOSE_CHOICES, ConsentRecord
from .permissions import IsAccountOwner
from .serializers import (
    ChangePasswordSerializer,
    ConsentRecordSerializer,
    Disable2FASerializer,
    ForgotPasswordSerializer,
    Login2FASerializer,
    LoginSerializer,
    LogoutSerializer,
    ProfileSerializer,
    RefreshTokenRequestSerializer,
    RegisterSerializer,
    ResetPasswordSerializer,
    Setup2FAResponseSerializer,
    UpdateConsentsSerializer,
    UserSerializer,
    Verify2FASerializer,
    VerifyEmailSerializer,
    VerifyPhoneSerializer,
)
from .services import AuthService, OTPService, UserService

logger = logging.getLogger(__name__)

OTP_RESEND_COUNTER_PREFIX = "otp_resend_count:"
OTP_RESEND_LIMIT = 3
OTP_RESEND_WINDOW = 900  # 15 minutes


class RegisterView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [RegisterRateThrottle]

    @extend_schema(
        operation_id="registerUser",
        tags=["auth"],
        summary="Register a new patient user",
        request=RegisterSerializer,
        responses={201: UserSerializer},
    )
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = AuthService.register_user(serializer.validated_data)
        return Response(
            {"status": "success", "data": UserSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [LoginRateThrottle]

    @extend_schema(
        operation_id="loginUser",
        tags=["auth"],
        summary="Login with email and password",
        request=LoginSerializer,
        responses={200: dict},
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        AuthService.update_last_login(user)

        # If 2FA is enabled, return temp token instead of JWT
        if user.is_2fa_enabled:
            temp_token = AuthService.generate_2fa_temp_token(user)
            return Response(
                {
                    "status": "success",
                    "data": {
                        "requires_2fa": True,
                        "temp_token": temp_token,
                    },
                }
            )

        refresh = cast(RefreshToken, RefreshToken.for_user(user))
        refresh["role"] = user.role
        refresh.access_token["role"] = user.role
        return Response(
            {
                "status": "success",
                "data": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "user": UserSerializer(user).data,
                },
            }
        )


class RefreshTokenView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        operation_id="refreshToken",
        tags=["auth"],
        summary="Refresh access token",
        request=RefreshTokenRequestSerializer,
        responses={200: dict},
    )
    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"status": "error", "errors": [{"field": "refresh", "detail": "Refresh token is required."}]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            refresh = RefreshToken(refresh_token)
            return Response(
                {
                    "status": "success",
                    "data": {
                        "access": str(refresh.access_token),
                        "refresh": str(refresh),
                    },
                }
            )
        except TokenError:
            return Response(
                {
                    "status": "error",
                    "errors": [{"field": "refresh", "detail": "Invalid or expired refresh token."}],
                    "code": "authentication_failed",
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="logoutUser",
        tags=["auth"],
        summary="Logout and blacklist the refresh token",
        request=LogoutSerializer,
        responses={200: dict},
    )
    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            token = RefreshToken(serializer.validated_data["refresh"])
            token.blacklist()
        except TokenError as exc:
            raise ValidationError({"refresh": "Invalid or already blacklisted token."}) from exc
        return Response({"status": "success", "data": {"message": "Logged out successfully."}})


class ProfileView(APIView):
    permission_classes = [IsAuthenticated, IsAccountOwner]

    @extend_schema(
        operation_id="getUserProfile",
        tags=["users"],
        summary="Get authenticated user profile",
        responses={200: ProfileSerializer},
    )
    def get(self, request):
        serializer = ProfileSerializer(request.user)
        return Response({"status": "success", "data": serializer.data})

    @extend_schema(
        operation_id="patchUserProfile",
        tags=["users"],
        summary="Update authenticated user profile",
        request=ProfileSerializer,
        responses={200: ProfileSerializer},
    )
    def patch(self, request):
        serializer = ProfileSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"status": "success", "data": serializer.data})

    @extend_schema(
        operation_id="deleteUserAccount",
        tags=["users"],
        summary="Delete user account (LGPD — anonymization)",
        responses={204: None},
    )
    def delete(self, request):
        UserService.anonymize_user(request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="changePassword",
        tags=["users"],
        summary="Change password",
        request=ChangePasswordSerializer,
        responses={200: dict},
    )
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save(update_fields=["password", "updated_at"])
        return Response({"status": "success", "data": {"message": "Password changed successfully."}})


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ResetPasswordRateThrottle]

    @extend_schema(
        operation_id="forgotPassword",
        tags=["auth"],
        summary="Request password reset via email",
        request=ForgotPasswordSerializer,
        responses={200: dict},
    )
    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        # Always return 200 — prevents email enumeration
        from .models import CustomUser

        try:
            user = CustomUser.objects.get(email__iexact=serializer.validated_data["email"])
            token = AuthService.generate_password_reset_token(user)
            # In production: send email with token. Here we log it.
            logger.info("Password reset token for %s: %s", user.email, token)
        except CustomUser.DoesNotExist:
            pass
        return Response(
            {"status": "success", "data": {"message": "If the email exists, a reset link has been sent."}}
        )


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [ResetPasswordRateThrottle]

    @extend_schema(
        operation_id="resetPassword",
        tags=["auth"],
        summary="Reset password with token",
        request=ResetPasswordSerializer,
        responses={200: dict},
    )
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = AuthService.verify_password_reset_token(serializer.validated_data["token"])
        if not user:
            raise ValidationError({"token": "Invalid or expired reset token."})
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password", "updated_at"])
        return Response({"status": "success", "data": {"message": "Password has been reset."}})


class VerifyEmailView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="verifyEmail",
        tags=["auth"],
        summary="Verify email with OTP code",
        request=VerifyEmailSerializer,
        responses={200: dict},
    )
    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if OTPService.verify_email_otp(request.user, serializer.validated_data["code"]):
            return Response({"status": "success", "data": {"message": "Email verified successfully."}})
        raise ValidationError({"code": "Invalid or expired OTP code."})


class VerifyPhoneView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="verifyPhone",
        tags=["auth"],
        summary="Verify phone with SMS code",
        request=VerifyPhoneSerializer,
        responses={200: dict},
    )
    def post(self, request):
        serializer = VerifyPhoneSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if OTPService.verify_phone_otp(request.user, serializer.validated_data["code"]):
            return Response({"status": "success", "data": {"message": "Phone verified successfully."}})
        raise ValidationError({"code": "Invalid or expired OTP code."})


class ResendEmailOTPView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [OTPResendThrottle]

    @extend_schema(
        operation_id="resendEmailOTP",
        tags=["auth"],
        summary="Resend email verification OTP",
        request=None,
        responses={200: dict},
    )
    def post(self, request):
        if request.user.email_verified:
            raise ValidationError({"detail": "Email is already verified."})
        counter_key = f"{OTP_RESEND_COUNTER_PREFIX}email:{request.user.id}"
        count = cache.get(counter_key, 0)
        if count >= OTP_RESEND_LIMIT:
            return Response(
                {
                    "status": "error",
                    "errors": [{"detail": "Too many resend requests. Try again later."}],
                    "code": "throttled",
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
        cache.set(counter_key, count + 1, timeout=OTP_RESEND_WINDOW)
        code = OTPService.generate_email_otp(request.user)
        logger.info("Email OTP resent for user %s: %s", request.user.id, code)
        return Response({"status": "success", "data": {"message": "Verification code sent to your email."}})


class ResendPhoneOTPView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_classes = [OTPResendThrottle]

    @extend_schema(
        operation_id="resendPhoneOTP",
        tags=["auth"],
        summary="Resend phone verification OTP",
        request=None,
        responses={200: dict},
    )
    def post(self, request):
        if request.user.phone_verified:
            raise ValidationError({"detail": "Phone is already verified."})
        counter_key = f"{OTP_RESEND_COUNTER_PREFIX}phone:{request.user.id}"
        count = cache.get(counter_key, 0)
        if count >= OTP_RESEND_LIMIT:
            return Response(
                {
                    "status": "error",
                    "errors": [{"detail": "Too many resend requests. Try again later."}],
                    "code": "throttled",
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )
        cache.set(counter_key, count + 1, timeout=OTP_RESEND_WINDOW)
        code = OTPService.generate_phone_otp(request.user)
        logger.info("Phone OTP resent for user %s: %s", request.user.id, code)
        return Response({"status": "success", "data": {"message": "Verification code sent to your phone."}})


class ExportDataView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="exportUserData",
        tags=["users"],
        summary="Export personal data (LGPD compliance)",
        request=None,
        responses={200: dict},
    )
    def post(self, request):
        data = UserService.export_user_data(request.user)
        return Response({"status": "success", "data": data})


# ---------------------------------------------------------------------------
# 2FA Endpoints
# ---------------------------------------------------------------------------


class Setup2FAView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="setup2FA",
        tags=["auth"],
        summary="Setup TOTP 2FA — returns provisioning URI",
        request=None,
        responses={200: Setup2FAResponseSerializer},
    )
    def post(self, request):
        from django_otp.plugins.otp_totp.models import TOTPDevice

        # Remove existing unconfirmed devices
        TOTPDevice.objects.filter(user=request.user, confirmed=False).delete()
        device = TOTPDevice.objects.create(
            user=request.user,
            name=f"{request.user.email} TOTP",
            confirmed=False,
        )
        provisioning_uri = device.config_url
        return Response(
            {
                "status": "success",
                "data": {
                    "provisioning_uri": provisioning_uri,
                    "key": device.key,
                },
            }
        )


class Verify2FAView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="verify2FA",
        tags=["auth"],
        summary="Verify TOTP token to activate 2FA",
        request=Verify2FASerializer,
        responses={200: dict},
    )
    def post(self, request):
        from django_otp.plugins.otp_totp.models import TOTPDevice

        serializer = Verify2FASerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            device = TOTPDevice.objects.get(user=request.user, confirmed=False)
        except TOTPDevice.DoesNotExist as exc:
            raise ValidationError({"detail": "No pending 2FA setup found. Please call setup first."}) from exc
        if not device.verify_token(serializer.validated_data["token"]):
            raise ValidationError({"token": "Invalid TOTP token."})
        device.confirmed = True
        device.save()
        request.user.is_2fa_enabled = True
        request.user.save(update_fields=["is_2fa_enabled", "updated_at"])
        return Response({"status": "success", "data": {"message": "2FA enabled successfully."}})


class Disable2FAView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="disable2FA",
        tags=["auth"],
        summary="Disable 2FA (requires password confirmation)",
        request=Disable2FASerializer,
        responses={200: dict},
    )
    def post(self, request):
        from django_otp.plugins.otp_totp.models import TOTPDevice

        serializer = Disable2FASerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if not request.user.check_password(serializer.validated_data["password"]):
            raise ValidationError({"password": "Incorrect password."})
        TOTPDevice.objects.filter(user=request.user).delete()
        request.user.is_2fa_enabled = False
        request.user.save(update_fields=["is_2fa_enabled", "updated_at"])
        return Response({"status": "success", "data": {"message": "2FA disabled successfully."}})


class Login2FAView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        operation_id="login2FA",
        tags=["auth"],
        summary="Complete 2FA login with temp token + TOTP code",
        request=Login2FASerializer,
        responses={200: dict},
    )
    def post(self, request):
        from django_otp.plugins.otp_totp.models import TOTPDevice

        serializer = Login2FASerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = AuthService.verify_2fa_temp_token(serializer.validated_data["temp_token"])
        if not user:
            raise ValidationError({"temp_token": "Invalid or expired token."})
        try:
            device = TOTPDevice.objects.get(user=user, confirmed=True)
        except TOTPDevice.DoesNotExist as exc:
            raise ValidationError({"detail": "No confirmed 2FA device found."}) from exc
        if not device.verify_token(serializer.validated_data["totp_code"]):
            raise ValidationError({"totp_code": "Invalid TOTP code."})
        refresh = cast(RefreshToken, RefreshToken.for_user(user))
        refresh["role"] = user.role
        refresh.access_token["role"] = user.role
        return Response(
            {
                "status": "success",
                "data": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "user": UserSerializer(user).data,
                },
            }
        )


# ---------------------------------------------------------------------------
# LGPD Consent Endpoints
# ---------------------------------------------------------------------------


class ConsentsView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="listConsents",
        tags=["users"],
        summary="List LGPD consent records for authenticated user",
        responses={200: ConsentRecordSerializer(many=True)},
    )
    def get(self, request):
        for purpose, _ in CONSENT_PURPOSE_CHOICES:
            ConsentRecord.objects.get_or_create(user=request.user, purpose=purpose)
        consents = ConsentRecord.objects.filter(user=request.user).order_by("purpose")
        serializer = ConsentRecordSerializer(consents, many=True)
        return Response({"status": "success", "data": serializer.data})

    @extend_schema(
        operation_id="updateConsents",
        tags=["users"],
        summary="Update LGPD consent records",
        request=UpdateConsentsSerializer,
        responses={200: ConsentRecordSerializer(many=True)},
    )
    def patch(self, request):
        serializer = UpdateConsentsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ip = request.META.get("REMOTE_ADDR", "")
        user_agent = request.META.get("HTTP_USER_AGENT", "")
        records = serializer.update_consents(request.user, ip, user_agent)
        return Response({"status": "success", "data": ConsentRecordSerializer(records, many=True).data})
