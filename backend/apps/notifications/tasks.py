import logging
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Any

from django.db.models import Sum
from django.db.models.functions import Coalesce
from django.utils import timezone

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 3})
def send_email_notification(
    self,
    user_id: str,
    subject: str,
    body_or_template: str,
    context: dict[str, Any] | None = None,
):  # noqa: ANN001
    """Send email notification."""
    del self
    from apps.users.models import CustomUser

    from .services import EmailService

    try:
        user = CustomUser.objects.get(id=user_id)
        template_name = body_or_template if body_or_template.endswith(".html") else None
        email_context = context or {}
        if not template_name:
            email_context = {"message": body_or_template, **email_context}
        if context is None:
            EmailService.send_email(user, subject, template_name or body_or_template)
        else:
            EmailService.send_email(user.email, subject, template_name or body_or_template, email_context)
    except CustomUser.DoesNotExist:
        logger.warning("User %s not found for email notification", user_id)


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 3})
def send_push_notification(
    self,
    user_id: str,
    title: str,
    body: str,
    data: dict[str, Any] | None = None,
):  # noqa: ANN001
    """Send push notification."""
    from .services import PushService

    result = PushService.send_to_user(user_id, title, body, data)
    if result["failure_count"] > 0 and result["success_count"] == 0:
        raise RuntimeError(f"Push notification failed for user {user_id}: {result['errors']}")


@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 3})
def send_sms_notification(self, phone: str, message: str, user_id: str | None = None):  # noqa: ANN001
    """Send SMS notification."""
    del self
    user = None
    if user_id:
        from apps.users.models import CustomUser

        user = CustomUser.objects.filter(id=user_id).first()

    from .services import SMSService

    result = SMSService.send_sms(phone, message, user=user, require_consent=bool(user))
    if not result["success"]:
        raise RuntimeError(f"SMS notification failed for phone {phone}")


def _safe_delay(task, *args, **kwargs):
    try:
        task.delay(*args, **kwargs)
    except Exception:  # noqa: BLE001
        logger.exception("Failed to enqueue task %s", task.name)


def _minutes_until(appointment, now) -> float:
    scheduled_datetime = timezone.make_aware(
        datetime.combine(appointment.scheduled_date, appointment.scheduled_time),
        timezone.get_current_timezone(),
    )
    return (scheduled_datetime - now).total_seconds() / 60


def _was_stage_sent(appointment, stage: str) -> bool:
    stages = appointment.reminder_stages_sent or {}
    return stage in stages


@shared_task
def send_bulk_reminders():
    """Send multi-stage appointment reminders (48h, 24h, 2h, 30min)."""
    from apps.appointments.models import Appointment

    from .services import NotificationService, SMSService

    now = timezone.now()
    lower_bound = timezone.localdate()
    upper_bound = timezone.localdate() + timedelta(days=3)

    appointments = Appointment.objects.filter(
        status="confirmed",
        scheduled_date__gte=lower_bound,
        scheduled_date__lte=upper_bound,
    ).select_related("patient", "doctor__user").order_by("scheduled_date", "scheduled_time")

    sent_count = 0
    for appointment in appointments:
        minutes_to_appointment = _minutes_until(appointment, now)
        if minutes_to_appointment <= 0:
            continue

        stages = [
            ("48h", 48 * 60, 90, "Lembrete de consulta (48h)", "Sua consulta esta marcada para daqui a 48 horas."),
            ("24h", 24 * 60, 90, "Lembrete de consulta (24h)", "Sua consulta acontece amanha."),
            ("2h", 2 * 60, 75, "Lembrete de consulta (2h)", "Sua consulta acontece em aproximadamente 2 horas."),
            ("30min", 30, 30, "Lembrete final (30min)", "Sua consulta esta prestes a comecar."),
        ]

        stage_sent = False
        for stage, target_minutes, window, title, body in stages:
            if not (target_minutes - window <= minutes_to_appointment <= target_minutes + window):
                continue
            if _was_stage_sent(appointment, stage):
                continue

            reminder_meta = {
                "appointment_id": str(appointment.id),
                "reminder_stage": stage,
            }
            notification = NotificationService.create_notification(
                user=appointment.patient,
                notification_type="reminder",
                title=title,
                body=body,
                channel="push",
                metadata=reminder_meta,
            )
            sent_count += 1
            stage_sent = True

            if stage in {"24h", "2h", "30min"}:
                _safe_delay(send_push_notification, str(appointment.patient.id), title, body, reminder_meta)

            if stage in {"48h", "24h"}:
                _safe_delay(
                    send_email_notification,
                    str(appointment.patient.id),
                    title,
                    "appointment_reminder.html",
                    {
                        "doctor_name": appointment.doctor.user.full_name,
                        "date": appointment.scheduled_date.isoformat(),
                        "time": appointment.scheduled_time.strftime("%H:%M"),
                    },
                )
            if stage == "2h" and appointment.patient.phone:
                SMSService.send_reminder(
                    appointment.patient.phone,
                    appointment,
                    user=appointment.patient,
                )

            logger.info(
                "Reminder stage %s sent for appointment %s using notification %s",
                stage,
                appointment.id,
                notification.id,
            )
            reminders = appointment.reminder_stages_sent or {}
            reminders[stage] = timezone.now().isoformat()
            appointment.reminder_stages_sent = reminders
            appointment.save(update_fields=["reminder_stages_sent", "updated_at"])

        if stage_sent and not appointment.reminder_sent:
            appointment.reminder_sent = True
            appointment.save(update_fields=["reminder_sent", "updated_at"])

    logger.info("Sent %d reminders in bulk run", sent_count)
    return sent_count


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


