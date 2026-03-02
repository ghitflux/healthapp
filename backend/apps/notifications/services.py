import logging
from typing import Any

from django.utils import timezone

from .models import Notification

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for creating and managing notifications."""

    @staticmethod
    def create_notification(
        user,
        notification_type: str,
        title: str,
        body: str,
        channel: str = "push",
        metadata: dict[str, Any] | None = None,
    ):
        return Notification.objects.create(
            user=user,
            type=notification_type,
            title=title,
            body=body,
            channel=channel,
            metadata=metadata or {},
        )

    @staticmethod
    def mark_as_read(notification: Notification):
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save(update_fields=["is_read", "read_at", "updated_at"])

    @staticmethod
    def mark_all_as_read(user):
        Notification.objects.filter(user=user, is_read=False).update(
            is_read=True,
            read_at=timezone.now(),
        )

    @staticmethod
    def get_unread_count(user) -> int:
        return Notification.objects.filter(user=user, is_read=False).count()


class PushService:
    """Service for sending push notifications via Firebase."""

    @staticmethod
    def send_push(user, title: str, body: str, data: dict[str, Any] | None = None):
        # TODO: Implement Firebase push notification
        logger.info("Push notification sent to %s: %s", user.id, title)


class EmailService:
    """Service for sending email notifications."""

    @staticmethod
    def send_email(user, subject: str, body: str):
        # TODO: Implement email sending via SendGrid/SES
        logger.info("Email sent to %s: %s", user.email, subject)


class SMSService:
    """Service for sending SMS notifications."""

    @staticmethod
    def send_sms(phone: str, message: str):
        # TODO: Implement SMS sending via Twilio/Zenvia
        logger.info("SMS sent to %s", phone)
