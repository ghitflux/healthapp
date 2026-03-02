import logging
from datetime import timedelta

from django.core.cache import cache
from django.utils import timezone

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task
def cleanup_expired_appointments():
    """Cancel appointments with expired payment (30 min timeout)."""
    from .models import Appointment

    cutoff = timezone.now() - timedelta(minutes=30)
    expired = Appointment.objects.filter(
        status="pending",
        created_at__lt=cutoff,
    )
    from .services import BookingService

    for appointment in expired.only("doctor_id", "scheduled_date", "scheduled_time"):
        lock_key = BookingService._get_lock_key(
            appointment.doctor_id,
            appointment.scheduled_date,
            appointment.scheduled_time,
        )
        cache.delete(lock_key)

    count = expired.update(status="cancelled", cancellation_reason="Payment timeout")
    if count:
        logger.info("Cleaned up %d expired appointments", count)
    return count
