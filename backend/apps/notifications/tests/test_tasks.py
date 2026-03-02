from datetime import timedelta

import pytest
from django.utils import timezone

from apps.appointments.tests.factories import AppointmentFactory
from apps.notifications.models import Notification
from apps.notifications.tasks import (
    cleanup_old_notifications,
    send_bulk_reminders,
    send_email_notification,
    send_push_notification,
)
from apps.notifications.tests.factories import NotificationFactory
from apps.users.tests.factories import PatientFactory


@pytest.mark.django_db
class TestNotificationTasks:
    def test_send_email_notification_user_exists(self, monkeypatch):
        user = PatientFactory()
        called = {"value": False}

        def _send_email(target_user, subject, body):
            called["value"] = True
            assert target_user.id == user.id
            assert subject == "Hello"

        monkeypatch.setattr("apps.notifications.services.EmailService.send_email", _send_email)

        send_email_notification(str(user.id), "Hello", "Body")

        assert called["value"] is True

    def test_send_email_notification_user_not_found(self, monkeypatch):
        called = {"value": False}

        def _send_email(*args, **kwargs):
            called["value"] = True

        monkeypatch.setattr("apps.notifications.services.EmailService.send_email", _send_email)

        send_email_notification("00000000-0000-0000-0000-000000000000", "Hello", "Body")

        assert called["value"] is False

    def test_send_push_notification_user_exists(self, monkeypatch):
        user = PatientFactory()
        called = {"value": False}

        def _send_push(target_user, title, body, data):
            called["value"] = True
            assert target_user.id == user.id
            assert title == "Reminder"

        monkeypatch.setattr("apps.notifications.services.PushService.send_push", _send_push)

        send_push_notification(str(user.id), "Reminder", "Body", {"k": "v"})

        assert called["value"] is True

    def test_send_bulk_reminders_marks_appointments(self, monkeypatch):
        appointment = AppointmentFactory(status="confirmed", reminder_sent=False)
        appointment.scheduled_date = (timezone.now() + timedelta(hours=24)).date()
        appointment.save(update_fields=["scheduled_date", "reminder_sent", "updated_at"])

        created = {"count": 0}
        pushed = {"count": 0}

        monkeypatch.setattr(
            "apps.notifications.services.NotificationService.create_notification",
            lambda **kwargs: created.__setitem__("count", created["count"] + 1),
        )
        monkeypatch.setattr(
            "apps.notifications.services.PushService.send_push",
            lambda *args, **kwargs: pushed.__setitem__("count", pushed["count"] + 1),
        )

        result = send_bulk_reminders()

        appointment.refresh_from_db()
        assert result == 1
        assert appointment.reminder_sent is True
        assert created["count"] == 1
        assert pushed["count"] == 1

    def test_cleanup_old_notifications(self):
        old_read = NotificationFactory(is_read=True)
        old_read.created_at = timezone.now() - timedelta(days=91)
        old_read.save(update_fields=["created_at", "updated_at"])

        recent_read = NotificationFactory(is_read=True)
        recent_read.created_at = timezone.now() - timedelta(days=10)
        recent_read.save(update_fields=["created_at", "updated_at"])

        old_unread = NotificationFactory(is_read=False)
        old_unread.created_at = timezone.now() - timedelta(days=91)
        old_unread.save(update_fields=["created_at", "updated_at"])

        deleted_count = cleanup_old_notifications()

        assert deleted_count >= 1
        assert Notification.objects.filter(id=old_read.id).exists() is False
        assert Notification.objects.filter(id=recent_read.id).exists() is True
        assert Notification.objects.filter(id=old_unread.id).exists() is True
