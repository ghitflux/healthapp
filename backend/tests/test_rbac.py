"""RBAC integration tests across all views."""
import sys
import types

import pytest
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.appointments.tests.factories import AppointmentFactory
from apps.convenios.tests.factories import ConvenioFactory
from apps.doctors.tests.factories import DoctorFactory
from apps.notifications.tests.factories import NotificationFactory
from apps.payments.tests.factories import CompletedPaymentFactory
from apps.users.tests.factories import (
    ConvenioAdminFactory,
    DoctorUserFactory,
    OwnerFactory,
    PatientFactory,
)


def make_client(user=None):
    client = APIClient()
    if user:
        refresh = RefreshToken.for_user(user)
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
    return client


# ---------------------------------------------------------------------------
# Doctor RBAC
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestDoctorRBAC:
    def test_anon_can_list_doctors(self, db):
        client = make_client()
        resp = client.get("/api/v1/doctors/")
        assert resp.status_code == status.HTTP_200_OK

    def test_patient_can_list_doctors(self, db):
        patient = PatientFactory()
        resp = make_client(patient).get("/api/v1/doctors/")
        assert resp.status_code == status.HTTP_200_OK

    def test_patient_cannot_create_doctor(self, db):
        patient = PatientFactory()
        resp = make_client(patient).post("/api/v1/doctors/", {}, format="json")
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_convenio_admin_can_create_doctor(self, db):
        convenio = ConvenioFactory()
        admin = ConvenioAdminFactory(convenio=convenio)
        doctor_user = DoctorUserFactory(convenio=convenio)
        payload = {
            "user": str(doctor_user.id),
            "convenio": str(convenio.id),
            "crm": "123456",
            "crm_state": "SP",
            "specialty": "Cardiologia",
            "consultation_duration": 30,
            "consultation_price": "150.00",
        }
        resp = make_client(admin).post("/api/v1/doctors/", payload, format="json")
        # 201 created or 400 due to validation — but not 403
        assert resp.status_code != status.HTTP_403_FORBIDDEN

    def test_owner_can_create_doctor_any_convenio(self, db):
        convenio = ConvenioFactory()
        owner = OwnerFactory()
        doctor_user = DoctorUserFactory(convenio=convenio)
        payload = {
            "user": str(doctor_user.id),
            "convenio": str(convenio.id),
            "crm": "123457",
            "crm_state": "SP",
            "specialty": "Cardiologia",
            "consultation_duration": 30,
            "consultation_price": "150.00",
        }
        resp = make_client(owner).post("/api/v1/doctors/", payload, format="json")
        assert resp.status_code != status.HTTP_403_FORBIDDEN

    def test_anon_can_get_slots(self, db):
        convenio = ConvenioFactory()
        doctor_user = DoctorUserFactory(convenio=convenio)
        doctor = DoctorFactory(user=doctor_user, convenio=convenio)
        client = make_client()
        resp = client.get(f"/api/v1/doctors/{doctor.id}/slots/?date=2026-06-01")
        assert resp.status_code == status.HTTP_200_OK


