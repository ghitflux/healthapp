from datetime import timedelta

import pytest
from django.core.cache import cache
from django.utils import timezone

from apps.appointments.services import BookingService
from apps.appointments.tests.factories import AppointmentFactory
from apps.convenios.tests.factories import ExamTypeFactory
from apps.core.exceptions import BusinessLogicError, ConflictError
from apps.doctors.tests.factories import DoctorFactory
from apps.users.tests.factories import PatientFactory


@pytest.mark.django_db
class TestBookingService:
    def test_create_appointment_success(self):
        patient = PatientFactory()
        doctor = DoctorFactory()
        payload = {
            "scheduled_date": timezone.localdate() + timedelta(days=1),
            "scheduled_time": "10:00:00",
            "appointment_type": "consultation",
        }

        appointment = BookingService.create_appointment(patient=patient, doctor=doctor, data=payload)

        assert appointment.patient == patient
        assert appointment.doctor == doctor
        assert appointment.status == "pending"
        assert appointment.price == doctor.consultation_price

    def test_create_appointment_uses_exam_price(self):
        patient = PatientFactory()
        doctor = DoctorFactory()
        exam_type = ExamTypeFactory(convenio=doctor.convenio, price="249.90")
        payload = {
            "scheduled_date": timezone.localdate() + timedelta(days=2),
            "scheduled_time": "11:00:00",
            "appointment_type": "exam",
            "exam_type": exam_type,
        }

        appointment = BookingService.create_appointment(patient=patient, doctor=doctor, data=payload)
        assert str(appointment.price) == "249.90"

    def test_create_appointment_conflict_when_locked(self):
        patient = PatientFactory()
        doctor = DoctorFactory()
        date = timezone.localdate() + timedelta(days=3)
        time = "12:00:00"
        lock_key = BookingService._get_lock_key(doctor.id, date, time)
        cache.add(lock_key, "busy", timeout=600)

        with pytest.raises(ConflictError):
            BookingService.create_appointment(
                patient=patient,
                doctor=doctor,
                data={
                    "scheduled_date": date,
                    "scheduled_time": time,
                    "appointment_type": "consultation",
                },
            )

    def test_create_appointment_conflict_when_existing(self):
        patient = PatientFactory()
        other_patient = PatientFactory()
        doctor = DoctorFactory()
        date = timezone.localdate() + timedelta(days=4)
        time = "13:00:00"
        AppointmentFactory(
            patient=other_patient,
            doctor=doctor,
            convenio=doctor.convenio,
            scheduled_date=date,
            scheduled_time=time,
            status="confirmed",
        )

        with pytest.raises(ConflictError):
            BookingService.create_appointment(
                patient=patient,
                doctor=doctor,
                data={
                    "scheduled_date": date,
                    "scheduled_time": time,
                    "appointment_type": "consultation",
                },
            )

    def test_cancel_appointment_success(self):
        user = PatientFactory()
        appointment = AppointmentFactory(status="pending")

        updated = BookingService.cancel_appointment(appointment, cancelled_by=user, reason="changed plans")

        assert updated.status == "cancelled"
        assert updated.cancellation_reason == "changed plans"
        assert updated.cancelled_by == user

    def test_cancel_appointment_invalid_state(self):
        appointment = AppointmentFactory(status="completed")

        with pytest.raises(BusinessLogicError):
            BookingService.cancel_appointment(appointment, cancelled_by=appointment.patient)

    def test_confirm_appointment_success(self):
        appointment = AppointmentFactory(status="pending")

        updated = BookingService.confirm_appointment(appointment)

        assert updated.status == "confirmed"

    def test_confirm_appointment_invalid_state(self):
        appointment = AppointmentFactory(status="completed")

        with pytest.raises(BusinessLogicError):
            BookingService.confirm_appointment(appointment)
