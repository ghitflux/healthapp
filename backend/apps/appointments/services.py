import logging
from datetime import datetime, timedelta
from decimal import Decimal

from django.core.cache import cache
from django.db.models import Avg, Count
from django.utils import timezone

from apps.core.exceptions import BusinessLogicError, ConflictError
from apps.core.services import PlatformSettingsService
from apps.notifications.helpers import (
    notify_appointment_cancelled,
    notify_appointment_confirmed,
    notify_appointment_created,
)
from apps.notifications.services import NotificationService

from .models import Appointment, Rating
from .policies import CancellationPolicy, RefundCalculator

logger = logging.getLogger(__name__)

DEFAULT_LOCK_TTL = 60 * 10  # 10 minutes
LOCK_PREFIX = "appointment:lock:"
VALID_TRANSITIONS = {
    "pending": {"confirmed", "cancelled"},
    "confirmed": {"in_progress", "cancelled", "no_show"},
    "in_progress": {"completed", "cancelled"},
    "completed": set(),
    "cancelled": set(),
    "no_show": set(),
}


class BookingService:
    """Service for appointment booking with Redis lock."""

    @staticmethod
    def _get_lock_key(doctor_id, date, time) -> str:
        return f"{LOCK_PREFIX}{doctor_id}:{date}:{time}"

    @staticmethod
    def _get_lock_ttl_seconds() -> int:
        settings_obj = PlatformSettingsService.get_settings()
        ttl_minutes = max(int(settings_obj.appointment_lock_ttl_minutes), 1)
        return ttl_minutes * 60

    @staticmethod
    def _appointment_datetime(appointment: Appointment):
        return timezone.make_aware(
            datetime.combine(appointment.scheduled_date, appointment.scheduled_time),
            timezone.get_current_timezone(),
        )

    @staticmethod
    def validate_transition(appointment: Appointment, new_status: str) -> None:
        current_status = appointment.status
        allowed = VALID_TRANSITIONS.get(current_status, set())
        if new_status not in allowed:
            raise BusinessLogicError(f"Cannot transition from {current_status} to {new_status}.")

    @staticmethod
    def create_appointment(patient, doctor, data: dict) -> Appointment:
        """Create an appointment with Redis lock to prevent double booking."""
        date = data["scheduled_date"]
        time = data["scheduled_time"]
        lock_key = BookingService._get_lock_key(doctor.id, date, time)
        settings_obj = PlatformSettingsService.get_settings()
        today = timezone.localdate()

        max_advance_date = today + timedelta(days=settings_obj.max_advance_booking_days)
        if date > max_advance_date:
            raise BusinessLogicError(
                f"Appointments can only be booked up to {settings_obj.max_advance_booking_days} days in advance."
            )

        patient_appointments_count = Appointment.objects.filter(
            patient=patient,
            scheduled_date=date,
        ).exclude(status__in=["cancelled", "no_show"]).count()
        if patient_appointments_count >= settings_obj.max_appointments_per_day_patient:
            raise BusinessLogicError(
                f"Daily appointment limit exceeded ({settings_obj.max_appointments_per_day_patient})."
            )

        # Try to acquire lock
        if not cache.add(lock_key, str(patient.id), timeout=BookingService._get_lock_ttl_seconds()):
            raise ConflictError("This time slot is currently being booked by another patient.")

        # Check if slot is actually available
        existing = Appointment.objects.filter(
            doctor=doctor,
            scheduled_date=date,
            scheduled_time=time,
        ).exclude(status__in=["cancelled", "no_show"]).exists()

        if existing:
            cache.delete(lock_key)
            raise ConflictError("This time slot is already booked.")

        # Determine price
        price = doctor.consultation_price
        if data.get("exam_type"):
            price = data["exam_type"].price

        appointment = Appointment.objects.create(
            patient=patient,
            doctor=doctor,
            convenio=doctor.convenio,
            appointment_type=data.get("appointment_type", "consultation"),
            exam_type=data.get("exam_type"),
            scheduled_date=date,
            scheduled_time=time,
            duration_minutes=doctor.consultation_duration,
            price=price,
            status="pending",
        )

        notify_appointment_created(appointment)

        logger.info("Appointment %s created for patient %s with doctor %s", appointment.id, patient.id, doctor.id)
        return appointment

    @staticmethod
    def cancel_appointment(appointment: Appointment, cancelled_by, reason: str = "") -> Appointment:
        """Cancel an appointment and release the lock."""
        BookingService.validate_transition(appointment, "cancelled")
        if appointment.status == "in_progress" and not reason:
            raise BusinessLogicError("Cancellation reason is required for in-progress appointments.")

        cancellation_result = CancellationPolicy.check_cancellation(appointment, cancelled_by)
        if not cancellation_result.allowed:
            raise BusinessLogicError(cancellation_result.reason)

        appointment.status = "cancelled"
        appointment.cancellation_reason = reason
        appointment.cancelled_by = cancelled_by
        appointment.save(update_fields=["status", "cancellation_reason", "cancelled_by", "updated_at"])

        # Release lock
        lock_key = BookingService._get_lock_key(
            appointment.doctor_id,
            appointment.scheduled_date,
            appointment.scheduled_time,
        )
        cache.delete(lock_key)

        if appointment.payment and appointment.payment.status == "completed":
            refund_amount = RefundCalculator.calculate_refund(appointment.payment, cancellation_result)
            if refund_amount > Decimal("0.00"):
                from apps.payments.services import StripeService

                StripeService.refund_payment(appointment.payment, amount=refund_amount)

        notify_appointment_cancelled(appointment, cancelled_by)
        logger.info("Appointment %s cancelled by %s", appointment.id, cancelled_by.id)
        return appointment

    @staticmethod
    def confirm_appointment(appointment: Appointment) -> Appointment:
        """Confirm a pending appointment."""
        BookingService.validate_transition(appointment, "confirmed")
        appointment.status = "confirmed"
        appointment.save(update_fields=["status", "updated_at"])
        notify_appointment_confirmed(appointment)
        logger.info("Appointment %s confirmed", appointment.id)
        return appointment

    @staticmethod
    def start_appointment(appointment: Appointment) -> Appointment:
        BookingService.validate_transition(appointment, "in_progress")
        appointment.status = "in_progress"
        appointment.started_at = timezone.now()
        appointment.save(update_fields=["status", "started_at", "updated_at"])
        NotificationService.create_notification(
            user=appointment.patient,
            notification_type="appointment",
            title="Consulta iniciada",
            body="Sua consulta foi iniciada.",
            channel="push",
            metadata={"appointment_id": str(appointment.id), "status": "in_progress"},
        )
        return appointment

    @staticmethod
    def complete_appointment(appointment: Appointment, notes: str = "") -> Appointment:
        BookingService.validate_transition(appointment, "completed")
        appointment.status = "completed"
        appointment.completed_at = timezone.now()
        if notes:
            appointment.notes = notes
            appointment.save(update_fields=["status", "completed_at", "notes", "updated_at"])
        else:
            appointment.save(update_fields=["status", "completed_at", "updated_at"])

        NotificationService.create_notification(
            user=appointment.patient,
            notification_type="appointment",
            title="Consulta finalizada",
            body="Consulta finalizada! Avalie sua experiencia.",
            channel="push",
            metadata={"appointment_id": str(appointment.id), "status": "completed"},
        )
        return appointment

    @staticmethod
    def mark_no_show(appointment: Appointment) -> Appointment:
        BookingService.validate_transition(appointment, "no_show")
        appointment.status = "no_show"
        appointment.no_show_at = timezone.now()
        appointment.save(update_fields=["status", "no_show_at", "updated_at"])
        NotificationService.create_notification(
            user=appointment.patient,
            notification_type="appointment",
            title="Consulta marcada como no-show",
            body="Sua consulta foi marcada como no-show.",
            channel="push",
            metadata={"appointment_id": str(appointment.id), "status": "no_show"},
        )
        return appointment

    @staticmethod
    def get_cancellation_policy(appointment: Appointment, user) -> dict:
        cancellation_result = CancellationPolicy.check_cancellation(appointment, user)
        refund_amount = Decimal("0.00")
        if appointment.payment and appointment.payment.status == "completed":
            refund_amount = RefundCalculator.calculate_refund(appointment.payment, cancellation_result)
        return {
            "can_cancel": cancellation_result.allowed,
            "fee_amount": cancellation_result.fee_amount,
            "refund_amount": refund_amount,
            "deadline": cancellation_result.deadline,
            "reason": cancellation_result.reason,
        }

    @staticmethod
    def update_doctor_rating(doctor) -> None:
        metrics = Rating.objects.filter(doctor=doctor).aggregate(avg_score=Avg("score"), total=Count("id"))
        average = metrics["avg_score"] or 0
        total_ratings = metrics["total"] or 0
        doctor.rating = Decimal(str(round(average, 2)))
        doctor.total_ratings = total_ratings
        doctor.save(update_fields=["rating", "total_ratings", "updated_at"])
