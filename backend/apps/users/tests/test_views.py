"""Integration tests for all auth and user endpoints."""
import time

import pytest
from django.core.cache import cache
from django_otp.oath import TOTP
from django_otp.plugins.otp_totp.models import TOTPDevice
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.models import CustomUser
from apps.users.services import AuthService, OTPService

from .factories import PatientFactory

PASSWORD = "TestPass123!"


@pytest.fixture(autouse=True)
def clear_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def user(db):
    return PatientFactory(email_verified=True, password=PASSWORD)


@pytest.fixture
def auth_client(client, user):
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
    return client


# ---------------------------------------------------------------------------
# Register
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestRegister:
    url = "/api/v1/auth/register/"

    def _valid_data(self, **overrides):
        from faker import Faker

        fake = Faker("pt_BR")
        data = {
            "email": fake.unique.email(),
            "password": PASSWORD,
            "password_confirm": PASSWORD,
            "full_name": fake.name(),
            "phone": "+5511987654321",
            "date_of_birth": "1990-01-15",
            "gender": "M",
        }
        data.update(overrides)
        return data

    def test_register_success(self, client):
        data = self._valid_data()
        resp = client.post(self.url, data, format="json")
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["status"] == "success"
        assert CustomUser.objects.filter(email=data["email"]).exists()

    def test_register_duplicate_email(self, db, client):
        user = PatientFactory()
        data = self._valid_data(email=user.email)
        resp = client.post(self.url, data, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_invalid_cpf(self, client):
        data = self._valid_data(cpf="123.456.789-00")
        resp = client.post(self.url, data, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_weak_password(self, client):
        data = self._valid_data(password="123", password_confirm="123")
        resp = client.post(self.url, data, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_missing_fields(self, client):
        resp = client.post(self.url, {}, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_password_mismatch(self, client):
        data = self._valid_data(password_confirm="DifferentPass!")
        resp = client.post(self.url, data, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_underage(self, client):
        data = self._valid_data(date_of_birth="2015-01-01")
        resp = client.post(self.url, data, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_register_invalid_phone(self, client):
        data = self._valid_data(phone="123456")
        resp = client.post(self.url, data, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestLogin:
    url = "/api/v1/auth/login/"

    def test_login_success(self, client, user):
        resp = client.post(self.url, {"email": user.email, "password": PASSWORD}, format="json")
        assert resp.status_code == status.HTTP_200_OK
        assert "access" in resp.data["data"]
        assert "refresh" in resp.data["data"]
        assert "user" in resp.data["data"]

    def test_login_invalid_password(self, client, user):
        resp = client.post(self.url, {"email": user.email, "password": "wrong"}, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_nonexistent_email(self, client, db):
        resp = client.post(self.url, {"email": "nobody@test.com", "password": PASSWORD}, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_inactive_user(self, client, db):
        user = PatientFactory(is_active=False, password=PASSWORD)
        resp = client.post(self.url, {"email": user.email, "password": PASSWORD}, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_rate_limit(self, client, user):
        for _ in range(5):
            client.post(self.url, {"email": user.email, "password": "invalid"}, format="json")
        resp = client.post(self.url, {"email": user.email, "password": "invalid"}, format="json")
        assert resp.status_code == status.HTTP_429_TOO_MANY_REQUESTS


# ---------------------------------------------------------------------------
# Refresh Token
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestRefreshToken:
    url = "/api/v1/auth/token/refresh/"

    def test_refresh_success(self, client, user):
        refresh = RefreshToken.for_user(user)
        resp = client.post(self.url, {"refresh": str(refresh)}, format="json")
        assert resp.status_code == status.HTTP_200_OK
        assert "access" in resp.data["data"]

    def test_refresh_invalid_token(self, client, db):
        resp = client.post(self.url, {"refresh": "not-a-valid-token"}, format="json")
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_refresh_missing_token(self, client, db):
        resp = client.post(self.url, {}, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


# ---------------------------------------------------------------------------
# Logout
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestLogout:
    url = "/api/v1/auth/logout/"

    def test_logout_success(self, auth_client, user):
        refresh = RefreshToken.for_user(user)
        resp = auth_client.post(self.url, {"refresh": str(refresh)}, format="json")
        assert resp.status_code == status.HTTP_200_OK

    def test_logout_invalid_token(self, auth_client):
        resp = auth_client.post(self.url, {"refresh": "invalid"}, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_logout_unauthenticated(self, client, db):
        resp = client.post(self.url, {"refresh": "something"}, format="json")
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED


# ---------------------------------------------------------------------------
# Forgot Password
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestForgotPassword:
    url = "/api/v1/auth/forgot-password/"

    def test_forgot_password_existing_email(self, client, user):
        resp = client.post(self.url, {"email": user.email}, format="json")
        assert resp.status_code == status.HTTP_200_OK

    def test_forgot_password_nonexistent_email(self, client, db):
        # Should always return 200 — no email enumeration
        resp = client.post(self.url, {"email": "nobody@test.com"}, format="json")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["status"] == "success"

    def test_forgot_password_rate_limit(self, client, user):
        for _ in range(3):
            client.post(self.url, {"email": user.email}, format="json")
        resp = client.post(self.url, {"email": user.email}, format="json")
        assert resp.status_code == status.HTTP_429_TOO_MANY_REQUESTS


# ---------------------------------------------------------------------------
# Reset Password
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestResetPassword:
    url = "/api/v1/auth/reset-password/"

    def test_reset_password_success(self, client, user):
        token = AuthService.generate_password_reset_token(user)
        new_pwd = "NewSecurePass456!"
        resp = client.post(self.url, {"token": token, "new_password": new_pwd}, format="json")
        assert resp.status_code == status.HTTP_200_OK
        user.refresh_from_db()
        assert user.check_password(new_pwd)

    def test_reset_password_invalid_token(self, client, db):
        resp = client.post(self.url, {"token": "bad-token", "new_password": "NewPass123!"}, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_reset_password_used_token(self, client, user):
        # Single-use: second call with same token must fail
        token = AuthService.generate_password_reset_token(user)
        client.post(self.url, {"token": token, "new_password": "NewPass1234!"}, format="json")
        resp = client.post(self.url, {"token": token, "new_password": "AnotherPass!"}, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


# ---------------------------------------------------------------------------
# Verify Email
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestVerifyEmail:
    url = "/api/v1/auth/verify-email/"

    def test_verify_email_success(self, auth_client, user):
        code = OTPService.generate_email_otp(user)
        resp = auth_client.post(self.url, {"code": code}, format="json")
        assert resp.status_code == status.HTTP_200_OK
        user.refresh_from_db()
        assert user.email_verified is True

    def test_verify_email_invalid_code(self, auth_client, db):
        resp = auth_client.post(self.url, {"code": "000000"}, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


# ---------------------------------------------------------------------------
# Verify Phone
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestVerifyPhone:
    url = "/api/v1/auth/verify-phone/"

    def test_verify_phone_success(self, auth_client, user):
        code = OTPService.generate_phone_otp(user)
        resp = auth_client.post(self.url, {"code": code}, format="json")
        assert resp.status_code == status.HTTP_200_OK
        user.refresh_from_db()
        assert user.phone_verified is True

    def test_verify_phone_invalid_code(self, auth_client, db):
        resp = auth_client.post(self.url, {"code": "999999"}, format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


# ---------------------------------------------------------------------------
# Resend OTP
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestResendOTP:
    def test_resend_email_otp_success(self, client, db):
        user = PatientFactory(email_verified=False)
        refresh = RefreshToken.for_user(user)
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
        resp = client.post("/api/v1/auth/resend-email-otp/", format="json")
        assert resp.status_code == status.HTTP_200_OK

    def test_resend_email_already_verified(self, auth_client, user):
        resp = auth_client.post("/api/v1/auth/resend-email-otp/", format="json")
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_resend_phone_otp_success(self, client, db):
        user = PatientFactory(phone_verified=False, email_verified=True)
        refresh = RefreshToken.for_user(user)
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
        resp = client.post("/api/v1/auth/resend-phone-otp/", format="json")
        assert resp.status_code == status.HTTP_200_OK

    def test_resend_unauthenticated(self, client, db):
        resp = client.post("/api/v1/auth/resend-email-otp/", format="json")
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_resend_email_rate_limit(self, client, db):
        user = PatientFactory(email_verified=False)
        refresh = RefreshToken.for_user(user)
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
        for _ in range(3):
            client.post("/api/v1/auth/resend-email-otp/", format="json")
        resp = client.post("/api/v1/auth/resend-email-otp/", format="json")
        assert resp.status_code == status.HTTP_429_TOO_MANY_REQUESTS


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestProfile:
    url = "/api/v1/users/me/"

    def test_get_profile(self, auth_client, user):
        resp = auth_client.get(self.url)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["data"]["email"] == user.email

    def test_update_profile(self, auth_client, user):
        resp = auth_client.patch(self.url, {"full_name": "Updated Name"}, format="json")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["data"]["full_name"] == "Updated Name"

    def test_delete_account(self, auth_client, user):
        resp = auth_client.delete(self.url)
        assert resp.status_code == status.HTTP_204_NO_CONTENT
        user.refresh_from_db()
        assert user.is_active is False

    def test_profile_unauthenticated(self, client, db):
        resp = client.get(self.url)
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED


# ---------------------------------------------------------------------------
# Change Password
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestChangePassword:
    url = "/api/v1/users/me/change-password/"

    def test_change_password_success(self, auth_client):
        resp = auth_client.post(
            self.url,
            {"old_password": PASSWORD, "new_password": "NewPass9999!"},
            format="json",
        )
        assert resp.status_code == status.HTTP_200_OK

    def test_change_password_wrong_old(self, auth_client):
        resp = auth_client.post(
            self.url,
            {"old_password": "WrongOld!", "new_password": "NewPass9999!"},
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_change_password_weak_new(self, auth_client):
        resp = auth_client.post(
            self.url,
            {"old_password": PASSWORD, "new_password": "123"},
            format="json",
        )
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


# ---------------------------------------------------------------------------
# Export Data
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestExportData:
    url = "/api/v1/users/me/export-data/"

    def test_export_data_success(self, auth_client, user):
        resp = auth_client.post(self.url)
        assert resp.status_code == status.HTTP_200_OK
        assert "personal_info" in resp.data["data"]
        assert resp.data["data"]["personal_info"]["email"] == user.email


# ---------------------------------------------------------------------------
# Consents LGPD
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestConsents:
    url = "/api/v1/users/me/consents/"

    def test_list_consents_empty(self, auth_client):
        resp = auth_client.get(self.url)
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.data["data"]) == 6

    def test_update_consents(self, auth_client):
        payload = {
            "consents": [
                {"purpose": "appointment_booking", "granted": True},
                {"purpose": "marketing", "granted": False},
            ]
        }
        resp = auth_client.patch(self.url, payload, format="json")
        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.data["data"]) == 2

    def test_consents_unauthenticated(self, client, db):
        resp = client.get(self.url)
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
class Test2FA:
    setup_url = "/api/v1/auth/2fa/setup/"
    verify_url = "/api/v1/auth/2fa/verify/"
    disable_url = "/api/v1/auth/2fa/disable/"
    login_url = "/api/v1/auth/login/"
    login_2fa_url = "/api/v1/auth/2fa/login/"

    @staticmethod
    def _totp_code(device: TOTPDevice, offset_seconds: int = 0) -> str:
        generator = TOTP(
            device.bin_key,
            step=device.step,
            t0=device.t0,
            digits=device.digits,
            drift=device.drift,
        )
        generator.time = time.time() + offset_seconds
        return f"{generator.token():06d}"

    def test_setup_and_verify_2fa(self, auth_client, user):
        setup_resp = auth_client.post(self.setup_url, format="json")
        assert setup_resp.status_code == status.HTTP_200_OK
        assert "provisioning_uri" in setup_resp.data["data"]
        device = TOTPDevice.objects.get(user=user, confirmed=False)

        verify_resp = auth_client.post(self.verify_url, {"token": self._totp_code(device)}, format="json")
        assert verify_resp.status_code == status.HTTP_200_OK
        user.refresh_from_db()
        assert user.is_2fa_enabled is True

    def test_login_with_2fa_flow(self, client, auth_client, user):
        auth_client.post(self.setup_url, format="json")
        device = TOTPDevice.objects.get(user=user, confirmed=False)
        auth_client.post(self.verify_url, {"token": self._totp_code(device)}, format="json")

        login_resp = client.post(self.login_url, {"email": user.email, "password": PASSWORD}, format="json")
        assert login_resp.status_code == status.HTTP_200_OK
        assert login_resp.data["data"]["requires_2fa"] is True
        temp_token = login_resp.data["data"]["temp_token"]

        device.refresh_from_db()
        finalize_resp = client.post(
            self.login_2fa_url,
            {"temp_token": temp_token, "totp_code": self._totp_code(device, offset_seconds=device.step)},
            format="json",
        )
        assert finalize_resp.status_code == status.HTTP_200_OK
        assert "access" in finalize_resp.data["data"]
        assert "refresh" in finalize_resp.data["data"]

    def test_disable_2fa(self, auth_client, user):
        auth_client.post(self.setup_url, format="json")
        device = TOTPDevice.objects.get(user=user, confirmed=False)
        auth_client.post(self.verify_url, {"token": self._totp_code(device)}, format="json")

        disable_resp = auth_client.post(self.disable_url, {"password": PASSWORD}, format="json")
        assert disable_resp.status_code == status.HTTP_200_OK
        user.refresh_from_db()
        assert user.is_2fa_enabled is False
