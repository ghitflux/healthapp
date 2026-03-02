import pytest
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.core.models import PlatformSettings
from apps.core.services import PlatformSettingsService
from apps.users.tests.factories import OwnerFactory


def _auth_client(user):
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
    return client


@pytest.mark.django_db
class TestMaintenanceModeMiddleware:
    def test_blocks_regular_endpoints_when_maintenance_enabled(self):
        settings_obj = PlatformSettings.load()
        settings_obj.maintenance_mode = True
        settings_obj.maintenance_message = "Em manutencao"
        settings_obj.save()
        PlatformSettingsService.invalidate_cache()

        response = APIClient().get("/api/v1/doctors/")

        assert response.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
        assert response.json()["code"] == "maintenance_mode"

    def test_allows_admin_panel_endpoints_during_maintenance(self):
        owner = OwnerFactory()
        settings_obj = PlatformSettings.load()
        settings_obj.maintenance_mode = True
        settings_obj.maintenance_message = "Em manutencao"
        settings_obj.save()
        PlatformSettingsService.invalidate_cache()

        response = _auth_client(owner).get("/api/v1/admin-panel/settings/")

        assert response.status_code == status.HTTP_200_OK
