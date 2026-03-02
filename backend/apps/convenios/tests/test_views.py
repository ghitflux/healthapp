from datetime import timedelta

import pytest
from django.utils import timezone
from faker import Faker
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.appointments.tests.factories import AppointmentFactory
from apps.convenios.models import ExamType
from apps.convenios.tests.factories import ConvenioFactory, ExamTypeFactory
from apps.doctors.tests.factories import DoctorFactory
from apps.payments.tests.factories import CompletedPaymentFactory
from apps.users.tests.factories import ConvenioAdminFactory, OwnerFactory, PatientFactory

fake = Faker("pt_BR")


def _auth_client(user):
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
    return client


@pytest.mark.django_db
class TestConvenioList:
    def test_owner_can_list_all_convenios(self):
        owner = OwnerFactory()
        ConvenioFactory.create_batch(3)

        response = _auth_client(owner).get("/api/v1/convenios/")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["meta"]["total"] >= 3

    def test_convenio_admin_sees_only_own(self):
        own = ConvenioFactory()
        ConvenioFactory()
        admin = ConvenioAdminFactory(convenio=own)

        response = _auth_client(admin).get("/api/v1/convenios/")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["meta"]["total"] == 1
        assert response.data["data"][0]["id"] == str(own.id)

    def test_patient_cannot_list_convenios(self):
        patient = PatientFactory()

        response = _auth_client(patient).get("/api/v1/convenios/")

        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_list_convenios_paginated(self):
        owner = OwnerFactory()
        ConvenioFactory.create_batch(5)

        response = _auth_client(owner).get("/api/v1/convenios/?page=1&page_size=2")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["meta"]["per_page"] == 2


@pytest.mark.django_db
class TestConvenioRetrieve:
    def test_owner_can_get_any_convenio(self):
        owner = OwnerFactory()
        convenio = ConvenioFactory()

        response = _auth_client(owner).get(f"/api/v1/convenios/{convenio.id}/")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["id"] == str(convenio.id)

    def test_convenio_admin_can_get_own(self):
        convenio = ConvenioFactory()
        admin = ConvenioAdminFactory(convenio=convenio)

        response = _auth_client(admin).get(f"/api/v1/convenios/{convenio.id}/")

        assert response.status_code == status.HTTP_200_OK

    def test_convenio_admin_cannot_get_other(self):
        own = ConvenioFactory()
        other = ConvenioFactory()
        admin = ConvenioAdminFactory(convenio=own)

        response = _auth_client(admin).get(f"/api/v1/convenios/{other.id}/")

        assert response.status_code in {status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND}


