"""Pre-validation smoke tests for Week 3 core APIs."""

from datetime import timedelta
from pathlib import Path

import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.convenios.models import ExamType
from apps.convenios.tests.factories import ConvenioFactory
from apps.doctors.tests.factories import DoctorFactory, DoctorScheduleFactory
from apps.users.tests.factories import ConvenioAdminFactory, DoctorUserFactory


def _make_client(user=None):
    client = APIClient()
    if user is not None:
        refresh = RefreshToken.for_user(user)
        client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
    return client


def _extract_items(data):
    if isinstance(data, dict) and "data" in data:
        return data["data"]
    return data


@pytest.mark.django_db
def test_prevalidation_week3_public_doctor_list_shape():
    convenio = ConvenioFactory()
    doctor_user = DoctorUserFactory(convenio=convenio)
    DoctorFactory(user=doctor_user, convenio=convenio, specialty="Cardiologia")

    response = _make_client().get("/api/v1/doctors/?specialty=Cardiologia")

    assert response.status_code == status.HTTP_200_OK
    assert response.data["status"] == "success"
    assert isinstance(response.data["data"], list)
    assert "meta" in response.data


@pytest.mark.django_db
def test_prevalidation_week3_slots_endpoint_returns_list():
    convenio = ConvenioFactory()
    doctor_user = DoctorUserFactory(convenio=convenio)
    doctor = DoctorFactory(user=doctor_user, convenio=convenio, consultation_duration=30)

    requested_date = timezone.now().date() + timedelta(days=3)
    DoctorScheduleFactory(
        doctor=doctor,
        weekday=requested_date.weekday(),
        start_time="09:00",
        end_time="10:00",
        slot_duration=30,
    )

    response = _make_client().get(f"/api/v1/doctors/{doctor.id}/slots/?date={requested_date.isoformat()}")

    assert response.status_code == status.HTTP_200_OK
    assert response.data["status"] == "success"
    assert isinstance(response.data["data"], list)


@pytest.mark.django_db
def test_prevalidation_week3_convenio_admin_can_create_exam_type():
    convenio = ConvenioFactory()
    admin = ConvenioAdminFactory(convenio=convenio)

    payload = {
        "convenio": str(convenio.id),
        "name": "Hemograma Semana3",
        "description": "Exame de sangue para baseline",
        "preparation": "Jejum de 8 horas",
        "duration_minutes": 30,
        "price": "120.00",
    }
    response = _make_client(admin).post("/api/v1/exam-types/", payload, format="json")

    assert response.status_code == status.HTTP_201_CREATED
    created = ExamType.objects.get(id=response.data["id"])
    assert created.convenio_id == convenio.id


@pytest.mark.django_db
def test_prevalidation_week3_convenio_admin_can_create_and_list_schedule():
    convenio = ConvenioFactory()
    admin = ConvenioAdminFactory(convenio=convenio)
    doctor_user = DoctorUserFactory(convenio=convenio)
    doctor = DoctorFactory(user=doctor_user, convenio=convenio)

    payload = {
        "doctor": str(doctor.id),
        "weekday": 1,
        "start_time": "08:00:00",
        "end_time": "12:00:00",
        "slot_duration": 30,
    }
    create_response = _make_client(admin).post("/api/v1/schedules/", payload, format="json")
    assert create_response.status_code == status.HTTP_201_CREATED

    list_response = _make_client(admin).get("/api/v1/schedules/")
    assert list_response.status_code == status.HTTP_200_OK

    items = _extract_items(list_response.data)
    returned_ids = {str(item["id"]) for item in items}
    assert str(create_response.data["id"]) in returned_ids


def test_prevalidation_week3_schema_has_core_operation_ids():
    schema_path = Path(__file__).resolve().parents[2] / "shared" / "schema.yaml"
    schema_text = schema_path.read_text(encoding="utf-8")

    expected_operation_ids = [
        "listConvenios",
        "getConvenioById",
        "getConvenioDashboard",
        "listDoctors",
        "getDoctorById",
        "getDoctorSlots",
        "listExamTypes",
        "createExamType",
        "listDoctorSchedules",
        "createDoctorSchedule",
        "listScheduleExceptions",
        "createScheduleException",
    ]

    for operation_id in expected_operation_ids:
        assert f"operationId: {operation_id}" in schema_text
