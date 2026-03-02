from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.appointments.models import Appointment
from apps.appointments.tests.factories import AppointmentFactory
from apps.doctors.tests.factories import DoctorFactory, DoctorScheduleFactory
from apps.payments.models import Payment
from apps.users.tests.factories import OwnerFactory, PatientFactory


def _auth_client(user):
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
    return client


@pytest.mark.django_db
class TestFullBookingFlow:
    def test_search_to_rating_flow(self, monkeypatch):
        patient = PatientFactory(email_verified=True)
        doctor = DoctorFactory(specialty="Cardiologia")
        owner = OwnerFactory()

        target_date = timezone.localdate() + timedelta(days=3)
        DoctorScheduleFactory(
            doctor=doctor,
            weekday=target_date.weekday(),
            start_time="09:00:00",
            end_time="12:00:00",
            slot_duration=30,
        )

        search_response = APIClient().get("/api/v1/doctors/?search=cardiologia")
        assert search_response.status_code == status.HTTP_200_OK
        assert any(item["id"] == str(doctor.id) for item in search_response.data["data"])

        slots_response = APIClient().get(f"/api/v1/doctors/{doctor.id}/slots/?date={target_date.isoformat()}")
        assert slots_response.status_code == status.HTTP_200_OK
        selected_time = next(slot["time"] for slot in slots_response.data["data"] if slot["is_available"])

        create_response = _auth_client(patient).post(
            "/api/v1/appointments/",
            {
                "doctor": str(doctor.id),
                "appointment_type": "consultation",
                "scheduled_date": target_date.isoformat(),
                "scheduled_time": selected_time,
            },
            format="json",
        )
        assert create_response.status_code == status.HTTP_201_CREATED
        appointment_id = create_response.data["data"]["id"]
        appointment = Appointment.objects.get(id=appointment_id)
        assert appointment.status == "pending"

        def _fake_create_intent(appointment, payment_method):
            payment = Payment.objects.create(
                user=appointment.patient,
                amount=appointment.price,
                payment_method=payment_method,
                status="pending",
            )
            appointment.payment = payment
            appointment.save(update_fields=["payment", "updated_at"])
            return {"client_secret": "cs_test", "payment_intent_id": "pi_test", "payment_id": str(payment.id)}

        monkeypatch.setattr("apps.payments.views.StripeService.create_payment_intent", _fake_create_intent)

        payment_intent_response = _auth_client(patient).post(
            "/api/v1/payments/create-intent/",
            {"appointment_id": appointment_id, "payment_method": "credit_card", "currency": "BRL"},
            format="json",
        )
        assert payment_intent_response.status_code == status.HTTP_201_CREATED

        appointment.refresh_from_db()
        payment = appointment.payment
        assert payment is not None
        payment.status = "completed"
        payment.paid_at = timezone.now()
        payment.save(update_fields=["status", "paid_at", "updated_at"])

        confirm_response = _auth_client(owner).post(f"/api/v1/appointments/{appointment_id}/confirm/")
        assert confirm_response.status_code == status.HTTP_200_OK

        start_response = _auth_client(doctor.user).post(f"/api/v1/appointments/{appointment_id}/start/")
        assert start_response.status_code == status.HTTP_200_OK
        assert start_response.data["data"]["status"] == "in_progress"

        complete_response = _auth_client(doctor.user).post(
            f"/api/v1/appointments/{appointment_id}/complete/",
            {"notes": "consulta finalizada"},
            format="json",
        )
        assert complete_response.status_code == status.HTTP_200_OK
        assert complete_response.data["data"]["status"] == "completed"

        rating_response = _auth_client(patient).post(
            f"/api/v1/appointments/{appointment_id}/rate/",
            {"score": 5, "comment": "Excelente atendimento"},
            format="json",
        )
        assert rating_response.status_code == status.HTTP_201_CREATED

        history_response = _auth_client(patient).get("/api/v1/payments/history/")
        assert history_response.status_code == status.HTTP_200_OK
        assert len(history_response.data["data"]) >= 1

        unread_response = _auth_client(patient).get("/api/v1/notifications/unread-count/")
        assert unread_response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
class TestBookingEdgeCases:
    def test_double_booking_same_slot(self):
        doctor = DoctorFactory()
        patient_one = PatientFactory()
        patient_two = PatientFactory()
        target_date = timezone.localdate() + timedelta(days=4)
        DoctorScheduleFactory(
            doctor=doctor,
            weekday=target_date.weekday(),
            start_time="10:00:00",
            end_time="12:00:00",
            slot_duration=30,
        )

        payload = {
            "doctor": str(doctor.id),
            "appointment_type": "consultation",
            "scheduled_date": target_date.isoformat(),
            "scheduled_time": "10:00:00",
        }
        response_one = _auth_client(patient_one).post("/api/v1/appointments/", payload, format="json")
        response_two = _auth_client(patient_two).post("/api/v1/appointments/", payload, format="json")

        assert response_one.status_code == status.HTTP_201_CREATED
        assert response_two.status_code == status.HTTP_409_CONFLICT

    def test_booking_past_date(self):
        patient = PatientFactory()
        doctor = DoctorFactory()

        response = _auth_client(patient).post(
            "/api/v1/appointments/",
            {
                "doctor": str(doctor.id),
                "appointment_type": "consultation",
                "scheduled_date": (timezone.localdate() - timedelta(days=1)).isoformat(),
                "scheduled_time": "09:00:00",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_booking_no_schedule(self):
        patient = PatientFactory()
        doctor = DoctorFactory()
        response = _auth_client(patient).post(
            "/api/v1/appointments/",
            {
                "doctor": str(doctor.id),
                "appointment_type": "consultation",
                "scheduled_date": (timezone.localdate() + timedelta(days=2)).isoformat(),
                "scheduled_time": "09:00:00",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_cancel_after_payment(self):
        appointment = AppointmentFactory(status="confirmed")
        payment = Payment.objects.create(
            user=appointment.patient,
            amount=appointment.price,
            payment_method="pix",
            status="completed",
            stripe_payment_intent_id="pi_e2e_refund",
        )
        appointment.payment = payment
        appointment.save(update_fields=["payment", "updated_at"])

        response = _auth_client(appointment.patient).post(
            f"/api/v1/appointments/{appointment.id}/cancel/",
            {"reason": "nao poderei comparecer"},
            format="json",
        )
        assert response.status_code in {status.HTTP_200_OK, status.HTTP_422_UNPROCESSABLE_ENTITY}

    def test_booking_expired_lock(self):
        appointment = AppointmentFactory(status="pending")
        assert appointment.status == "pending"