# ---------------------------------------------------------------------------
# Appointment RBAC
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestAppointmentRBAC:
    def test_patient_can_create_appointment(self, db):
        convenio = ConvenioFactory()
        patient = PatientFactory()
        doctor_user = DoctorUserFactory(convenio=convenio)
        doctor = DoctorFactory(user=doctor_user, convenio=convenio)
        payload = {
            "doctor": str(doctor.id),
            "appointment_type": "consultation",
            "scheduled_date": "2026-12-01",
            "scheduled_time": "10:00:00",
        }
        resp = make_client(patient).post("/api/v1/appointments/", payload, format="json")
        # Not 403
        assert resp.status_code != status.HTTP_403_FORBIDDEN

    def test_doctor_cannot_create_appointment(self, db):
        convenio = ConvenioFactory()
        doctor_user = DoctorUserFactory(convenio=convenio)
        doctor = DoctorFactory(user=doctor_user, convenio=convenio)
        payload = {
            "doctor": str(doctor.id),
            "appointment_type": "consultation",
            "scheduled_date": "2026-12-01",
            "scheduled_time": "10:00:00",
        }
        resp = make_client(doctor_user).post("/api/v1/appointments/", payload, format="json")
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_patient_sees_only_own_appointments(self, db):
        patient1 = PatientFactory()
        patient2 = PatientFactory()
        convenio = ConvenioFactory()
        doctor_user = DoctorUserFactory(convenio=convenio)
        doctor = DoctorFactory(user=doctor_user, convenio=convenio)
        AppointmentFactory(patient=patient1, doctor=doctor, convenio=convenio)
        AppointmentFactory(patient=patient2, doctor=doctor, convenio=convenio)
        resp = make_client(patient1).get("/api/v1/appointments/")
        assert resp.status_code == status.HTTP_200_OK
        # patient1 should see only their own
        ids_returned = [item["id"] for item in resp.data["data"]]
        appointments_p2 = list(
            patient2.appointments.values_list("id", flat=True)
        )
        for apt_id in appointments_p2:
            assert str(apt_id) not in ids_returned

    def test_convenio_admin_sees_convenio_appointments(self, db):
        convenio1 = ConvenioFactory()
        convenio2 = ConvenioFactory()
        admin = ConvenioAdminFactory(convenio=convenio1)
        patient = PatientFactory()
        doctor1_user = DoctorUserFactory(convenio=convenio1)
        doctor1 = DoctorFactory(user=doctor1_user, convenio=convenio1)
        doctor2_user = DoctorUserFactory(convenio=convenio2)
        doctor2 = DoctorFactory(user=doctor2_user, convenio=convenio2)
        apt1 = AppointmentFactory(patient=patient, doctor=doctor1, convenio=convenio1)
        AppointmentFactory(patient=patient, doctor=doctor2, convenio=convenio2)
        resp = make_client(admin).get("/api/v1/appointments/")
        assert resp.status_code == status.HTTP_200_OK
        ids = [item["id"] for item in resp.data["data"]]
        assert str(apt1.id) in ids

    def test_owner_sees_all_appointments(self, db):
        owner = OwnerFactory()
        convenio = ConvenioFactory()
        patient = PatientFactory()
        doctor_user = DoctorUserFactory(convenio=convenio)
        doctor = DoctorFactory(user=doctor_user, convenio=convenio)
        AppointmentFactory(patient=patient, doctor=doctor, convenio=convenio)
        AppointmentFactory(patient=patient, doctor=doctor, convenio=convenio)
        resp = make_client(owner).get("/api/v1/appointments/")
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data["meta"]["total"] >= 2

    def test_convenio_can_confirm(self, db):
        convenio = ConvenioFactory()
        admin = ConvenioAdminFactory(convenio=convenio)
        patient = PatientFactory()
        doctor_user = DoctorUserFactory(convenio=convenio)
        doctor = DoctorFactory(user=doctor_user, convenio=convenio)
        apt = AppointmentFactory(patient=patient, doctor=doctor, convenio=convenio, status="pending")
        resp = make_client(admin).post(f"/api/v1/appointments/{apt.id}/confirm/")
        assert resp.status_code != status.HTTP_403_FORBIDDEN

    def test_patient_cannot_confirm(self, db):
        convenio = ConvenioFactory()
        patient = PatientFactory()
        doctor_user = DoctorUserFactory(convenio=convenio)
        doctor = DoctorFactory(user=doctor_user, convenio=convenio)
        apt = AppointmentFactory(patient=patient, doctor=doctor, convenio=convenio, status="pending")
        resp = make_client(patient).post(f"/api/v1/appointments/{apt.id}/confirm/")
        assert resp.status_code == status.HTTP_403_FORBIDDEN


