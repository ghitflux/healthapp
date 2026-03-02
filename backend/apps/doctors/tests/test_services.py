from datetime import date, timedelta

import pytest
from django.utils import timezone

from apps.appointments.tests.factories import AppointmentFactory
from apps.doctors.services import AvailabilityService
from apps.doctors.tests.factories import DoctorFactory, DoctorScheduleFactory, ScheduleExceptionFactory


@pytest.mark.django_db
class TestAvailabilityService:
    @staticmethod
    def _next_weekday(target_weekday: int) -> date:
        today = timezone.localdate()
        delta = (target_weekday - today.weekday()) % 7
        if delta == 0:
            delta = 7
        return today + timedelta(days=delta)

    def test_returns_empty_for_full_day_exception(self):
        doctor = DoctorFactory()
        target_date = self._next_weekday(0)
        DoctorScheduleFactory(doctor=doctor, weekday=0, start_time="08:00", end_time="10:00")
        ScheduleExceptionFactory(
            doctor=doctor,
            date=target_date,
            is_full_day=True,
            is_available=False,
        )

        slots = AvailabilityService.get_available_slots(doctor, target_date)
        assert slots == []

    def test_returns_empty_without_schedule(self):
        doctor = DoctorFactory()
        target_date = self._next_weekday(1)

        slots = AvailabilityService.get_available_slots(doctor, target_date)
        assert slots == []

    def test_marks_booked_and_exception_ranges_as_unavailable(self):
        doctor = DoctorFactory()
        target_date = self._next_weekday(2)
        DoctorScheduleFactory(
            doctor=doctor,
            weekday=2,
            start_time="08:00",
            end_time="10:00",
            slot_duration=30,
        )

        AppointmentFactory(
            doctor=doctor,
            convenio=doctor.convenio,
            scheduled_date=target_date,
            scheduled_time="08:30:00",
            status="confirmed",
        )
        ScheduleExceptionFactory(
            doctor=doctor,
            date=target_date,
            is_full_day=False,
            is_available=False,
            start_time="09:00",
            end_time="09:30",
        )

        slots = AvailabilityService.get_available_slots(doctor, target_date)

        assert len(slots) == 4
        assert slots[0]["time"].strftime("%H:%M") == "08:00"
        assert slots[0]["is_available"] is True
        assert slots[1]["time"].strftime("%H:%M") == "08:30"
        assert slots[1]["is_available"] is False
        assert slots[2]["time"].strftime("%H:%M") == "09:00"
        assert slots[2]["is_available"] is False
        assert slots[3]["time"].strftime("%H:%M") == "09:30"
        assert slots[3]["is_available"] is True
