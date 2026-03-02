#!/usr/bin/env python
from __future__ import annotations

import os

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

from django.core.management import call_command  # noqa: E402

from apps.convenios.models import Convenio  # noqa: E402
from apps.doctors.models import Doctor, DoctorSchedule  # noqa: E402
from apps.users.models import CustomUser  # noqa: E402


def ensure_patients(total: int = 100):
    existing = CustomUser.objects.filter(role="patient").count()
    for index in range(existing, total):
        email = f"loadtest.patient{index + 1}@healthapp.com.br"
        CustomUser.objects.get_or_create(
            email=email,
            defaults={
                "full_name": f"Load Test Patient {index + 1}",
                "role": "patient",
                "phone": f"+551198{index:07d}"[:14],
                "email_verified": True,
                "phone_verified": True,
            },
        )


def ensure_schedules_for_next_week():
    for doctor in Doctor.objects.all():
        for weekday in range(0, 5):
            DoctorSchedule.objects.get_or_create(
                doctor=doctor,
                weekday=weekday,
                start_time="08:00:00",
                defaults={
                    "end_time": "18:00:00",
                    "slot_duration": 30,
                    "is_active": True,
                },
            )


def main():
    call_command("seed_data", "--force")
    ensure_patients(100)
    ensure_schedules_for_next_week()
    print("Load test data prepared")
    print(f"Users: {CustomUser.objects.count()}")
    print(f"Patients: {CustomUser.objects.filter(role='patient').count()}")
    print(f"Doctors: {Doctor.objects.count()}")
    print(f"Convenios: {Convenio.objects.count()}")


if __name__ == "__main__":
    main()
