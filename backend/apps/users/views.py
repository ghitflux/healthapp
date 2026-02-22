from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .permissions import IsAccountOwner
from .serializers import (
    ChangePasswordSerializer,
    ForgotPasswordSerializer,
    LoginSerializer,
    ProfileSerializer,
    RegisterSerializer,
    ResetPasswordSerializer,
    UserSerializer,
    VerifyEmailSerializer,
    VerifyPhoneSerializer,
)
from .services import AuthService, OTPService, UserService


class RegisterView(APIView):
    permission_classes = [AllowAny]

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
        refresh = RefreshToken.for_user(user)
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
        responses={200: dict},
    )
    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"status": "error", "errors": [{"detail": "Refresh token is required."}]},
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
        except Exception:
            return Response(
                {"status": "error", "errors": [{"detail": "Invalid or expired refresh token."}]},
                status=status.HTTP_401_UNAUTHORIZED,
            )


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
        # Always return success to prevent email enumeration
        return Response(
            {"status": "success", "data": {"message": "If the email exists, a reset link has been sent."}}
        )


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

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
        # TODO: Implement token verification and password reset
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
        return Response(
            {"status": "error", "errors": [{"detail": "Invalid or expired OTP code."}]},
            status=status.HTTP_400_BAD_REQUEST,
        )


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
        return Response(
            {"status": "error", "errors": [{"detail": "Invalid or expired OTP code."}]},
            status=status.HTTP_400_BAD_REQUEST,
        )


class ExportDataView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="exportUserData",
        tags=["users"],
        summary="Export personal data (LGPD compliance)",
        responses={200: dict},
    )
    def post(self, request):
        data = UserService.export_user_data(request.user)
        return Response({"status": "success", "data": data})
