import logging
from datetime import date, datetime, time, timedelta
from typing import TypedDict

from django.core.cache import cache
from django.utils import timezone

from .models import Doctor, DoctorSchedule, ScheduleException

logger = logging.getLogger(__name__)


class SlotDict(TypedDict):
    time: time
    duration_minutes: int
    is_available: bool


class AvailabilityService:
    """Service for computing doctor slot availability."""

    AVAILABLE_DATES_CACHE_TTL = 60 * 5

    @staticmethod
    def get_available_slots(doctor: Doctor, date: date) -> list[SlotDict]:
        """
        Calculate available slots for a doctor on a given date.

        Logic:
        1. Get weekly schedule for the day of week
        2. Generate all possible slots
        3. Subtract existing appointments
        4. Subtract schedule exceptions
        """
        today = timezone.localdate()
        if date < today:
            return []

        weekday = date.weekday()  # 0=Monday
        schedules = list(
            DoctorSchedule.objects.filter(doctor=doctor, weekday=weekday, is_active=True).only(
                "start_time", "end_time", "slot_duration"
            )
        )
        if not schedules:
            return []

        full_day_exception = ScheduleException.objects.filter(
            doctor=doctor,
            date=date,
            is_full_day=True,
            is_available=False,
        ).exists()
        if full_day_exception:
            return []

        from apps.appointments.models import Appointment

        booked_times = set(
            Appointment.objects.filter(
                doctor=doctor,
                scheduled_date=date,
            )
            .exclude(status="cancelled")
            .values_list("scheduled_time", flat=True)
        )
        partial_exceptions = list(
            ScheduleException.objects.filter(
                doctor=doctor,
                date=date,
                is_full_day=False,
                is_available=False,
            ).only("start_time", "end_time")
        )
        exception_ranges = [(exc.start_time, exc.end_time) for exc in partial_exceptions]

        now_time = timezone.localtime().time()
        include_only_future = date == today
        slots: list[SlotDict] = []

        for schedule in schedules:
            slot_time = datetime.combine(date, schedule.start_time)
            end_time = datetime.combine(date, schedule.end_time)
            duration = timedelta(minutes=schedule.slot_duration)

            while slot_time + duration <= end_time:
                current_time = slot_time.time()
                if include_only_future and current_time < now_time:
                    slot_time += duration
                    continue

                is_available = current_time not in booked_times
                if is_available:
                    for exc_start, exc_end in exception_ranges:
                        if exc_start and exc_end and exc_start <= current_time < exc_end:
                            is_available = False
                            break

                slots.append(
                    {
                        "time": current_time,
                        "duration_minutes": schedule.slot_duration,
                        "is_available": is_available,
                    }
                )
                slot_time += duration

        return slots

    @classmethod
    def get_available_dates(cls, doctor: Doctor, start_date: date, end_date: date) -> list[dict]:
        """Return date list in range with at least one available slot."""
        if start_date > end_date:
            return []
        cache_key = f"doctor:{doctor.id}:available_dates:{start_date.isoformat()}:{end_date.isoformat()}"
        cached = cache.get(cache_key)
        if cached is not None:
            return cached

        results = []
        current = start_date
        while current <= end_date:
            slots = cls.get_available_slots(doctor, current)
            available_count = sum(1 for slot in slots if slot["is_available"])
            if available_count > 0:
                results.append({"date": current, "slots_count": available_count})
            current += timedelta(days=1)

        cache.set(cache_key, results, timeout=cls.AVAILABLE_DATES_CACHE_TTL)
        return results

    @classmethod
    def get_next_available_slot(cls, doctor: Doctor) -> dict | None:
        """Get the next available slot looking ahead up to 30 days."""
        today = timezone.localdate()
        for delta in range(0, 31):
            target_date = today + timedelta(days=delta)
            slots = cls.get_available_slots(doctor, target_date)
            for slot in slots:
                if slot["is_available"]:
                    return {
                        "date": target_date,
                        "time": slot["time"],
                        "duration_minutes": slot["duration_minutes"],
                    }
        return None
