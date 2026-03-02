from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.appointments.tests.factories import AppointmentFactory
from apps.convenios.tests.factories import ConvenioFactory
from apps.doctors.models import DoctorSchedule
from apps.doctors.tests.factories import DoctorFactory, DoctorScheduleFactory, ScheduleExceptionFactory
from apps.users.tests.factories import ConvenioAdminFactory, DoctorUserFactory, OwnerFactory, PatientFactory


def _auth_client(user):
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
    return client


@pytest.mark.django_db
class TestDoctorList:
    def test_list_doctors_unauthenticated(self):
        doctor = DoctorFactory(specialty="Cardiologia")

        response = APIClient().get("/api/v1/doctors/")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "success"
        returned_ids = [item["id"] for item in response.data["data"]]
        assert str(doctor.id) in returned_ids

    def test_list_doctors_returns_paginated(self):
        DoctorFactory.create_batch(3)

        response = APIClient().get("/api/v1/doctors/")

        assert response.status_code == status.HTTP_200_OK
        assert "meta" in response.data
        assert response.data["meta"]["page"] == 1

    def test_list_doctors_filter_by_specialty(self):
        target = DoctorFactory(specialty="Cardiologia")
        DoctorFactory(specialty="Dermatologia")

        response = APIClient().get("/api/v1/doctors/?specialty=Cardio")

        assert response.status_code == status.HTTP_200_OK
        returned_ids = [item["id"] for item in response.data["data"]]
        assert str(target.id) in returned_ids
        assert len(returned_ids) == 1

    def test_list_doctors_filter_by_city(self):
        convenio_sp = ConvenioFactory(address={"city": "Sao Paulo", "state": "SP"})
        convenio_rj = ConvenioFactory(address={"city": "Rio de Janeiro", "state": "RJ"})
        user_sp = DoctorUserFactory(convenio=convenio_sp)
        user_rj = DoctorUserFactory(convenio=convenio_rj)
        doctor_sp = DoctorFactory(user=user_sp, convenio=convenio_sp)
        DoctorFactory(user=user_rj, convenio=convenio_rj)

        response = APIClient().get("/api/v1/doctors/?city=sao+paulo")

        assert response.status_code == status.HTTP_200_OK
        returned_ids = [item["id"] for item in response.data["data"]]
        assert str(doctor_sp.id) in returned_ids
        assert len(returned_ids) == 1

    def test_list_doctors_filter_by_price_range(self):
        cheap = DoctorFactory(consultation_price="100.00")
        DoctorFactory(consultation_price="500.00")

        response = APIClient().get("/api/v1/doctors/?min_price=90&max_price=150")

        assert response.status_code == status.HTTP_200_OK
        ids = [item["id"] for item in response.data["data"]]
        assert str(cheap.id) in ids
        assert len(ids) == 1

    def test_list_doctors_filter_by_available(self):
        available = DoctorFactory(is_available=True)
        DoctorFactory(is_available=False)

        response = APIClient().get("/api/v1/doctors/?is_available=true")

        assert response.status_code == status.HTTP_200_OK
        ids = [item["id"] for item in response.data["data"]]
        assert str(available.id) in ids
        assert len(ids) == 1

    def test_list_doctors_search_fuzzy(self):
        doctor = DoctorFactory(specialty="Cardiologia")

        response = APIClient().get("/api/v1/doctors/?search=cardiolgia")

        assert response.status_code == status.HTTP_200_OK
        ids = [item["id"] for item in response.data["data"]]
        assert str(doctor.id) in ids

    def test_list_doctors_search_by_name(self):
        convenio = ConvenioFactory()
        doctor_user = DoctorUserFactory(convenio=convenio, full_name="Joao Silva")
        doctor = DoctorFactory(user=doctor_user, convenio=convenio)

        response = APIClient().get("/api/v1/doctors/?search=joao")

        assert response.status_code == status.HTTP_200_OK
        ids = [item["id"] for item in response.data["data"]]
        assert str(doctor.id) in ids

    def test_list_doctors_combined_filters(self):
        convenio = ConvenioFactory(address={"city": "Sao Paulo", "state": "SP"})
        doctor_user = DoctorUserFactory(convenio=convenio)
        doctor = DoctorFactory(
            user=doctor_user,
            convenio=convenio,
            specialty="Cardiologia",
            consultation_price="120.00",
            is_available=True,
        )
        DoctorFactory(specialty="Dermatologia", consultation_price="350.00")

        response = APIClient().get("/api/v1/doctors/?search=cardio&city=sao+paulo&min_price=100&max_price=150")

        assert response.status_code == status.HTTP_200_OK
        ids = [item["id"] for item in response.data["data"]]
        assert ids == [str(doctor.id)]

    def test_list_doctors_no_results(self):
        DoctorFactory(specialty="Cardiologia")

        response = APIClient().get("/api/v1/doctors/?specialty=Oncologia")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["data"] == []


