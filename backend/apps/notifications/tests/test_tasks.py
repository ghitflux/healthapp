from datetime import timedelta

import pytest
from django.utils import timezone

from apps.appointments.tests.factories import AppointmentFactory
from apps.notifications.models import Notification
from apps.notifications.tasks import (
    check_no_show_appointments,
    cleanup_old_notifications,
    generate_daily_summary,
    send_bulk_reminders,
    send_email_notification,
    send_push_notification,
    send_sms_notification,
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

        def _send_push(user_id, title, body, data):
            called["value"] = True
            assert user_id == str(user.id)
            assert title == "Reminder"
            return {"success_count": 1, "failure_count": 0, "errors": []}

        monkeypatch.setattr("apps.notifications.services.PushService.send_to_user", _send_push)

        send_push_notification(str(user.id), "Reminder", "Body", {"k": "v"})

        assert called["value"] is True

    def test_send_bulk_reminders_marks_appointments(self, monkeypatch):
        now = timezone.localtime() + timedelta(hours=24)
        appointment = AppointmentFactory(status="confirmed", reminder_sent=False)
        appointment.scheduled_date = now.date()
        appointment.scheduled_time = now.time().replace(second=0, microsecond=0)
        appointment.save(update_fields=["scheduled_date", "scheduled_time", "reminder_sent", "updated_at"])

        monkeypatch.setattr("apps.notifications.tasks._safe_delay", lambda *args, **kwargs: None)

        result = send_bulk_reminders()

        appointment.refresh_from_db()
        assert result >= 1
        assert appointment.reminder_sent is True

    def test_send_sms_notification(self, monkeypatch):
        called = {"value": False}

        def _send_sms(phone, message, **kwargs):
            called["value"] = True
            assert phone == "+5511999999999"
            return {"success": True, "sid": "SM_TEST"}

        monkeypatch.setattr("apps.notifications.services.SMSService.send_sms", _send_sms)
        send_sms_notification("+5511999999999", "Teste")
        assert called["value"] is True

    def test_check_no_show_appointments(self, monkeypatch):
        appointment = AppointmentFactory(status="confirmed", duration_minutes=30)
        past = timezone.localtime() - timedelta(hours=2)
        appointment.scheduled_date = past.date()
        appointment.scheduled_time = past.time().replace(second=0, microsecond=0)
        appointment.save(update_fields=["scheduled_date", "scheduled_time", "updated_at"])

        monkeypatch.setattr("apps.notifications.tasks._safe_delay", lambda *args, **kwargs: None)

        result = check_no_show_appointments()

        appointment.refresh_from_db()
        assert result >= 1
        assert appointment.status == "no_show"

    def test_generate_daily_summary(self, monkeypatch):
        appointment = AppointmentFactory(status="completed")
        appointment.scheduled_date = timezone.localdate()
        appointment.save(update_fields=["scheduled_date", "updated_at"])
        monkeypatch.setattr("apps.notifications.tasks._safe_delay", lambda *args, **kwargs: None)

        result = generate_daily_summary()

        assert result >= 0

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

    def test_send_bulk_reminders_deduplicates_stage(self, monkeypatch):
        now = timezone.localtime() + timedelta(hours=24)
        appointment = AppointmentFactory(status="confirmed", reminder_sent=False, reminder_stages_sent={})
        appointment.scheduled_date = now.date()
        appointment.scheduled_time = now.time().replace(second=0, microsecond=0)
        appointment.save(
            update_fields=["scheduled_date", "scheduled_time", "reminder_sent", "reminder_stages_sent", "updated_at"]
        )

        monkeypatch.setattr("apps.notifications.tasks._safe_delay", lambda *args, **kwargs: None)
        monkeypatch.setattr(
            "apps.notifications.services.SMSService.send_reminder",
            lambda *args, **kwargs: {"success": True, "sid": "SM_REMINDER"},
        )

        first = send_bulk_reminders()
        second = send_bulk_reminders()

        appointment.refresh_from_db()
        assert first >= 1
        assert second >= 0
        assert "24h" in (appointment.reminder_stages_sent or {})
