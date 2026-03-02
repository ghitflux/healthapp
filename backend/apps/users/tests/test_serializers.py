"""Unit tests for users serializers."""
import pytest

from apps.users.serializers import (
    ChangePasswordSerializer,
    ConsentRecordSerializer,
    LoginSerializer,
    ProfileSerializer,
    RegisterSerializer,
)

from .factories import PatientFactory

PASSWORD = "TestPass123!"

VALID_REGISTER_DATA = {
    "email": "newuser@test.com",
    "password": PASSWORD,
    "password_confirm": PASSWORD,
    "full_name": "Test User",
    "phone": "+5511987654321",
    "date_of_birth": "1990-01-15",
    "gender": "M",
}


@pytest.mark.django_db
class TestRegisterSerializer:
    def test_valid_data(self):
        s = RegisterSerializer(data=VALID_REGISTER_DATA)
        assert s.is_valid(), s.errors

    def test_invalid_cpf(self):
        data = {**VALID_REGISTER_DATA, "email": "cpf@test.com", "cpf": "000.000.000-00"}
        s = RegisterSerializer(data=data)
        assert not s.is_valid()
        assert "cpf" in s.errors

    def test_invalid_phone(self):
        data = {**VALID_REGISTER_DATA, "email": "phone@test.com", "phone": "12345"}
        s = RegisterSerializer(data=data)
        assert not s.is_valid()
        assert "phone" in s.errors

    def test_password_mismatch(self):
        data = {**VALID_REGISTER_DATA, "email": "mismatch@test.com", "password_confirm": "Different!"}
        s = RegisterSerializer(data=data)
        assert not s.is_valid()

    def test_weak_password(self):
        data = {**VALID_REGISTER_DATA, "email": "weak@test.com", "password": "123", "password_confirm": "123"}
        s = RegisterSerializer(data=data)
        assert not s.is_valid()
        assert "password" in s.errors

    def test_underage(self):
        data = {**VALID_REGISTER_DATA, "email": "young@test.com", "date_of_birth": "2015-06-15"}
        s = RegisterSerializer(data=data)
        assert not s.is_valid()
        assert "date_of_birth" in s.errors

    def test_duplicate_email(self, db):
        user = PatientFactory()
        data = {**VALID_REGISTER_DATA, "email": user.email}
        s = RegisterSerializer(data=data)
        assert not s.is_valid()
        assert "email" in s.errors


@pytest.mark.django_db
class TestLoginSerializer:
    def test_valid_credentials(self):
        user = PatientFactory(password=PASSWORD)
        s = LoginSerializer(data={"email": user.email, "password": PASSWORD})
        assert s.is_valid(), s.errors
        assert "user" in s.validated_data

    def test_invalid_credentials(self):
        user = PatientFactory()
        s = LoginSerializer(data={"email": user.email, "password": "wrong"})
        assert not s.is_valid()

    def test_inactive_user(self):
        user = PatientFactory(is_active=False, password=PASSWORD)
        s = LoginSerializer(data={"email": user.email, "password": PASSWORD})
        assert not s.is_valid()


@pytest.mark.django_db
class TestProfileSerializer:
    def test_read_only_fields(self):
        user = PatientFactory()
        data = {"email": "changed@test.com", "role": "owner", "id": "some-id"}
        s = ProfileSerializer(user, data=data, partial=True)
        s.is_valid()
        # read-only fields should not be changed
        assert "email" not in s.validated_data
        assert "role" not in s.validated_data

    def test_partial_update(self):
        user = PatientFactory()
        s = ProfileSerializer(user, data={"full_name": "New Name"}, partial=True)
        assert s.is_valid(), s.errors


@pytest.mark.django_db
class TestChangePasswordSerializer:
    def test_correct_old_password(self):
        user = PatientFactory(password=PASSWORD)
        s = ChangePasswordSerializer(
            data={"old_password": PASSWORD, "new_password": "NewStrong99!"},
            context={"request": type("R", (), {"user": user})()},
        )
        assert s.is_valid(), s.errors

    def test_wrong_old_password(self):
        user = PatientFactory(password=PASSWORD)
        s = ChangePasswordSerializer(
            data={"old_password": "wrong", "new_password": "NewStrong99!"},
            context={"request": type("R", (), {"user": user})()},
        )
        assert not s.is_valid()
        assert "old_password" in s.errors


@pytest.mark.django_db
class TestConsentSerializer:
    def test_valid_consent(self):
        user = PatientFactory()
        from apps.users.models import ConsentRecord

        record = ConsentRecord.objects.create(user=user, purpose="appointment_booking", granted=True)
        s = ConsentRecordSerializer(record)
        assert s.data["purpose"] == "appointment_booking"
        assert s.data["granted"] is True

    def test_invalid_purpose_in_update(self):
        from apps.users.serializers import UpdateConsentsSerializer

        s = UpdateConsentsSerializer(data={"consents": [{"purpose": "invalid_purpose", "granted": True}]})
        assert not s.is_valid()