@pytest.mark.django_db
class TestDoctorRetrieve:
    def test_get_doctor_by_id(self):
        doctor = DoctorFactory()

        response = APIClient().get(f"/api/v1/doctors/{doctor.id}/")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["id"] == str(doctor.id)

    def test_get_doctor_not_found(self):
        response = APIClient().get("/api/v1/doctors/00000000-0000-0000-0000-000000000000/")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_get_doctor_includes_rating(self):
        doctor = DoctorFactory(rating="4.50", total_ratings=10)

        response = APIClient().get(f"/api/v1/doctors/{doctor.id}/")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["rating"] == "4.50"
        assert response.data["total_ratings"] == 10


@pytest.mark.django_db
class TestDoctorSlots:
    def test_get_slots_available(self):
        doctor = DoctorFactory(consultation_duration=30)
        target_date = timezone.localdate() + timedelta(days=3)
        DoctorScheduleFactory(doctor=doctor, weekday=target_date.weekday(), start_time="09:00", end_time="10:00")

        response = APIClient().get(f"/api/v1/doctors/{doctor.id}/slots/?date={target_date.isoformat()}")

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["data"]) >= 1

    def test_get_slots_no_schedule(self):
        doctor = DoctorFactory()
        target_date = timezone.localdate() + timedelta(days=5)

        response = APIClient().get(f"/api/v1/doctors/{doctor.id}/slots/?date={target_date.isoformat()}")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["data"] == []

    def test_get_slots_full_day_exception(self):
        doctor = DoctorFactory()
        target_date = timezone.localdate() + timedelta(days=2)
        DoctorScheduleFactory(doctor=doctor, weekday=target_date.weekday(), start_time="09:00", end_time="11:00")
        ScheduleExceptionFactory(doctor=doctor, date=target_date, is_full_day=True, is_available=False)

        response = APIClient().get(f"/api/v1/doctors/{doctor.id}/slots/?date={target_date.isoformat()}")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["data"] == []

    def test_get_slots_partial_exception(self):
        doctor = DoctorFactory()
        target_date = timezone.localdate() + timedelta(days=4)
        DoctorScheduleFactory(
            doctor=doctor,
            weekday=target_date.weekday(),
            start_time="09:00",
            end_time="11:00",
            slot_duration=30,
        )
        ScheduleExceptionFactory(
            doctor=doctor,
            date=target_date,
            is_full_day=False,
            is_available=False,
            start_time="09:30",
            end_time="10:00",
        )

        response = APIClient().get(f"/api/v1/doctors/{doctor.id}/slots/?date={target_date.isoformat()}")

        assert response.status_code == status.HTTP_200_OK
        slots = response.data["data"]
        blocked = [slot for slot in slots if str(slot["time"]).startswith("09:30")][0]
        assert blocked["is_available"] is False

    def test_get_slots_with_booked(self):
        doctor = DoctorFactory()
        target_date = timezone.localdate() + timedelta(days=3)
        DoctorScheduleFactory(
            doctor=doctor,
            weekday=target_date.weekday(),
            start_time="09:00",
            end_time="10:00",
            slot_duration=30,
        )
        AppointmentFactory(
            doctor=doctor,
            convenio=doctor.convenio,
            scheduled_date=target_date,
            scheduled_time="09:00:00",
            status="confirmed",
        )

        response = APIClient().get(f"/api/v1/doctors/{doctor.id}/slots/?date={target_date.isoformat()}")

        assert response.status_code == status.HTTP_200_OK
        first_slot = [slot for slot in response.data["data"] if str(slot["time"]).startswith("09:00")][0]
        assert first_slot["is_available"] is False

    def test_get_slots_past_date_returns_empty(self):
        doctor = DoctorFactory()
        past_date = timezone.localdate() - timedelta(days=1)

        response = APIClient().get(f"/api/v1/doctors/{doctor.id}/slots/?date={past_date.isoformat()}")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["data"] == []

    def test_get_slots_missing_date_param(self):
        doctor = DoctorFactory()

        response = APIClient().get(f"/api/v1/doctors/{doctor.id}/slots/")

        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_get_available_dates(self):
        doctor = DoctorFactory()
        start = timezone.localdate() + timedelta(days=1)
        DoctorScheduleFactory(doctor=doctor, weekday=start.weekday(), start_time="09:00", end_time="10:00")

        response = APIClient().get(
            f"/api/v1/doctors/{doctor.id}/available-dates/?start_date={start.isoformat()}&end_date={start.isoformat()}"
        )

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["data"]) == 1
        assert response.data["data"][0]["date"] == start


