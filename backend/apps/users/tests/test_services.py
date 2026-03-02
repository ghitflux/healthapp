"""Unit tests for users services."""
import pytest
from django.core.cache import cache

from apps.users.services import AuthService, OTPService, UserService

from .factories import PatientFactory

PASSWORD = "TestPass123!"


@pytest.fixture(autouse=True)
def clear_cache():
    cache.clear()
    yield
    cache.clear()


@pytest.mark.django_db
class TestOTPService:
    def test_generate_email_otp(self):
        user = PatientFactory()
        code = OTPService.generate_email_otp(user)
        assert len(code) == 6
        assert code.isdigit()

    def test_verify_email_otp_success(self):
        user = PatientFactory()
        code = OTPService.generate_email_otp(user)
        result = OTPService.verify_email_otp(user, code)
        assert result is True
        user.refresh_from_db()
        assert user.email_verified is True

    def test_verify_email_otp_invalid(self):
        user = PatientFactory()
        OTPService.generate_email_otp(user)
        result = OTPService.verify_email_otp(user, "000000")
        assert result is False

    def test_verify_email_otp_single_use(self):
        user = PatientFactory()
        code = OTPService.generate_email_otp(user)
        OTPService.verify_email_otp(user, code)
        # Second use must fail
        result = OTPService.verify_email_otp(user, code)
        assert result is False

    def test_generate_phone_otp(self):
        user = PatientFactory()
        code = OTPService.generate_phone_otp(user)
        assert len(code) == 6
        assert code.isdigit()

    def test_verify_phone_otp_success(self):
        user = PatientFactory()
        code = OTPService.generate_phone_otp(user)
        result = OTPService.verify_phone_otp(user, code)
        assert result is True
        user.refresh_from_db()
        assert user.phone_verified is True


@pytest.mark.django_db
class TestAuthService:
    def test_register_user(self):
        data = {
            "email": "newtest@example.com",
            "password": PASSWORD,
            "full_name": "Test User",
            "phone": "+5511987654321",
            "role": "patient",
        }
        user = AuthService.register_user(data)
        assert user.pk is not None
        assert user.email == "newtest@example.com"
        assert user.check_password(PASSWORD)

    def test_generate_password_reset_token(self):
        user = PatientFactory()
        token = AuthService.generate_password_reset_token(user)
        assert isinstance(token, str)
        assert len(token) > 0

    def test_verify_password_reset_token_success(self):
        user = PatientFactory()
        token = AuthService.generate_password_reset_token(user)
        result = AuthService.verify_password_reset_token(token)
        assert result is not None
        assert result.pk == user.pk

    def test_verify_password_reset_token_invalid(self):
        result = AuthService.verify_password_reset_token("not-a-real-token")
        assert result is None

    def test_verify_password_reset_token_single_use(self):
        user = PatientFactory()
        token = AuthService.generate_password_reset_token(user)
        AuthService.verify_password_reset_token(token)
        # Second use must return None
        result = AuthService.verify_password_reset_token(token)
        assert result is None

    def test_update_last_login(self):
        user = PatientFactory()
        assert user.last_login is None
        AuthService.update_last_login(user)
        user.refresh_from_db()
        assert user.last_login is not None


@pytest.mark.django_db
class TestUserService:
    def test_anonymize_user(self):
        user = PatientFactory()
        UserService.anonymize_user(user)
        user.refresh_from_db()
        assert user.is_active is False
        assert "anonymized" in user.email
        assert user.full_name == "Anonymized User"

    def test_export_user_data(self):
        user = PatientFactory()
        data = UserService.export_user_data(user)
        assert "personal_info" in data
        assert data["personal_info"]["email"] == user.email
        assert "appointments" in data
        assert "exported_at" in data
