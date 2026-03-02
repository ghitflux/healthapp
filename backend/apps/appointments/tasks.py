import logging
from datetime import timedelta

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
    count = expired.update(status="cancelled", cancellation_reason="Payment timeout")
    if count:
        logger.info("Cleaned up %d expired appointments", count)
    return count
