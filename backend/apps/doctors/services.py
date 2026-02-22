import logging
from datetime import datetime, timedelta

from .models import Doctor, DoctorSchedule, ScheduleException

logger = logging.getLogger(__name__)


class AvailabilityService:
    """Service for computing doctor slot availability."""

    @staticmethod
    def get_available_slots(doctor: Doctor, date: datetime.date) -> list[dict]:
        """
        Calculate available slots for a doctor on a given date.

        Logic:
        1. Get weekly schedule for the day of week
        2. Generate all possible slots
        3. Subtract existing appointments
        4. Subtract schedule exceptions
        """
        weekday = date.weekday()  # 0=Monday

        # Check full-day exceptions
        full_day_exception = ScheduleException.objects.filter(
            doctor=doctor,
            date=date,
            is_full_day=True,
            is_available=False,
        ).exists()

        if full_day_exception:
            return []

        # Get schedules for this weekday
        schedules = DoctorSchedule.objects.filter(
            doctor=doctor,
            weekday=weekday,
            is_active=True,
        )

        if not schedules.exists():
            return []

        slots = []
        for schedule in schedules:
            slot_time = datetime.combine(date, schedule.start_time)
            end_time = datetime.combine(date, schedule.end_time)
            duration = timedelta(minutes=schedule.slot_duration)

            while slot_time + duration <= end_time:
                slots.append(
                    {
                        "time": slot_time.time(),
                        "duration_minutes": schedule.slot_duration,
                        "is_available": True,
                    }
                )
                slot_time += duration

        # Filter out booked slots
        from apps.appointments.models import Appointment

        booked_times = set(
            Appointment.objects.filter(
                doctor=doctor,
                scheduled_date=date,
            )
            .exclude(status="cancelled")
            .values_list("scheduled_time", flat=True)
        )

        # Filter out partial exceptions
        partial_exceptions = ScheduleException.objects.filter(
            doctor=doctor,
            date=date,
            is_full_day=False,
            is_available=False,
        )
        exception_ranges = [(exc.start_time, exc.end_time) for exc in partial_exceptions]

        available_slots = []
        for slot in slots:
            if slot["time"] in booked_times:
                slot["is_available"] = False

            for exc_start, exc_end in exception_ranges:
                if exc_start and exc_end and exc_start <= slot["time"] < exc_end:
                    slot["is_available"] = False
                    break

            available_slots.append(slot)

        return available_slots