@pytest.mark.django_db
class TestDoctorCreate:
    def test_convenio_admin_can_create_doctor(self):
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
            "consultation_price": "180.00",
        }

        response = _auth_client(admin).post("/api/v1/doctors/", payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED

    def test_owner_can_create_doctor(self):
        owner = OwnerFactory()
        convenio = ConvenioFactory()
        doctor_user = DoctorUserFactory(convenio=convenio)
        payload = {
            "user": str(doctor_user.id),
            "convenio": str(convenio.id),
            "crm": "123457",
            "crm_state": "SP",
            "specialty": "Cardiologia",
            "consultation_duration": 30,
            "consultation_price": "180.00",
        }

        response = _auth_client(owner).post("/api/v1/doctors/", payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED

    def test_patient_cannot_create_doctor(self):
        patient = PatientFactory()
        response = _auth_client(patient).post("/api/v1/doctors/", {}, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_create_doctor_invalid_crm(self):
        owner = OwnerFactory()
        convenio = ConvenioFactory()
        doctor_user = DoctorUserFactory(convenio=convenio)
        payload = {
            "user": str(doctor_user.id),
            "convenio": str(convenio.id),
            "crm": "abc",
            "crm_state": "SP",
            "specialty": "Cardiologia",
            "consultation_duration": 30,
            "consultation_price": "180.00",
        }

        response = _auth_client(owner).post("/api/v1/doctors/", payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_doctor_duplicate_crm(self):
        owner = OwnerFactory()
        convenio = ConvenioFactory()
        first_user = DoctorUserFactory(convenio=convenio)
        second_user = DoctorUserFactory(convenio=convenio)
        DoctorFactory(user=first_user, convenio=convenio, crm="123458", crm_state="SP")
        payload = {
            "user": str(second_user.id),
            "convenio": str(convenio.id),
            "crm": "123458",
            "crm_state": "SP",
            "specialty": "Cardiologia",
            "consultation_duration": 30,
            "consultation_price": "180.00",
        }

        response = _auth_client(owner).post("/api/v1/doctors/", payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
class TestDoctorScheduleViewSet:
    def test_convenio_admin_can_list_schedules(self):
        convenio = ConvenioFactory()
        admin = ConvenioAdminFactory(convenio=convenio)
        doctor = DoctorFactory(user=DoctorUserFactory(convenio=convenio), convenio=convenio)
        DoctorScheduleFactory(doctor=doctor)

        response = _auth_client(admin).get("/api/v1/schedules/")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["meta"]["total"] >= 1

    def test_convenio_admin_can_create_schedule(self):
        convenio = ConvenioFactory()
        admin = ConvenioAdminFactory(convenio=convenio)
        doctor = DoctorFactory(user=DoctorUserFactory(convenio=convenio), convenio=convenio)
        payload = {
            "doctor": str(doctor.id),
            "weekday": 1,
            "start_time": "08:00:00",
            "end_time": "12:00:00",
            "slot_duration": 30,
        }

        response = _auth_client(admin).post("/api/v1/schedules/", payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED

    def test_create_schedule_overlapping(self):
        convenio = ConvenioFactory()
        admin = ConvenioAdminFactory(convenio=convenio)
        doctor = DoctorFactory(user=DoctorUserFactory(convenio=convenio), convenio=convenio)
        DoctorScheduleFactory(doctor=doctor, weekday=1, start_time="08:00:00")
        payload = {
            "doctor": str(doctor.id),
            "weekday": 1,
            "start_time": "08:00:00",
            "end_time": "12:00:00",
            "slot_duration": 30,
        }

        response = _auth_client(admin).post("/api/v1/schedules/", payload, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_convenio_admin_can_delete_schedule(self):
        convenio = ConvenioFactory()
        admin = ConvenioAdminFactory(convenio=convenio)
        doctor = DoctorFactory(user=DoctorUserFactory(convenio=convenio), convenio=convenio)
        schedule = DoctorScheduleFactory(doctor=doctor)

        response = _auth_client(admin).delete(f"/api/v1/schedules/{schedule.id}/")

        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert DoctorSchedule.objects.filter(id=schedule.id).exists() is False

    def test_patient_cannot_manage_schedules(self):
        patient = PatientFactory()
        response = _auth_client(patient).get("/api/v1/schedules/")
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestScheduleExceptionViewSet:
    def test_convenio_admin_can_create_exception(self):
        convenio = ConvenioFactory()
        admin = ConvenioAdminFactory(convenio=convenio)
        doctor = DoctorFactory(user=DoctorUserFactory(convenio=convenio), convenio=convenio)
        payload = {
            "doctor": str(doctor.id),
            "date": (timezone.localdate() + timedelta(days=7)).isoformat(),
            "is_full_day": True,
            "is_available": False,
            "reason": "Feriado",
        }

        response = _auth_client(admin).post("/api/v1/schedule-exceptions/", payload, format="json")

        assert response.status_code == status.HTTP_201_CREATED

    def test_convenio_admin_can_list_exceptions(self):
        convenio = ConvenioFactory()
        admin = ConvenioAdminFactory(convenio=convenio)
        doctor = DoctorFactory(user=DoctorUserFactory(convenio=convenio), convenio=convenio)
        ScheduleExceptionFactory(doctor=doctor)

        response = _auth_client(admin).get("/api/v1/schedule-exceptions/")

        assert response.status_code == status.HTTP_200_OK
        assert response.data["meta"]["total"] >= 1

    def test_convenio_admin_can_delete_exception(self):
        convenio = ConvenioFactory()
        admin = ConvenioAdminFactory(convenio=convenio)
        doctor = DoctorFactory(user=DoctorUserFactory(convenio=convenio), convenio=convenio)
        exception = ScheduleExceptionFactory(doctor=doctor)

        response = _auth_client(admin).delete(f"/api/v1/schedule-exceptions/{exception.id}/")

        assert response.status_code == status.HTTP_204_NO_CONTENT
