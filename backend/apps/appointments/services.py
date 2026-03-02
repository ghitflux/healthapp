import logging

from django.core.cache import cache

from apps.core.exceptions import BusinessLogicError, ConflictError

from .models import Appointment

logger = logging.getLogger(__name__)

LOCK_TTL = 60 * 10  # 10 minutes
LOCK_PREFIX = "appointment:lock:"


class BookingService:
    """Service for appointment booking with Redis lock."""

    @staticmethod
    def _get_lock_key(doctor_id, date, time) -> str:
        return f"{LOCK_PREFIX}{doctor_id}:{date}:{time}"

    @staticmethod
    def create_appointment(patient, doctor, data: dict) -> Appointment:
        """Create an appointment with Redis lock to prevent double booking."""
        date = data["scheduled_date"]
        time = data["scheduled_time"]
        lock_key = BookingService._get_lock_key(doctor.id, date, time)

        # Try to acquire lock
        if not cache.add(lock_key, str(patient.id), timeout=LOCK_TTL):
            raise ConflictError("This time slot is currently being booked by another patient.")

        # Check if slot is actually available
        existing = Appointment.objects.filter(
            doctor=doctor,
            scheduled_date=date,
            scheduled_time=time,
        ).exclude(status="cancelled").exists()

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

        logger.info("Appointment %s created for patient %s with doctor %s", appointment.id, patient.id, doctor.id)
        return appointment

    @staticmethod
    def cancel_appointment(appointment: Appointment, cancelled_by, reason: str = "") -> Appointment:
        """Cancel an appointment and release the lock."""
        if appointment.status in ("completed", "cancelled"):
            raise BusinessLogicError("Cannot cancel a completed or already cancelled appointment.")

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

        logger.info("Appointment %s cancelled by %s", appointment.id, cancelled_by.id)
        return appointment

    @staticmethod
    def confirm_appointment(appointment: Appointment) -> Appointment:
        """Confirm a pending appointment."""
        if appointment.status != "pending":
            raise BusinessLogicError("Only pending appointments can be confirmed.")

        appointment.status = "confirmed"
        appointment.save(update_fields=["status", "updated_at"])
        logger.info("Appointment %s confirmed", appointment.id)
        return appointment
