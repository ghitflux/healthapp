from __future__ import annotations

import random
from datetime import timedelta
from uuid import uuid4

from locust import HttpUser, between, task


def _extract_access_token(payload: dict) -> str:
    return payload.get("data", {}).get("access", "")


class AuthenticatedUser(HttpUser):
    abstract = True
    token = ""

    def auth_headers(self):
        if not self.token:
            return {}
        return {"Authorization": f"Bearer {self.token}"}


class PatientUser(AuthenticatedUser):
    wait_time = between(1, 3)

    def on_start(self):
        self.email = f"load.patient.{uuid4().hex[:8]}@healthapp.com.br"
        self.password = "LoadTest@123"
        register_payload = {
            "email": self.email,
            "password": self.password,
            "password_confirm": self.password,
            "full_name": f"Load Test {uuid4().hex[:5]}",
            "phone": f"+551199{random.randint(1000000, 9999999)}",
            "cpf": f"{random.randint(10000000000, 99999999999)}",
            "date_of_birth": "1990-01-01",
            "gender": "M",
        }
        self.client.post("/api/v1/auth/register/", json=register_payload, name="/auth/register")
        login_response = self.client.post(
            "/api/v1/auth/login/",
            json={"email": self.email, "password": self.password},
            name="/auth/login",
        )
        if login_response.status_code == 200:
            self.token = _extract_access_token(login_response.json())

    @task(5)
    def search_doctors(self):
        specialty = random.choice(["cardiologia", "dermatologia", "ortopedia", "pediatria"])
        self.client.get(f"/api/v1/doctors/?search={specialty}", name="/doctors?search")

    @task(3)
    def get_doctor_slots(self):
        doctors_response = self.client.get("/api/v1/doctors/?page_size=5", name="/doctors")
        if doctors_response.status_code != 200:
            return
        doctors = doctors_response.json().get("data", [])
        if not doctors:
            return
        doctor_id = random.choice(doctors)["id"]
        from datetime import date as _date

        selected = (_date.today() + timedelta(days=random.randint(1, 4))).isoformat()
        self.client.get(f"/api/v1/doctors/{doctor_id}/slots/?date={selected}", name="/doctors/:id/slots")

    @task(2)
    def list_appointments(self):
        self.client.get("/api/v1/appointments/", headers=self.auth_headers(), name="/appointments")

    @task(2)
    def get_notifications(self):
        self.client.get("/api/v1/notifications/", headers=self.auth_headers(), name="/notifications")

    @task(1)
    def create_appointment(self):
        doctors_response = self.client.get("/api/v1/doctors/?page_size=5", name="/doctors")
        if doctors_response.status_code != 200:
            return
        doctors = doctors_response.json().get("data", [])
        if not doctors:
            return
        doctor_id = random.choice(doctors)["id"]
        from datetime import date as _date

        target_date = (_date.today() + timedelta(days=random.randint(1, 5))).isoformat()
        payload = {
            "doctor": doctor_id,
            "appointment_type": "consultation",
            "scheduled_date": target_date,
            "scheduled_time": "10:00:00",
        }
        self.client.post("/api/v1/appointments/", json=payload, headers=self.auth_headers(), name="/appointments:create")


class ConvenioAdminUser(AuthenticatedUser):
    wait_time = between(2, 5)

    def on_start(self):
        login_response = self.client.post(
            "/api/v1/auth/login/",
            json={"email": "admin.seed1@healthapp.com.br", "password": "Admin@2026!"},
            name="/auth/login:convenio_admin",
        )
        if login_response.status_code == 200:
            self.token = _extract_access_token(login_response.json())

    @task(3)
    def get_dashboard(self):
        self.client.get("/api/v1/convenios/dashboard/", headers=self.auth_headers(), name="/convenios/dashboard")

    @task(2)
    def list_doctors(self):
        self.client.get("/api/v1/doctors/", headers=self.auth_headers(), name="/doctors")

    @task(2)
    def list_appointments(self):
        self.client.get("/api/v1/appointments/", headers=self.auth_headers(), name="/appointments")

    @task(1)
    def get_financial(self):
        self.client.get(
            "/api/v1/convenios/reports/financial/",
            headers=self.auth_headers(),
            name="/convenios/reports/financial",
        )


class OwnerUser(AuthenticatedUser):
    wait_time = between(3, 8)

    def on_start(self):
        login_response = self.client.post(
            "/api/v1/auth/login/",
            json={"email": "owner@healthapp.com.br", "password": "Owner@2026!"},
            name="/auth/login:owner",
        )
        if login_response.status_code == 200:
            self.token = _extract_access_token(login_response.json())

    @task(3)
    def get_owner_dashboard(self):
        self.client.get("/api/v1/admin-panel/dashboard/", headers=self.auth_headers(), name="/admin/dashboard")

    @task(2)
    def list_convenios(self):
        self.client.get("/api/v1/admin-panel/convenios/", headers=self.auth_headers(), name="/admin/convenios")

    @task(1)
    def list_users(self):
        self.client.get("/api/v1/admin-panel/users/", headers=self.auth_headers(), name="/admin/users")
