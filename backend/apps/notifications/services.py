from __future__ import annotations

import logging
import re
from collections.abc import Iterable
from typing import Any
from uuid import UUID

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.html import strip_tags

from apps.users.models import ConsentRecord
from config.firebase import get_firebase_app

from .models import DeviceToken, Notification

logger = logging.getLogger(__name__)


def _capture_exception(exc: Exception) -> None:
    try:
        import sentry_sdk

        sentry_sdk.capture_exception(exc)
    except Exception:  # noqa: BLE001
        logger.exception("Failed to capture exception in Sentry")


def _has_consent(user, purpose: str) -> bool:
    if not user:
        return False
    return ConsentRecord.objects.filter(user=user, purpose=purpose, granted=True).exists()


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
    """Service for sending push notifications through Firebase FCM."""

    MAX_BATCH_SIZE = 500

    @classmethod
    def _chunk(cls, values: list[DeviceToken], size: int) -> Iterable[list[DeviceToken]]:
        for idx in range(0, len(values), size):
            yield values[idx : idx + size]

    @staticmethod
    def _deactivate_token(device_token: DeviceToken) -> None:
        if device_token.is_active:
            device_token.is_active = False
            device_token.save(update_fields=["is_active", "updated_at"])

    @classmethod
    def _send_multicast(
        cls,
        device_tokens: list[DeviceToken],
        title: str,
        body: str,
        data: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        app = get_firebase_app()
        if not app:
            return {"success_count": 0, "failure_count": 0, "errors": ["firebase_not_configured"]}

        from firebase_admin import messaging

        success_count = 0
        failure_count = 0
        errors: list[str] = []
        for batch in cls._chunk(device_tokens, cls.MAX_BATCH_SIZE):
            message = messaging.MulticastMessage(
                notification=messaging.Notification(title=title, body=body),
                data={k: str(v) for k, v in (data or {}).items()},
                tokens=[item.token for item in batch],
            )
            response = messaging.send_each_for_multicast(message, app=app)
            success_count += response.success_count
            failure_count += response.failure_count

            for idx, result in enumerate(response.responses):
                if result.success:
                    continue
                exc = result.exception
                if exc:
                    errors.append(str(exc))
                    if isinstance(exc, messaging.UnregisteredError | messaging.SenderIdMismatchError):
                        cls._deactivate_token(batch[idx])
                    else:
                        _capture_exception(exc)
        if device_tokens:
            DeviceToken.objects.filter(id__in=[item.id for item in device_tokens]).update(last_used_at=timezone.now())

        return {
            "success_count": success_count,
            "failure_count": failure_count,
            "errors": errors,
        }

    @classmethod
    def send_to_user(
        cls,
        user_id: str,
        title: str,
        body: str,
        data: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        try:
            lookup_id = UUID(str(user_id))
        except ValueError:
            logger.warning("Invalid user id for push notification: %s", user_id)
            return {"success_count": 0, "failure_count": 0, "errors": ["invalid_user_id"]}
        tokens = list(DeviceToken.objects.filter(user_id=lookup_id, is_active=True))
        if not tokens:
            logger.info("No active device tokens for user %s", user_id)
            return {"success_count": 0, "failure_count": 0, "errors": []}
        return cls._send_multicast(tokens, title, body, data)

    @classmethod
    def send_to_multiple(
        cls,
        user_ids: list[str],
        title: str,
        body: str,
        data: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        if not user_ids:
            return {"success_count": 0, "failure_count": 0, "errors": []}
        lookup_ids: list[UUID] = []
        for user_id in user_ids:
            try:
                lookup_ids.append(UUID(str(user_id)))
            except ValueError:
                continue
        tokens = list(DeviceToken.objects.filter(user_id__in=lookup_ids, is_active=True))
        if not tokens:
            return {"success_count": 0, "failure_count": 0, "errors": []}
        return cls._send_multicast(tokens, title, body, data)

    @staticmethod
    def send_to_topic(
        topic: str,
        title: str,
        body: str,
        data: dict[str, Any] | None = None,
    ) -> bool:
        app = get_firebase_app()
        if not app:
            return False
        from firebase_admin import messaging

        try:
            message = messaging.Message(
                topic=topic,
                notification=messaging.Notification(title=title, body=body),
                data={k: str(v) for k, v in (data or {}).items()},
            )
            messaging.send(message, app=app)
            return True
        except Exception as exc:  # noqa: BLE001
            logger.exception("Failed to send topic push notification")
            _capture_exception(exc)
            return False

    @classmethod
    def send_push(cls, user, title: str, body: str, data: dict[str, Any] | None = None):
        return cls.send_to_user(str(user.id), title, body, data)


class EmailService:
    """Service for sending emails using Django's configured backend."""

    @staticmethod
    def _resolve_email(to) -> str:
        if hasattr(to, "email"):
            return str(to.email)
        return str(to)

    @staticmethod
    def _render_content(template_name: str | None, context: dict[str, Any] | None) -> tuple[str, str]:
        if template_name and template_name.endswith(".html"):
            html = render_to_string(f"email/{template_name}", context or {})
            return html, strip_tags(html)
        text = str(template_name or "")
        return f"<p>{text}</p>", text

    @classmethod
    def send_email(
        cls,
        to,
        subject: str,
        template_name: str | None,
        context: dict[str, Any] | None = None,
        *,
        include_unsubscribe: bool = True,
    ) -> bool:
        recipient = cls._resolve_email(to)
        if not recipient:
            logger.warning("No recipient provided for email with subject %s", subject)
            return False

        try:
            html_body, text_body = cls._render_content(template_name, context)
            headers = {"Reply-To": settings.DEFAULT_FROM_EMAIL}
            if include_unsubscribe:
                headers["List-Unsubscribe"] = f"<mailto:{settings.DEFAULT_FROM_EMAIL}?subject=unsubscribe>"
            message = EmailMultiAlternatives(
                subject=subject,
                body=text_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[recipient],
                headers=headers,
            )
            message.attach_alternative(html_body, "text/html")
            message.send(fail_silently=False)
            return True
        except Exception as exc:  # noqa: BLE001
            logger.exception("Failed to send email to %s", recipient)
            _capture_exception(exc)
            return False

    @classmethod
    def send_transactional(
        cls,
        to,
        subject: str,
        template_name: str,
        context: dict[str, Any] | None = None,
    ) -> bool:
        return cls.send_email(to, subject, template_name, context, include_unsubscribe=False)

    @classmethod
    def send_marketing(
        cls,
        to,
        subject: str,
        template_name: str,
        context: dict[str, Any] | None = None,
        *,
        user=None,
    ) -> bool:
        target_user = user if user is not None else (to if hasattr(to, "id") else None)
        if target_user and not _has_consent(target_user, "notifications_email"):
            logger.info("Skipping marketing email for user %s due to consent", target_user.id)
            return False
        return cls.send_email(to, subject, template_name, context, include_unsubscribe=True)


class SMSService:
    """Service for sending SMS using Twilio."""

    @staticmethod
    def _format_phone(phone: str) -> str:
        digits = re.sub(r"\D", "", phone)
        if digits.startswith("55"):
            return f"+{digits}"
        if len(digits) in {10, 11}:
            return f"+55{digits}"
        if digits.startswith("+"):
            return digits
        return f"+{digits}"

    @staticmethod
    def _build_client():
        account_sid = getattr(settings, "TWILIO_ACCOUNT_SID", "")
        auth_token = getattr(settings, "TWILIO_AUTH_TOKEN", "")
        if not account_sid or not auth_token:
            return None
        try:
            from twilio.rest import Client

            return Client(account_sid, auth_token)
        except Exception as exc:  # noqa: BLE001
            logger.exception("Twilio client initialization failed")
            _capture_exception(exc)
            return None

    @classmethod
    def send_sms(
        cls,
        to: str,
        message: str,
        *,
        user=None,
        require_consent: bool = False,
    ) -> dict[str, Any]:
        if require_consent and user and not _has_consent(user, "notifications_sms"):
            logger.info("Skipping SMS for user %s due to consent", user.id)
            return {"success": False, "sid": ""}

        from_number = getattr(settings, "TWILIO_PHONE_NUMBER", "")
        client = cls._build_client()
        if not from_number or not client:
            logger.warning("Twilio credentials are not configured. SMS send skipped.")
            return {"success": False, "sid": ""}

        formatted_number = cls._format_phone(to)
        try:
            twilio_message = client.messages.create(body=message, from_=from_number, to=formatted_number)
            return {"success": True, "sid": twilio_message.sid}
        except Exception as exc:  # noqa: BLE001
            logger.warning("Twilio failed sending SMS to %s: %s", formatted_number, exc)
            _capture_exception(exc)
            return {"success": False, "sid": ""}

    @classmethod
    def send_otp(cls, to: str, code: str, *, user=None) -> dict[str, Any]:
        message = f"HealthApp: Seu codigo de verificacao e {code}. Valido por 10 minutos."
        return cls.send_sms(to, message, user=user)

    @classmethod
    def send_reminder(cls, to: str, appointment, *, user=None) -> dict[str, Any]:
        message = (
            f"HealthApp: Lembrete - Consulta com Dr. {appointment.doctor.user.full_name} "
            f"amanha as {appointment.scheduled_time.strftime('%H:%M')}. "
            "Responda CANCELAR para cancelar."
        )
        return cls.send_sms(to, message, user=user, require_consent=True)
