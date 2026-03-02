from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.appointments.models import Rating
from apps.appointments.tests.factories import AppointmentFactory
from apps.convenios.tests.factories import ConvenioFactory
from apps.doctors.tests.factories import DoctorFactory, DoctorScheduleFactory
from apps.notifications.models import Notification
from apps.users.tests.factories import ConvenioAdminFactory, DoctorUserFactory, OwnerFactory, PatientFactory


def _auth_client(user):
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
    return client


def _create_future_schedule(doctor, days_ahead=3, slot_time="10:00:00"):
    target_date = timezone.localdate() + timedelta(days=days_ahead)
    hour = int(slot_time.split(":")[0])
    DoctorScheduleFactory(
        doctor=doctor,
        weekday=target_date.weekday(),
        start_time=f"{hour:02d}:00:00",
        end_time=f"{hour + 1:02d}:00:00",
        slot_duration=30,
    )
    return target_date


@pytest.mark.django_db
class TestAppointmentCreate:
    def test_patient_can_create_appointment(self):
        patient = PatientFactory()
        doctor = DoctorFactory()
        target_date = _create_future_schedule(doctor, days_ahead=3, slot_time="10:00:00")

        response = _auth_client(patient).post(
            "/api/v1/appointments/",
            {
                "doctor": str(doctor.id),
                "appointment_type": "consultation",
                "scheduled_date": target_date.isoformat(),
                "scheduled_time": "10:00:00",
            },
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["data"]["status"] == "pending"

    def test_create_appointment_locks_slot(self):
        first_patient = PatientFactory()
        second_patient = PatientFactory()
        doctor = DoctorFactory()
        target_date = _create_future_schedule(doctor, days_ahead=4, slot_time="11:00:00")

        response1 = _auth_client(first_patient).post(
            "/api/v1/appointments/",
            {
                "doctor": str(doctor.id),
                "appointment_type": "consultation",
                "scheduled_date": target_date.isoformat(),
                "scheduled_time": "11:00:00",
            },
            format="json",
        )
        response2 = _auth_client(second_patient).post(
            "/api/v1/appointments/",
            {
                "doctor": str(doctor.id),
                "appointment_type": "consultation",
                "scheduled_date": target_date.isoformat(),
                "scheduled_time": "11:00:00",
            },
            format="json",
        )

        assert response1.status_code == status.HTTP_201_CREATED
        assert response2.status_code == status.HTTP_409_CONFLICT

    def test_create_appointment_past_date(self):
        patient = PatientFactory()
        doctor = DoctorFactory()

        response = _auth_client(patient).post(
            "/api/v1/appointments/",
            {
                "doctor": str(doctor.id),
                "appointment_type": "consultation",
                "scheduled_date": (timezone.localdate() - timedelta(days=1)).isoformat(),
                "scheduled_time": "10:00:00",
            },
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_appointment_no_schedule(self):
        patient = PatientFactory()
        doctor = DoctorFactory()

        response = _auth_client(patient).post(
            "/api/v1/appointments/",
            {
                "doctor": str(doctor.id),
                "appointment_type": "consultation",
                "scheduled_date": (timezone.localdate() + timedelta(days=4)).isoformat(),
                "scheduled_time": "10:00:00",
            },
            format="json",
        )

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_doctor_cannot_create_appointment(self):
        convenio = ConvenioFactory()
        doctor_user = DoctorUserFactory(convenio=convenio)
        doctor = DoctorFactory(user=doctor_user, convenio=convenio)
        target_date = _create_future_schedule(doctor, days_ahead=3, slot_time="10:00:00")

        response = _auth_client(doctor_user).post(
            "/api/v1/appointments/",
            {
                "doctor": str(doctor.id),
                "appointment_type": "consultation",
                "scheduled_date": target_date.isoformat(),
                "scheduled_time": "10:00:00",
            },
            format="json",
        )

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_create_appointment_triggers_notification(self):
        patient = PatientFactory()
        doctor = DoctorFactory()
        target_date = _create_future_schedule(doctor, days_ahead=3, slot_time="10:00:00")

        response = _auth_client(patient).post(
            "/api/v1/appointments/",
            {
                "doctor": str(doctor.id),
                "appointment_type": "consultation",
                "scheduled_date": target_date.isoformat(),
                "scheduled_time": "10:00:00",
            },
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert Notification.objects.filter(user=patient, type="appointment").exists()
        assert Notification.objects.filter(user=doctor.user, type="appointment").exists()


@pytest.mark.django_db
class TestAppointmentCancel:
    def test_patient_can_cancel_own(self):
        patient = PatientFactory()
        appointment = AppointmentFactory(patient=patient, status="pending")

        response = _auth_client(patient).post(f"/api/v1/appointments/{appointment.id}/cancel/")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["data"]["status"] == "cancelled"

    def test_patient_cannot_cancel_completed(self):
        patient = PatientFactory()
        appointment = AppointmentFactory(patient=patient, status="completed")

        response = _auth_client(patient).post(f"/api/v1/appointments/{appointment.id}/cancel/")

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_convenio_admin_can_cancel_convenio_appointment(self):
        convenio = ConvenioFactory()
        admin = ConvenioAdminFactory(convenio=convenio)
        doctor = DoctorFactory(convenio=convenio)
        appointment = AppointmentFactory(doctor=doctor, convenio=convenio, status="confirmed")

        response = _auth_client(admin).post(f"/api/v1/appointments/{appointment.id}/cancel/")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["data"]["status"] == "cancelled"

    def test_cancel_releases_lock(self):
        patient = PatientFactory()
        second_patient = PatientFactory()
        doctor = DoctorFactory()
        target_date = _create_future_schedule(doctor, days_ahead=4, slot_time="14:00:00")

        create_response = _auth_client(patient).post(
            "/api/v1/appointments/",
            {
                "doctor": str(doctor.id),
                "appointment_type": "consultation",
                "scheduled_date": target_date.isoformat(),
                "scheduled_time": "14:00:00",
            },
            format="json",
        )
        appointment_id = create_response.data["data"]["id"]
        cancel_response = _auth_client(patient).post(f"/api/v1/appointments/{appointment_id}/cancel/")
        second_create_response = _auth_client(second_patient).post(
            "/api/v1/appointments/",
            {
                "doctor": str(doctor.id),
                "appointment_type": "consultation",
                "scheduled_date": target_date.isoformat(),
                "scheduled_time": "14:00:00",
            },
            format="json",
        )

        assert cancel_response.status_code == status.HTTP_200_OK
        assert second_create_response.status_code == status.HTTP_201_CREATED

    def test_cancel_triggers_notification(self):
        patient = PatientFactory()
        doctor = DoctorFactory()
        appointment = AppointmentFactory(patient=patient, doctor=doctor, convenio=doctor.convenio, status="pending")

        response = _auth_client(patient).post(f"/api/v1/appointments/{appointment.id}/cancel/")

        assert response.status_code == status.HTTP_200_OK
        assert Notification.objects.filter(user=doctor.user, type="appointment").exists()


@pytest.mark.django_db
class TestAppointmentConfirm:
    def test_convenio_admin_can_confirm(self):
        convenio = ConvenioFactory()
        admin = ConvenioAdminFactory(convenio=convenio)
        doctor = DoctorFactory(convenio=convenio)
        appointment = AppointmentFactory(doctor=doctor, convenio=convenio, status="pending")

        response = _auth_client(admin).post(f"/api/v1/appointments/{appointment.id}/confirm/")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["data"]["status"] == "confirmed"

    def test_patient_cannot_confirm(self):
        patient = PatientFactory()
        appointment = AppointmentFactory(status="pending")
        response = _auth_client(patient).post(f"/api/v1/appointments/{appointment.id}/confirm/")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_confirm_only_pending(self):
        owner = OwnerFactory()
        appointment = AppointmentFactory(status="completed")
        response = _auth_client(owner).post(f"/api/v1/appointments/{appointment.id}/confirm/")
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_confirm_triggers_notification(self):
        convenio = ConvenioFactory()
        admin = ConvenioAdminFactory(convenio=convenio)
        doctor = DoctorFactory(convenio=convenio)
        appointment = AppointmentFactory(doctor=doctor, convenio=convenio, status="pending")

        response = _auth_client(admin).post(f"/api/v1/appointments/{appointment.id}/confirm/")

        assert response.status_code == status.HTTP_200_OK
        assert Notification.objects.filter(user=appointment.patient, type="appointment").exists()


@pytest.mark.django_db
class TestAppointmentRate:
    def test_patient_can_rate_completed(self):
        patient = PatientFactory()
        appointment = AppointmentFactory(patient=patient, status="completed")

        response = _auth_client(patient).post(
            f"/api/v1/appointments/{appointment.id}/rate/",
            {"score": 5, "comment": "Excelente"},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert Rating.objects.filter(appointment=appointment).exists()

    def test_patient_cannot_rate_pending(self):
        patient = PatientFactory()
        appointment = AppointmentFactory(patient=patient, status="pending")

        response = _auth_client(patient).post(
            f"/api/v1/appointments/{appointment.id}/rate/",
            {"score": 5},
            format="json",
        )

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_patient_cannot_rate_twice(self):
        patient = PatientFactory()
        appointment = AppointmentFactory(patient=patient, status="completed")
        _auth_client(patient).post(f"/api/v1/appointments/{appointment.id}/rate/", {"score": 4}, format="json")

        response = _auth_client(patient).post(
            f"/api/v1/appointments/{appointment.id}/rate/",
            {"score": 5},
            format="json",
        )

        assert response.status_code == status.HTTP_409_CONFLICT

    def test_rating_updates_doctor_average(self):
        patient = PatientFactory()
        doctor = DoctorFactory()
        appointments = [
            AppointmentFactory(patient=patient, doctor=doctor, convenio=doctor.convenio, status="completed")
            for _ in range(3)
        ]
        scores = [3, 4, 5]
        for appointment, score in zip(appointments, scores, strict=True):
            _auth_client(patient).post(
                f"/api/v1/appointments/{appointment.id}/rate/",
                {"score": score},
                format="json",
            )

        doctor.refresh_from_db()
        assert float(doctor.rating) == 4.0
        assert doctor.total_ratings == 3


@pytest.mark.django_db
class TestAppointmentList:
    def test_patient_sees_only_own(self):
        patient = PatientFactory()
        other = PatientFactory()
        AppointmentFactory(patient=patient)
        AppointmentFactory(patient=patient)
        other_appointment = AppointmentFactory(patient=other)

        response = _auth_client(patient).get("/api/v1/appointments/")

        assert response.status_code == status.HTTP_200_OK
        ids = [item["id"] for item in response.data["data"]]
        assert str(other_appointment.id) not in ids
        assert len(ids) == 2

    def test_doctor_sees_only_own(self):
        convenio = ConvenioFactory()
        doctor_user = DoctorUserFactory(convenio=convenio)
        doctor = DoctorFactory(user=doctor_user, convenio=convenio)
        other_doctor = DoctorFactory()
        own_appointment = AppointmentFactory(doctor=doctor, convenio=doctor.convenio)
        AppointmentFactory(doctor=other_doctor, convenio=other_doctor.convenio)

        response = _auth_client(doctor_user).get("/api/v1/appointments/")

        assert response.status_code == status.HTTP_200_OK
        ids = [item["id"] for item in response.data["data"]]
        assert ids == [str(own_appointment.id)]

    def test_convenio_admin_sees_convenio_appointments(self):
        convenio = ConvenioFactory()
        other_convenio = ConvenioFactory()
        admin = ConvenioAdminFactory(convenio=convenio)
        doctor1 = DoctorFactory(convenio=convenio)
        doctor2 = DoctorFactory(convenio=other_convenio)
        own = AppointmentFactory(doctor=doctor1, convenio=convenio)
        other = AppointmentFactory(doctor=doctor2, convenio=other_convenio)

        response = _auth_client(admin).get("/api/v1/appointments/")

        assert response.status_code == status.HTTP_200_OK
        ids = [item["id"] for item in response.data["data"]]
        assert str(own.id) in ids
        assert str(other.id) not in ids

    def test_owner_sees_all(self):
        owner = OwnerFactory()
        AppointmentFactory.create_batch(3)

        response = _auth_client(owner).get("/api/v1/appointments/")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["meta"]["total"] >= 3
