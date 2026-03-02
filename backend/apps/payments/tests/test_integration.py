import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.appointments.tests.factories import AppointmentFactory
from apps.convenios.tests.factories import ConvenioFactory
from apps.doctors.tests.factories import DoctorFactory
from apps.payments.models import Payment
from apps.payments.services import StripeService
from apps.payments.tests.factories import CompletedPaymentFactory
from apps.users.tests.factories import ConvenioAdminFactory, PatientFactory


def _auth_client(user):
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
    return client


@pytest.mark.django_db
class TestPaymentFlowIntegration:
    def test_create_payment_intent_for_appointment(self, monkeypatch):
        patient = PatientFactory()
        doctor = DoctorFactory()
        appointment = AppointmentFactory(patient=patient, doctor=doctor, convenio=doctor.convenio, status="pending")

        monkeypatch.setattr(
            "apps.payments.views.StripeService.create_payment_intent",
            lambda payment: {"client_secret": "cs_seed", "payment_intent_id": "pi_seed"},
        )

        response = _auth_client(patient).post(
            "/api/v1/payments/create-intent/",
            {"appointment_id": str(appointment.id), "payment_method": "credit_card", "currency": "BRL"},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["data"]["payment_intent_id"] == "pi_seed"

    def test_create_pix_payment(self, monkeypatch):
        patient = PatientFactory()
        doctor = DoctorFactory()
        appointment = AppointmentFactory(patient=patient, doctor=doctor, convenio=doctor.convenio, status="pending")

        monkeypatch.setattr(
            "apps.payments.views.StripeService.create_pix_payment",
            lambda payment: {"client_secret": "cs_pix", "payment_intent_id": "pi_pix"},
        )

        response = _auth_client(patient).post(
            "/api/v1/payments/pix/generate/",
            {"appointment_id": str(appointment.id)},
            format="json",
        )

        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["data"]["payment_intent_id"] == "pi_pix"

    def test_payment_webhook_confirms_appointment(self):
        patient = PatientFactory()
        payment = Payment.objects.create(
            user=patient,
            amount="150.00",
            payment_method="pix",
            status="processing",
            stripe_payment_intent_id="pi_abc",
        )
        appointment = AppointmentFactory(patient=patient, status="pending", payment=payment)

        StripeService.process_webhook_event(
            {
                "type": "payment_intent.succeeded",
                "data": {"object": {"metadata": {"payment_id": str(payment.id)}}},
            }
        )

        payment.refresh_from_db()
        appointment.refresh_from_db()
        assert payment.status == "completed"
        assert payment.paid_at is not None
        assert appointment.status == "confirmed"

    def test_refund_payment(self, monkeypatch):
        convenio = ConvenioFactory()
        admin = ConvenioAdminFactory(convenio=convenio)
        patient = PatientFactory()
        doctor = DoctorFactory(convenio=convenio)
        payment = CompletedPaymentFactory(user=patient, stripe_payment_intent_id="pi_refund_int")
        AppointmentFactory(patient=patient, doctor=doctor, convenio=convenio, payment=payment, status="completed")

        def _fake_refund(payment_obj):
            payment_obj.status = "refunded"
            payment_obj.refunded_at = timezone.now()
            payment_obj.refund_amount = payment_obj.amount
            payment_obj.save(update_fields=["status", "refunded_at", "refund_amount", "updated_at"])
            return payment_obj

        monkeypatch.setattr("apps.payments.views.StripeService.refund_payment", _fake_refund)

        response = _auth_client(admin).post(
            f"/api/v1/payments/{payment.id}/refund/",
            {"reason": "cancelamento"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["data"]["status"] == "refunded"

    def test_patient_cannot_refund(self):
        patient = PatientFactory()
        payment = CompletedPaymentFactory(user=patient)

        response = _auth_client(patient).post(f"/api/v1/payments/{payment.id}/refund/", {"reason": "x"}, format="json")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_payment_history(self):
        patient = PatientFactory()
        other = PatientFactory()
        Payment.objects.create(user=patient, amount="100.00", payment_method="pix", status="completed")
        Payment.objects.create(user=patient, amount="200.00", payment_method="credit_card", status="completed")
        Payment.objects.create(user=other, amount="300.00", payment_method="pix", status="completed")

        response = _auth_client(patient).get("/api/v1/payments/history/")

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["data"]) == 2
