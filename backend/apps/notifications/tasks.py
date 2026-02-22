import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task
def send_email_notification(user_id: str, subject: str, body: str):
    """Send email notification (lightweight — django.tasks candidate)."""
    from apps.users.models import CustomUser

    from .services import EmailService

    try:
        user = CustomUser.objects.get(id=user_id)
        EmailService.send_email(user, subject, body)
    except CustomUser.DoesNotExist:
        logger.warning("User %s not found for email notification", user_id)


@shared_task
def send_push_notification(user_id: str, title: str, body: str, data: dict = None):
    """Send push notification (lightweight — django.tasks candidate)."""
    from apps.users.models import CustomUser

    from .services import PushService

    try:
        user = CustomUser.objects.get(id=user_id)
        PushService.send_push(user, title, body, data)
    except CustomUser.DoesNotExist:
        logger.warning("User %s not found for push notification", user_id)


@shared_task
def send_bulk_reminders():
    """Send appointment reminders (heavy — Celery)."""
    from datetime import timedelta

    from django.utils import timezone

    from apps.appointments.models import Appointment

    from .services import NotificationService, PushService

    now = timezone.now()

    # 24h reminder
    reminder_24h = now + timedelta(hours=24)
    appointments_24h = Appointment.objects.filter(
        status="confirmed",
        scheduled_date=reminder_24h.date(),
        reminder_sent=False,
    ).select_related("patient", "doctor__user")

    count = 0
    for apt in appointments_24h:
        NotificationService.create_notification(
            user=apt.patient,
            type="reminder",
            title="Lembrete de consulta",
            body=f"Sua consulta com Dr. {apt.doctor.user.full_name} é amanhã às {apt.scheduled_time}.",
            metadata={"appointment_id": str(apt.id)},
        )
        PushService.send_push(
            apt.patient,
            "Lembrete de consulta",
            f"Amanhã às {apt.scheduled_time} com Dr. {apt.doctor.user.full_name}",
        )
        apt.reminder_sent = True
        apt.save(update_fields=["reminder_sent"])
        count += 1

    logger.info("Sent %d appointment reminders", count)
    return count


@shared_task
def cleanup_old_notifications():
    """Remove notifications older than 90 days (heavy — Celery)."""
    from datetime import timedelta

    from django.utils import timezone

    from .models import Notification

    cutoff = timezone.now() - timedelta(days=90)
    count, _ = Notification.objects.filter(created_at__lt=cutoff, is_read=True).delete()
    logger.info("Cleaned up %d old notifications", count)
    return count