# ---------------------------------------------------------------------------
# Payment RBAC
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestPaymentRBAC:
    def test_patient_can_create_intent(self, db, monkeypatch):
        convenio = ConvenioFactory()
        patient = PatientFactory()
        doctor_user = DoctorUserFactory(convenio=convenio)
        doctor = DoctorFactory(user=doctor_user, convenio=convenio)
        apt = AppointmentFactory(patient=patient, doctor=doctor, convenio=convenio, status="pending")

        monkeypatch.setattr(
            "apps.payments.views.StripeService.create_payment_intent",
            lambda payment: {"client_secret": "cs_test", "payment_intent_id": "pi_test"},
        )

        resp = make_client(patient).post(
            "/api/v1/payments/create-intent/",
            {"appointment_id": str(apt.id), "payment_method": "credit_card", "currency": "BRL"},
            format="json",
        )
        assert resp.status_code == status.HTTP_201_CREATED

    def test_doctor_cannot_create_intent(self, db):
        doctor_user = DoctorUserFactory()
        resp = make_client(doctor_user).post(
            "/api/v1/payments/create-intent/",
            {"appointment_id": "00000000-0000-0000-0000-000000000000", "payment_method": "credit_card"},
            format="json",
        )
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_convenio_can_refund(self, db, monkeypatch):
        convenio = ConvenioFactory()
        admin = ConvenioAdminFactory(convenio=convenio)
        patient = PatientFactory()
        doctor_user = DoctorUserFactory(convenio=convenio)
        doctor = DoctorFactory(user=doctor_user, convenio=convenio)
        payment = CompletedPaymentFactory(user=patient)
        AppointmentFactory(
            patient=patient,
            doctor=doctor,
            convenio=convenio,
            status="completed",
            payment=payment,
        )

        def _refund(payment_obj):
            payment_obj.status = "refunded"
            payment_obj.save(update_fields=["status", "updated_at"])
            return payment_obj

        monkeypatch.setattr("apps.payments.views.StripeService.refund_payment", _refund)

        resp = make_client(admin).post(f"/api/v1/payments/{payment.id}/refund/", {"reason": "requested"}, format="json")
        assert resp.status_code == status.HTTP_200_OK

    def test_patient_cannot_refund(self, db):
        patient = PatientFactory()
        payment = CompletedPaymentFactory(user=patient)
        resp = make_client(patient).post(f"/api/v1/payments/{payment.id}/refund/", {"reason": "requested"}, format="json")
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_webhook_no_auth_required(self, db, monkeypatch, settings):
        class _DummyWebhook:
            @staticmethod
            def construct_event(payload, sig_header, secret):
                return {"type": "payment_intent.succeeded", "data": {"object": {"metadata": {}}}}

        class _DummyError:
            class SignatureVerificationError(Exception):
                pass

        dummy_stripe = types.SimpleNamespace(Webhook=_DummyWebhook, error=_DummyError)
        monkeypatch.setitem(sys.modules, "stripe", dummy_stripe)
        monkeypatch.setattr("apps.payments.views.StripeService.process_webhook_event", lambda event: None)
        settings.STRIPE_WEBHOOK_SECRET = "whsec_test"

        resp = make_client().post(
            "/api/v1/webhooks/stripe/",
            data=b"{}",
            content_type="application/json",
            HTTP_STRIPE_SIGNATURE="sig_test",
        )
        assert resp.status_code == status.HTTP_200_OK


# ---------------------------------------------------------------------------
# Convenio RBAC
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestConvenioRBAC:
    def test_owner_can_list_convenios(self, db):
        owner = OwnerFactory()
        ConvenioFactory()
        ConvenioFactory()
        resp = make_client(owner).get("/api/v1/convenios/")
        assert resp.status_code == status.HTTP_200_OK

    def test_patient_cannot_access_convenio_panel(self, db):
        patient = PatientFactory()
        resp = make_client(patient).get("/api/v1/convenios/")
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_convenio_admin_can_see_own(self, db):
        convenio = ConvenioFactory()
        admin = ConvenioAdminFactory(convenio=convenio)
        resp = make_client(admin).get("/api/v1/convenios/")
        assert resp.status_code == status.HTTP_200_OK


# ---------------------------------------------------------------------------
# Notification RBAC
# ---------------------------------------------------------------------------
@pytest.mark.django_db
class TestNotificationRBAC:
    def test_user_sees_only_own_notifications(self, db):
        user1 = PatientFactory()
        user2 = PatientFactory()
        NotificationFactory(user=user1)
        NotificationFactory(user=user2)
        resp = make_client(user1).get("/api/v1/notifications/")
        assert resp.status_code == status.HTTP_200_OK
        for item in resp.data["data"]:
            assert str(item["user"]) == str(user1.id) or "user" not in item

    def test_unauthenticated_cannot_access_notifications(self, db):
        client = make_client()
        resp = client.get("/api/v1/notifications/")
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_user_cannot_mark_others_as_read(self, db):
        user1 = PatientFactory()
        user2 = PatientFactory()
        notification = NotificationFactory(user=user2)
        resp = make_client(user1).patch(f"/api/v1/notifications/{notification.id}/read/")
        assert resp.status_code == status.HTTP_404_NOT_FOUND