@shared_task
def check_no_show_appointments():
    """Mark appointments as no_show 30 minutes after expected end time."""
    from apps.appointments.models import Appointment
    from apps.appointments.services import BookingService
    from apps.users.models import CustomUser

    from .services import NotificationService

    now = timezone.now()
    to_check = Appointment.objects.filter(status="confirmed").select_related("doctor__user", "convenio")

    marked_count = 0
    for appointment in to_check:
        scheduled_datetime = timezone.make_aware(
            datetime.combine(appointment.scheduled_date, appointment.scheduled_time),
            timezone.get_current_timezone(),
        )
        threshold = scheduled_datetime + timedelta(minutes=appointment.duration_minutes + 30)
        if now < threshold:
            continue

        appointment = BookingService.mark_no_show(appointment)
        marked_count += 1

        convenio_admins = CustomUser.objects.filter(
            role="convenio_admin",
            convenio=appointment.convenio,
            is_active=True,
        )
        for admin_user in convenio_admins:
            NotificationService.create_notification(
                user=admin_user,
                notification_type="system",
                title="No-show identificado",
                body=(
                    f"Paciente {appointment.patient.full_name} nao compareceu para consulta de "
                    f"{appointment.scheduled_date} as {appointment.scheduled_time.strftime('%H:%M')}."
                ),
                channel="push",
                metadata={"appointment_id": str(appointment.id), "status": "no_show"},
            )
            _safe_delay(
                send_push_notification,
                str(admin_user.id),
                "No-show identificado",
                f"Consulta {appointment.id} marcada como no_show.",
                {"appointment_id": str(appointment.id), "status": "no_show"},
            )

    logger.info("Marked %d appointments as no_show", marked_count)
    return marked_count


@shared_task
def generate_daily_summary():
    """Send a daily summary to convenio admins."""
    from apps.appointments.models import Appointment
    from apps.convenios.models import Convenio
    from apps.payments.models import Payment
    from apps.users.models import CustomUser

    from .services import NotificationService

    today = timezone.localdate()
    notified_admins = 0

    convenios = Convenio.objects.filter(is_active=True)
    for convenio in convenios:
        appointments_qs = Appointment.objects.filter(convenio=convenio, scheduled_date=today)
        completed_count = appointments_qs.filter(status="completed").count()
        cancelled_count = appointments_qs.filter(status="cancelled").count()
        no_show_count = appointments_qs.filter(status="no_show").count()
        revenue = (
            Payment.objects.filter(
                appointment__convenio=convenio,
                status="completed",
                paid_at__date=today,
            ).aggregate(total=Coalesce(Sum("amount"), Decimal("0.00")))["total"]
            or 0
        )
        subject = f"Resumo diario - {convenio.name}"
        body = (
            f"Consultas realizadas: {completed_count} | Canceladas: {cancelled_count} | "
            f"No-show: {no_show_count} | Receita: R$ {revenue}"
        )

        admins = CustomUser.objects.filter(role="convenio_admin", convenio=convenio, is_active=True)
        for admin in admins:
            NotificationService.create_notification(
                user=admin,
                notification_type="system",
                title="Resumo diario",
                body=body,
                channel="email",
                metadata={"date": today.isoformat(), "convenio_id": str(convenio.id)},
            )
            _safe_delay(send_email_notification, str(admin.id), subject, body)
            notified_admins += 1

    logger.info("Sent daily summaries to %d admins", notified_admins)
    return notified_admins
