import sys
import types

import pytest
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.appointments.tests.factories import AppointmentFactory
from apps.convenios.tests.factories import ConvenioFactory
from apps.doctors.tests.factories import DoctorFactory
from apps.payments.tests.factories import CompletedPaymentFactory, PaymentFactory
from apps.users.tests.factories import ConvenioAdminFactory, DoctorUserFactory, OwnerFactory, PatientFactory


@pytest.fixture
def api_client():
    return APIClient()


def _auth_client(user):
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
    return client


@pytest.mark.django_db
class TestPaymentViews:
    def test_create_payment_intent_success(self, monkeypatch):
        patient = PatientFactory()
        convenio = ConvenioFactory()
        doctor_user = DoctorUserFactory(convenio=convenio)
        doctor = DoctorFactory(user=doctor_user, convenio=convenio)
        apt = AppointmentFactory(patient=patient, doctor=doctor, convenio=convenio, status="pending")

        monkeypatch.setattr(
            "apps.payments.views.StripeService.create_payment_intent",
            lambda appointment, payment_method: {"client_secret": "cs_ok", "payment_intent_id": "pi_ok"},
        )

        resp = _auth_client(patient).post(
            "/api/v1/payments/create-intent/",
            {"appointment_id": str(apt.id), "payment_method": "credit_card", "currency": "BRL"},
            format="json",
        )

        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["data"]["payment_intent_id"] == "pi_ok"

    def test_create_payment_intent_not_found_for_other_user(self, monkeypatch):
        patient = PatientFactory()
        other_patient = PatientFactory()
        convenio = ConvenioFactory()
        doctor_user = DoctorUserFactory(convenio=convenio)
        doctor = DoctorFactory(user=doctor_user, convenio=convenio)
        apt = AppointmentFactory(patient=patient, doctor=doctor, convenio=convenio, status="pending")

        monkeypatch.setattr(
            "apps.payments.views.StripeService.create_payment_intent",
            lambda appointment, payment_method: {"client_secret": "cs_ok", "payment_intent_id": "pi_ok"},
        )

        resp = _auth_client(other_patient).post(
            "/api/v1/payments/create-intent/",
            {"appointment_id": str(apt.id), "payment_method": "credit_card", "currency": "BRL"},
            format="json",
        )

        assert resp.status_code == status.HTTP_404_NOT_FOUND

    def test_pix_generate_success(self, monkeypatch):
        patient = PatientFactory()
        convenio = ConvenioFactory()
        doctor_user = DoctorUserFactory(convenio=convenio)
        doctor = DoctorFactory(user=doctor_user, convenio=convenio)
        apt = AppointmentFactory(patient=patient, doctor=doctor, convenio=convenio, status="pending")

        monkeypatch.setattr(
            "apps.payments.views.StripeService.create_pix_payment",
            lambda appointment: {"client_secret": "cs_pix", "payment_intent_id": "pi_pix"},
        )

        resp = _auth_client(patient).post(
            "/api/v1/payments/pix/generate/",
            {"appointment_id": str(apt.id)},
            format="json",
        )

        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data["data"]["payment_intent_id"] == "pi_pix"

    def test_payment_status_patient_owner(self):
        patient = PatientFactory()
        payment = PaymentFactory(user=patient)

        resp = _auth_client(patient).get(f"/api/v1/payments/{payment.id}/status/")

        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["data"]["id"] == str(payment.id)

    def test_payment_status_convenio_admin_can_access_convenio_payment(self):
        convenio = ConvenioFactory()
        admin = ConvenioAdminFactory(convenio=convenio)
        patient = PatientFactory()
        doctor_user = DoctorUserFactory(convenio=convenio)
        doctor = DoctorFactory(user=doctor_user, convenio=convenio)
        payment = PaymentFactory(user=patient)
        AppointmentFactory(
            patient=patient,
            doctor=doctor,
            convenio=convenio,
            status="pending",
            payment=payment,
        )

        resp = _auth_client(admin).get(f"/api/v1/payments/{payment.id}/status/")

        assert resp.status_code == status.HTTP_200_OK

    def test_refund_owner_success(self, monkeypatch):
        owner = OwnerFactory()
        patient = PatientFactory()
        payment = CompletedPaymentFactory(user=patient)

        def _fake_refund(payment_obj, amount=None):
            del amount
            payment_obj.status = "refunded"
            payment_obj.save(update_fields=["status", "updated_at"])
            return payment_obj

        monkeypatch.setattr("apps.payments.views.StripeService.refund_payment", _fake_refund)

        resp = _auth_client(owner).post(f"/api/v1/payments/{payment.id}/refund/", {"reason": "manual"}, format="json")

        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["data"]["status"] == "refunded"

    def test_payment_history_returns_current_user_payments(self):
        patient = PatientFactory()
        other = PatientFactory()
        PaymentFactory(user=patient)
        PaymentFactory(user=patient)
        PaymentFactory(user=other)

        resp = _auth_client(patient).get("/api/v1/payments/history/")

        assert resp.status_code == status.HTTP_200_OK
        assert len(resp.data["data"]) == 2

    def test_webhook_invalid_signature_returns_400(self, monkeypatch, settings):
        class _DummyError:
            class SignatureVerificationError(Exception):
                pass

        class _DummyWebhook:
            @staticmethod
            def construct_event(payload, sig_header, secret):
                raise _DummyError.SignatureVerificationError("bad signature")

        dummy_stripe = types.SimpleNamespace(Webhook=_DummyWebhook, error=_DummyError)
        monkeypatch.setitem(sys.modules, "stripe", dummy_stripe)
        settings.STRIPE_WEBHOOK_SECRET = "whsec_test"

        resp = APIClient().post(
            "/api/v1/webhooks/stripe/",
            data=b"{}",
            content_type="application/json",
            HTTP_STRIPE_SIGNATURE="invalid",
        )

        assert resp.status_code == status.HTTP_400_BAD_REQUEST
