import pytest
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.notifications.tests.factories import NotificationFactory
from apps.users.tests.factories import PatientFactory


@pytest.fixture
def client():
    return APIClient()


def _auth_client(user):
    api_client = APIClient()
    refresh = RefreshToken.for_user(user)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
    return api_client


@pytest.mark.django_db
class TestNotificationViews:
    def test_list_notifications_success(self):
        user = PatientFactory()
        NotificationFactory(user=user)
        NotificationFactory(user=user)

        resp = _auth_client(user).get("/api/v1/notifications/")

        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.data["data"]) == 2
        assert "meta" in resp.data

    def test_list_notifications_filter_unread(self):
        user = PatientFactory()
        NotificationFactory(user=user, is_read=False)
        NotificationFactory(user=user, is_read=True)

        resp = _auth_client(user).get("/api/v1/notifications/?is_read=false")

        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.data["data"]) == 1

    def test_list_notifications_filter_type(self):
        user = PatientFactory()
        NotificationFactory(user=user, type="appointment")
        NotificationFactory(user=user, type="payment")

        resp = _auth_client(user).get("/api/v1/notifications/?type=appointment")

        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.data["data"]) == 1

    def test_list_notifications_pagination(self):
        user = PatientFactory()
        NotificationFactory.create_batch(25, user=user)

        resp = _auth_client(user).get("/api/v1/notifications/?page=2")

        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["meta"]["page"] == 2

    def test_mark_read_success(self):
        user = PatientFactory()
        notification = NotificationFactory(user=user, is_read=False)

        resp = _auth_client(user).patch(f"/api/v1/notifications/{notification.id}/read/")

        assert resp.status_code == status.HTTP_200_OK
        notification.refresh_from_db()
        assert notification.is_read is True

    def test_mark_all_read_success(self):
        user = PatientFactory()
        NotificationFactory(user=user, is_read=False)
        NotificationFactory(user=user, is_read=False)

        resp = _auth_client(user).post("/api/v1/notifications/read-all/")

        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["status"] == "success"

    def test_unread_count_success(self):
        user = PatientFactory()
        NotificationFactory(user=user, is_read=False)
        NotificationFactory(user=user, is_read=True)

        resp = _auth_client(user).get("/api/v1/notifications/unread-count/")

        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["data"]["count"] == 1

    def test_mark_read_not_found_for_other_user(self):
        user = PatientFactory()
        other = PatientFactory()
        notification = NotificationFactory(user=other)

        resp = _auth_client(user).patch(f"/api/v1/notifications/{notification.id}/read/")

        assert resp.status_code == status.HTTP_404_NOT_FOUND

    def test_unauthenticated_forbidden(self, client):
        resp = client.get("/api/v1/notifications/")
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_register_device_token(self):
        user = PatientFactory()
        response = _auth_client(user).post(
            "/api/v1/notifications/devices/register/",
            {"token": "fcm_token_1", "device_type": "android", "device_name": "Pixel"},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["data"]["token"] == "fcm_token_1"

    def test_register_device_token_reassigns_user(self):
        from apps.notifications.models import DeviceToken

        first_user = PatientFactory()
        second_user = PatientFactory()
        DeviceToken.objects.create(user=first_user, token="same_token", device_type="ios")

        response = _auth_client(second_user).post(
            "/api/v1/notifications/devices/register/",
            {"token": "same_token", "device_type": "android"},
            format="json",
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["data"]["token"] == "same_token"

    def test_list_device_tokens(self):
        user = PatientFactory()
        _auth_client(user).post(
            "/api/v1/notifications/devices/register/",
            {"token": "fcm_list_1", "device_type": "web"},
            format="json",
        )
        response = _auth_client(user).get("/api/v1/notifications/devices/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["data"]) == 1

    def test_unregister_device_token(self):
        user = PatientFactory()
        _auth_client(user).post(
            "/api/v1/notifications/devices/register/",
            {"token": "fcm_del_1", "device_type": "ios"},
            format="json",
        )
        response = _auth_client(user).delete(
            "/api/v1/notifications/devices/unregister/",
            {"token": "fcm_del_1"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