@pytest.mark.django_db
class TestConvenioCreate:
    def test_owner_can_create_convenio(self):
        owner = OwnerFactory()
        valid_cnpj = fake.cnpj()
        payload = {
            "name": "Clinica Nova",
            "cnpj": valid_cnpj,
            "contact_email": "contato@clinicanova.com.br",
            "contact_phone": "+5511999999999",
            "address": {"city": "Sao Paulo", "state": "SP"},
            "settings": {},
            "subscription_plan": "starter",
            "subscription_status": "active",
        }

        response = _auth_client(owner).post("/api/v1/convenios/", payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED

    def test_convenio_admin_cannot_create(self):
        admin = ConvenioAdminFactory(convenio=ConvenioFactory())
        response = _auth_client(admin).post("/api/v1/convenios/", {}, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_create_convenio_invalid_cnpj(self):
        owner = OwnerFactory()
        payload = {
            "name": "Clinica X",
            "cnpj": "invalid",
            "contact_email": "x@x.com",
            "contact_phone": "+5511999999999",
            "address": {},
            "settings": {},
            "subscription_plan": "starter",
            "subscription_status": "active",
        }

        response = _auth_client(owner).post("/api/v1/convenios/", payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_convenio_duplicate_cnpj(self):
        owner = OwnerFactory()
        valid_cnpj = fake.cnpj()
        ConvenioFactory(cnpj=valid_cnpj)
        payload = {
            "name": "Clinica Y",
            "cnpj": valid_cnpj,
            "contact_email": "y@y.com",
            "contact_phone": "+5511999999999",
            "address": {},
            "settings": {},
            "subscription_plan": "starter",
            "subscription_status": "active",
        }

        response = _auth_client(owner).post("/api/v1/convenios/", payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestConvenioDashboard:
    def test_convenio_admin_can_get_dashboard(self):
        convenio = ConvenioFactory()
        admin = ConvenioAdminFactory(convenio=convenio)
        DoctorFactory(convenio=convenio)

        response = _auth_client(admin).get("/api/v1/convenios/dashboard/")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "success"
        assert "total_doctors" in response.data["data"]

    def test_patient_cannot_get_dashboard(self):
        patient = PatientFactory()
        response = _auth_client(patient).get("/api/v1/convenios/dashboard/")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_dashboard_returns_real_data(self):
        convenio = ConvenioFactory()
        admin = ConvenioAdminFactory(convenio=convenio)
        doctor = DoctorFactory(convenio=convenio, is_available=True)
        appointment = AppointmentFactory(
            doctor=doctor,
            convenio=convenio,
            status="completed",
            scheduled_date=timezone.localdate(),
        )
        payment = CompletedPaymentFactory(user=appointment.patient, amount=appointment.price, paid_at=timezone.now())
        appointment.payment = payment
        appointment.save(update_fields=["payment", "updated_at"])

        response = _auth_client(admin).get("/api/v1/convenios/dashboard/")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["data"]["total_doctors"] >= 1
        assert float(response.data["data"]["total_revenue_month"]) > 0


@pytest.mark.django_db
class TestExamTypeViewSet:
    def test_convenio_admin_can_list_exam_types(self):
        convenio = ConvenioFactory()
        admin = ConvenioAdminFactory(convenio=convenio)
        ExamTypeFactory(convenio=convenio)

        response = _auth_client(admin).get("/api/v1/exam-types/")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["meta"]["total"] >= 1

    def test_convenio_admin_can_create_exam_type(self):
        convenio = ConvenioFactory()
        admin = ConvenioAdminFactory(convenio=convenio)
        payload = {
            "convenio": str(convenio.id),
            "name": "Ressonancia",
            "description": "Exame detalhado",
            "preparation": "Sem metais",
            "duration_minutes": 45,
            "price": "200.00",
        }

        response = _auth_client(admin).post("/api/v1/exam-types/", payload, format="json")
        assert response.status_code == status.HTTP_201_CREATED

    def test_create_exam_type_sets_convenio_automatically(self):
        convenio = ConvenioFactory()
        other_convenio = ConvenioFactory()
        admin = ConvenioAdminFactory(convenio=convenio)
        payload = {
            "convenio": str(other_convenio.id),
            "name": "Ultrassom",
            "description": "Exame",
            "preparation": "Preparo",
            "duration_minutes": 30,
            "price": "180.00",
        }

        response = _auth_client(admin).post("/api/v1/exam-types/", payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED
        created = ExamType.objects.get(id=response.data["id"])
        assert created.convenio_id == convenio.id

    def test_convenio_admin_can_update_exam_type(self):
        convenio = ConvenioFactory()
        admin = ConvenioAdminFactory(convenio=convenio)
        exam = ExamTypeFactory(convenio=convenio)

        response = _auth_client(admin).patch(
            f"/api/v1/exam-types/{exam.id}/",
            {"price": "250.00"},
            format="json",
        )

        assert response.status_code == status.HTTP_200_OK

    def test_convenio_admin_can_delete_exam_type(self):
        convenio = ConvenioFactory()
        admin = ConvenioAdminFactory(convenio=convenio)
        exam = ExamTypeFactory(convenio=convenio)

        response = _auth_client(admin).delete(f"/api/v1/exam-types/{exam.id}/")

        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_patient_cannot_manage_exam_types(self):
        patient = PatientFactory()
        response = _auth_client(patient).get("/api/v1/exam-types/")
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestOwnerAdminPanel:
    def test_owner_can_get_dashboard(self):
        owner = OwnerFactory()

        response = _auth_client(owner).get("/api/v1/admin-panel/dashboard/")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "success"

    def test_owner_can_list_convenios(self):
        owner = OwnerFactory()
        ConvenioFactory.create_batch(2)

        response = _auth_client(owner).get("/api/v1/admin-panel/convenios/")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["meta"]["total"] >= 2

    def test_owner_can_suspend_convenio(self):
        owner = OwnerFactory()
        convenio = ConvenioFactory(is_active=True)

        response = _auth_client(owner).post(f"/api/v1/admin-panel/convenios/{convenio.id}/suspend/")

        assert response.status_code == status.HTTP_200_OK
        convenio.refresh_from_db()
        assert convenio.is_active is False

    def test_owner_can_approve_convenio(self):
        owner = OwnerFactory()
        convenio = ConvenioFactory(is_approved=False)

        response = _auth_client(owner).post(f"/api/v1/admin-panel/convenios/{convenio.id}/approve/")

        assert response.status_code == status.HTTP_200_OK
        convenio.refresh_from_db()
        assert convenio.is_approved is True

    def test_owner_can_list_users(self):
        owner = OwnerFactory()
        PatientFactory()

        response = _auth_client(owner).get("/api/v1/admin-panel/users/")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["meta"]["total"] >= 1

    def test_owner_can_list_audit_logs(self):
        owner = OwnerFactory()
        convenio = ConvenioFactory()
        convenio.is_active = False
        convenio.save(update_fields=["is_active", "updated_at"])

        response = _auth_client(owner).get("/api/v1/admin-panel/audit-logs/")

        assert response.status_code == status.HTTP_200_OK

    def test_patient_cannot_access_admin(self):
        patient = PatientFactory()
        response = _auth_client(patient).get("/api/v1/admin-panel/dashboard/")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_convenio_admin_cannot_access_admin(self):
        admin = ConvenioAdminFactory(convenio=ConvenioFactory())
        response = _auth_client(admin).get("/api/v1/admin-panel/dashboard/")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_owner_can_get_global_financial_report(self):
        owner = OwnerFactory()

        response = _auth_client(owner).get("/api/v1/admin-panel/financial/")

        assert response.status_code == status.HTTP_200_OK
        assert "total_revenue_platform" in response.data["data"]


@pytest.mark.django_db
class TestConvenioReports:
    def test_convenio_admin_can_get_financial_report(self):
        convenio = ConvenioFactory()
        admin = ConvenioAdminFactory(convenio=convenio)
        doctor = DoctorFactory(convenio=convenio)
        appointment = AppointmentFactory(
            doctor=doctor,
            convenio=convenio,
            status="completed",
            scheduled_date=timezone.localdate() - timedelta(days=1),
        )
        payment = CompletedPaymentFactory(user=appointment.patient, amount=appointment.price, paid_at=timezone.now())
        appointment.payment = payment
        appointment.save(update_fields=["payment", "updated_at"])

        start_date = (timezone.localdate() - timedelta(days=10)).isoformat()
        end_date = timezone.localdate().isoformat()
        response = _auth_client(admin).get(
            f"/api/v1/convenios/reports/financial/?start_date={start_date}&end_date={end_date}&group_by=day"
        )

        assert response.status_code == status.HTTP_200_OK
        assert "total_revenue" in response.data["data"]

    def test_convenio_admin_can_export_appointments_csv(self):
        convenio = ConvenioFactory()
        admin = ConvenioAdminFactory(convenio=convenio)
        doctor = DoctorFactory(convenio=convenio)
        AppointmentFactory(doctor=doctor, convenio=convenio, scheduled_date=timezone.localdate())

        start_date = (timezone.localdate() - timedelta(days=1)).isoformat()
        end_date = (timezone.localdate() + timedelta(days=1)).isoformat()
        response = _auth_client(admin).get(
            f"/api/v1/convenios/export/appointments/?start_date={start_date}&end_date={end_date}&format=csv"
        )

        assert response.status_code == status.HTTP_200_OK
        assert response["Content-Type"].startswith("text/csv")
