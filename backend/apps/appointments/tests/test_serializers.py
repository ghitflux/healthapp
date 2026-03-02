from datetime import date, timedelta

import pytest
from django.utils import timezone

from apps.appointments.serializers import AppointmentCreateSerializer
from apps.appointments.tests.factories import AppointmentFactory
from apps.convenios.tests.factories import ConvenioFactory, ExamTypeFactory
from apps.doctors.tests.factories import DoctorFactory, DoctorScheduleFactory
from apps.users.tests.factories import PatientFactory


@pytest.mark.django_db
class TestAppointmentCreateSerializer:
    @staticmethod
    def _context(user):
        class _Request:
            def __init__(self, request_user):
                self.user = request_user

        return {"request": _Request(user)}

    @staticmethod
    def _next_weekday(target_weekday: int) -> date:
        today = timezone.localdate()
        delta = (target_weekday - today.weekday()) % 7
        if delta == 0:
            delta = 7
        return today + timedelta(days=delta)

    def test_rejects_past_date(self):
        patient = PatientFactory()
        doctor = DoctorFactory()

        serializer = AppointmentCreateSerializer(
            data={
                "doctor": str(doctor.id),
                "appointment_type": "consultation",
                "scheduled_date": (timezone.localdate() - timedelta(days=1)).isoformat(),
                "scheduled_time": "10:00:00",
            },
            context=self._context(patient),
        )

        assert serializer.is_valid() is False
        assert "scheduled_date" in serializer.errors

    def test_rejects_time_outside_doctor_schedule(self):
        patient = PatientFactory()
        doctor = DoctorFactory()
        DoctorScheduleFactory(doctor=doctor, weekday=0, start_time="08:00", end_time="12:00", is_active=True)
        monday = self._next_weekday(0)

        serializer = AppointmentCreateSerializer(
            data={
                "doctor": str(doctor.id),
                "appointment_type": "consultation",
                "scheduled_date": monday.isoformat(),
                "scheduled_time": "19:00:00",
            },
            context=self._context(patient),
        )

        assert serializer.is_valid() is False
        assert "scheduled_time" in serializer.errors

    def test_rejects_patient_conflicting_slot(self):
        patient = PatientFactory()
        doctor = DoctorFactory()
        monday = self._next_weekday(0)
        DoctorScheduleFactory(doctor=doctor, weekday=0, start_time="08:00", end_time="12:00", is_active=True)
        AppointmentFactory(
            patient=patient,
            doctor=doctor,
            convenio=doctor.convenio,
            scheduled_date=monday,
            scheduled_time="10:00:00",
            status="confirmed",
        )

        serializer = AppointmentCreateSerializer(
            data={
                "doctor": str(doctor.id),
                "appointment_type": "consultation",
                "scheduled_date": monday.isoformat(),
                "scheduled_time": "10:00:00",
            },
            context=self._context(patient),
        )

        assert serializer.is_valid() is False
        assert "scheduled_time" in serializer.errors

    def test_rejects_exam_type_from_other_convenio(self):
        patient = PatientFactory()
        doctor = DoctorFactory()
        DoctorScheduleFactory(
            doctor=doctor,
            weekday=2,
            start_time="08:00",
            end_time="12:00",
            is_active=True,
        )
        wednesday = self._next_weekday(2)

        other_convenio = ConvenioFactory()
        exam_type = ExamTypeFactory(convenio=other_convenio)

        serializer = AppointmentCreateSerializer(
            data={
                "doctor": str(doctor.id),
                "appointment_type": "exam",
                "exam_type": str(exam_type.id),
                "scheduled_date": wednesday.isoformat(),
                "scheduled_time": "10:00:00",
            },
            context=self._context(patient),
        )

        assert serializer.is_valid() is False
        assert "exam_type" in serializer.errors

    def test_accepts_valid_payload(self):
        patient = PatientFactory()
        doctor = DoctorFactory()
        friday = self._next_weekday(4)
        DoctorScheduleFactory(doctor=doctor, weekday=4, start_time="08:00", end_time="12:00", is_active=True)

        serializer = AppointmentCreateSerializer(
            data={
                "doctor": str(doctor.id),
                "appointment_type": "consultation",
                "scheduled_date": friday.isoformat(),
                "scheduled_time": "10:00:00",
            },
            context=self._context(patient),
        )

        assert serializer.is_valid(), serializer.errors
