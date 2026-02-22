import pytest

from .factories import NotificationFactory


@pytest.mark.django_db
class TestNotification:
    def test_create_notification(self):
        notif = NotificationFactory()
        assert notif.pk is not None
        assert notif.is_read is False
        assert notif.user is not None

    def test_str_representation(self):
        notif = NotificationFactory()
        assert notif.user.full_name in str(notif)

    def test_default_unread(self):
        notif = NotificationFactory()
        assert notif.is_read is False
        assert notif.read_at is None
