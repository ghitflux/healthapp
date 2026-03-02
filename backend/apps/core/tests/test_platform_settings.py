import pytest
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.models import PlatformSettings
from apps.users.tests.factories import OwnerFactory, PatientFactory


def _auth_client(user):
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
    return client


@pytest.mark.django_db
class TestPlatformSettingsEndpoints:
    def test_get_platform_settings_owner(self):
        owner = OwnerFactory()

        response = _auth_client(owner).get("/api/v1/admin-panel/settings/")

        assert response.status_code == status.HTTP_200_OK
        assert "platform_fee_percentage" in response.data["data"]

    def test_patch_platform_settings_owner(self):
        owner = OwnerFactory()

        response = _auth_client(owner).patch(
            "/api/v1/admin-panel/settings/",
            {"maintenance_mode": True, "maintenance_message": "Janela de manutencao"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        settings_obj = PlatformSettings.load()
        assert settings_obj.maintenance_mode is True

    def test_get_platform_settings_forbidden_for_non_owner(self):
        patient = PatientFactory()

        response = _auth_client(patient).get("/api/v1/admin-panel/settings/")

        assert response.status_code == status.HTTP_403_FORBIDDEN
