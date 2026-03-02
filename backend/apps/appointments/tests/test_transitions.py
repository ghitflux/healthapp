import pytest
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.appointments.tests.factories import AppointmentFactory
from apps.users.tests.factories import OwnerFactory, PatientFactory


def _auth_client(user):
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
    return client


@pytest.mark.django_db
class TestAppointmentTransitions:
    def test_start_appointment_success(self):
        appointment = AppointmentFactory(status="confirmed")
        doctor_user = appointment.doctor.user

        response = _auth_client(doctor_user).post(f"/api/v1/appointments/{appointment.id}/start/")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["data"]["status"] == "in_progress"

    def test_start_invalid_transition(self):
        appointment = AppointmentFactory(status="pending")
        doctor_user = appointment.doctor.user

        response = _auth_client(doctor_user).post(f"/api/v1/appointments/{appointment.id}/start/")

        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_complete_appointment_success(self):
        appointment = AppointmentFactory(status="in_progress")
        doctor_user = appointment.doctor.user

        response = _auth_client(doctor_user).post(
            f"/api/v1/appointments/{appointment.id}/complete/",
            {"notes": "consulta concluida"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["data"]["status"] == "completed"

    def test_mark_no_show_owner(self):
        owner = OwnerFactory()
        appointment = AppointmentFactory(status="confirmed")

        response = _auth_client(owner).post(f"/api/v1/appointments/{appointment.id}/no-show/", {}, format="json")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["data"]["status"] == "no_show"

    def test_get_cancellation_policy(self):
        patient = PatientFactory()
        appointment = AppointmentFactory(status="confirmed", patient=patient)

        response = _auth_client(patient).get(f"/api/v1/appointments/{appointment.id}/cancellation-policy/")

        assert response.status_code == status.HTTP_200_OK
        assert "can_cancel" in response.data["data"]

    def test_get_reminders_list(self):
        patient = PatientFactory()
        appointment = AppointmentFactory(
            status="confirmed",
            patient=patient,
            reminder_stages_sent={"24h": "2026-03-01T10:00:00+00:00"},
        )

        response = _auth_client(patient).get(f"/api/v1/appointments/{appointment.id}/reminders/")

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["data"]) == 1
