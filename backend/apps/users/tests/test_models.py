import pytest
from django.db import IntegrityError

from apps.users.models import CustomUser

from .factories import ConvenioAdminFactory, OwnerFactory, PatientFactory, UserFactory


@pytest.mark.django_db
class TestCustomUser:
    def test_create_user(self):
        user = UserFactory()
        assert user.pk is not None
        assert user.email
        assert user.full_name
        assert user.role == "patient"
        assert user.is_active is True

    def test_create_superuser(self):
        user = CustomUser.objects.create_superuser(
            email="admin@test.com",
            password="TestPass123!",
            full_name="Admin User",
        )
        assert user.is_staff is True
        assert user.is_superuser is True
        assert user.role == "owner"
        assert user.email_verified is True

    def test_str_representation(self):
        user = UserFactory(full_name="João Silva", email="joao@test.com")
        assert str(user) == "João Silva (joao@test.com)"

    def test_uuid_primary_key(self):
        user = UserFactory()
        assert user.pk is not None
        assert len(str(user.pk)) == 36  # UUID format

    def test_email_unique(self):
        UserFactory(email="unique@test.com")
        with pytest.raises(IntegrityError):
            UserFactory(email="unique@test.com")

    def test_role_properties(self):
        patient = PatientFactory()
        assert patient.is_patient is True
        assert patient.is_doctor is False

        owner = OwnerFactory()
        assert owner.is_owner is True
        assert owner.is_patient is False

        admin = ConvenioAdminFactory()
        assert admin.is_convenio_admin is True

    def test_password_hashing(self):
        user = UserFactory(password="MySecurePass123!")
        assert user.check_password("MySecurePass123!") is True
        assert user.check_password("wrong") is False

    def test_timestamps(self):
        user = UserFactory()
        assert user.created_at is not None
        assert user.updated_at is not None

    def test_soft_delete_fields(self):
        user = UserFactory()
        assert user.deleted_at is None

    def test_create_user_without_email_raises(self):
        with pytest.raises(ValueError, match="Email"):
            CustomUser.objects.create_user(email="", password="test", full_name="Test")
