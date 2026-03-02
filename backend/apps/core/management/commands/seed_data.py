"""
Seed database with realistic Week 3 data.

Usage:
  python manage.py seed_data
  python manage.py seed_data --force
"""

from __future__ import annotations

import calendar
from datetime import time, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone
from faker import Faker

from apps.appointments.models import Appointment, Rating
from apps.convenios.models import Convenio, ConvenioPlan, ExamType
from apps.doctors.models import Doctor, DoctorSchedule, ScheduleException
from apps.notifications.models import Notification
from apps.payments.models import Payment
from apps.users.models import CONSENT_PURPOSE_CHOICES, ConsentRecord, CustomUser

fake = Faker("pt_BR")

SPECIALTIES = [
    "Cardiologia",
    "Dermatologia",
    "Ginecologia",
    "Ortopedia",
    "Pediatria",
    "Neurologia",
    "Oftalmologia",
    "Urologia",
    "Endocrinologia",
    "Psiquiatria",
]


class Command(BaseCommand):
    help = "Seed realistic data for week 3 APIs and dashboards"

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Delete existing week3 seed data and recreate from scratch.",
        )

    def handle(self, *args, **options):
        force = options["force"]
        if force:
            self._clear_seed_data()

        if Appointment.objects.filter(notes__startswith="[seed-week3]").count() >= 50:
            self.stdout.write(self.style.WARNING("Week 3 seed data already present. Use --force to recreate."))
            return

        self.stdout.write("Seeding Week 3 dataset...")

        self._create_plans()
        owner = self._create_owner()
        convenios = self._create_convenios()
        self._create_exam_types(convenios)
        doctors = self._create_doctors(convenios)
        self._create_schedules(doctors)
        self._create_schedule_exceptions(doctors)
        patients = self._create_patients(25)
        appointments = self._create_appointments(doctors, patients)
        payments = self._create_payments(appointments)
        self._create_ratings(appointments)
        self._create_notifications(doctors, patients)
        self._create_consents()

        self.stdout.write(self.style.SUCCESS("Week 3 seed completed successfully."))
        self.stdout.write(f"  Owner: {owner.email}")
        self.stdout.write(f"  Convenios: {len(convenios)}")
        self.stdout.write(f"  Doctors: {len(doctors)}")
        self.stdout.write(f"  Patients: {len(patients)}")
        self.stdout.write(f"  Appointments: {len(appointments)}")
        self.stdout.write(f"  Payments: {len(payments)}")

    def _clear_seed_data(self):
        Notification.objects.filter(metadata__source="seed-week3").delete()
        Rating.objects.filter(comment__startswith="[seed-week3]").delete()
        Appointment.objects.filter(notes__startswith="[seed-week3]").delete()
        Payment.objects.filter(stripe_payment_intent_id__startswith="pi_seed_week3_").delete()
        ScheduleException.objects.filter(reason__startswith="[seed-week3]").delete()
        DoctorSchedule.objects.filter(doctor__user__email__startswith="doctor").delete()
        Doctor.objects.filter(user__email__startswith="doctor").delete()
        ExamType.objects.filter(name__startswith="[seed-week3]").delete()
        Convenio.objects.filter(name__startswith="Clinica Seed ").delete()
        CustomUser.objects.filter(email__startswith="patient").delete()
        CustomUser.objects.filter(email__startswith="admin.seed").delete()
        self.stdout.write("  Cleared previous week3 seed data.")

    def _create_owner(self) -> CustomUser:
        owner, created = CustomUser.objects.get_or_create(
            email="owner@healthapp.com.br",
            defaults={
                "full_name": "HealthApp Owner",
                "role": "owner",
                "is_staff": True,
                "is_superuser": True,
                "email_verified": True,
                "phone_verified": True,
                "phone": "+5511999990000",
            },
        )
        if created:
            owner.set_password("Owner@2026!")
            owner.save(update_fields=["password", "updated_at"])
        return owner

    def _create_plans(self):
        plans = [
            ("Starter", Decimal("99.90"), 5),
            ("Professional", Decimal("199.90"), 20),
            ("Enterprise", Decimal("499.90"), 100),
        ]
        for name, price, max_doctors in plans:
            ConvenioPlan.objects.get_or_create(
                name=name,
                defaults={
                    "price": price,
                    "max_doctors": max_doctors,
                    "features": [f"Feature {name} 1", f"Feature {name} 2"],
                },
            )

    def _create_convenios(self) -> list[Convenio]:
        convenio_specs = [
            ("Clinica Seed Alpha", True),
            ("Clinica Seed Beta", True),
            ("Clinica Seed Gamma", False),
        ]
        convenios: list[Convenio] = []
        for index, (name, approved) in enumerate(convenio_specs, start=1):
            convenio, _ = Convenio.objects.get_or_create(
                name=name,
                defaults={
                    "cnpj": fake.cnpj(),
                    "contact_email": f"contato{index}@seedclinica.com.br",
                    "contact_phone": f"+55119888000{index:02d}",
                    "description": f"Convenio seed {name}",
                    "address": {
                        "street": fake.street_address(),
                        "city": fake.city(),
                        "state": fake.state_abbr(),
                        "zip": fake.postcode(),
                    },
                    "subscription_plan": "professional",
                    "subscription_status": "active",
                    "is_active": True,
                    "is_approved": approved,
                    "approved_at": timezone.now() if approved else None,
                },
            )
            admin_email = f"admin.seed{index}@healthapp.com.br"
            admin, created = CustomUser.objects.get_or_create(
                email=admin_email,
                defaults={
                    "full_name": f"Admin Seed {index}",
                    "role": "convenio_admin",
                    "convenio": convenio,
                    "phone": f"+55119777000{index:02d}",
                    "email_verified": True,
                    "phone_verified": True,
                },
            )
            if created:
                admin.set_password("Admin@2026!")
                admin.save(update_fields=["password", "updated_at"])
            convenios.append(convenio)
        return convenios

    def _create_exam_types(self, convenios: list[Convenio]):
        base_exam_types = [
            ("Consulta Clinica", 30, Decimal("120.00")),
            ("Hemograma Completo", 25, Decimal("90.00")),
            ("Eletrocardiograma", 20, Decimal("110.00")),
            ("Ultrassonografia", 40, Decimal("180.00")),
        ]
        for convenio in convenios:
            for exam_name, duration, price in base_exam_types:
                ExamType.objects.get_or_create(
                    convenio=convenio,
                    name=f"[seed-week3] {exam_name}",
                    defaults={
                        "description": f"Servico seed {exam_name}",
                        "preparation": "Seguir orientacoes padrao.",
                        "duration_minutes": duration,
                        "price": price,
                        "is_active": True,
                    },
                )

    def _create_doctors(self, convenios: list[Convenio]) -> list[Doctor]:
        doctors: list[Doctor] = []
        for index in range(10):
            convenio = convenios[index % len(convenios)]
            user, created = CustomUser.objects.get_or_create(
                email=f"doctor{index + 1}@healthapp.com.br",
                defaults={
                    "full_name": f"Dr. Seed {index + 1}",
                    "role": "doctor",
                    "convenio": convenio,
                    "phone": f"+5511966600{index + 1:03d}",
                    "email_verified": True,
                    "phone_verified": True,
                },
            )
            if created:
                user.set_password("Doctor@2026!")
                user.save(update_fields=["password", "updated_at"])

            doctor, _ = Doctor.objects.get_or_create(
                user=user,
                defaults={
                    "convenio": convenio,
                    "crm": f"{100000 + index}",
                    "crm_state": "SP",
                    "specialty": SPECIALTIES[index % len(SPECIALTIES)],
                    "subspecialties": [SPECIALTIES[(index + 1) % len(SPECIALTIES)]],
                    "bio": "Medico seed para validacao de APIs.",
                    "consultation_duration": 30,
                    "consultation_price": Decimal("150.00") + Decimal(index * 10),
                    "is_available": True,
                },
            )
            doctors.append(doctor)
        return doctors

    def _create_schedules(self, doctors: list[Doctor]):
        for doctor in doctors:
            for weekday in range(5):  # Monday to Friday
                DoctorSchedule.objects.get_or_create(
                    doctor=doctor,
                    weekday=weekday,
                    start_time=time(8, 0),
                    defaults={"end_time": time(12, 0), "slot_duration": 30, "is_active": True},
                )
                DoctorSchedule.objects.get_or_create(
                    doctor=doctor,
                    weekday=weekday,
                    start_time=time(14, 0),
                    defaults={"end_time": time(18, 0), "slot_duration": 30, "is_active": True},
                )

    def _create_schedule_exceptions(self, doctors: list[Doctor]):
        today = timezone.localdate()
        for index in range(5):
            doctor = doctors[index]
            exception_date = today + timedelta(days=index + 3)
            ScheduleException.objects.get_or_create(
                doctor=doctor,
                date=exception_date,
                defaults={
                    "is_full_day": index % 2 == 0,
                    "is_available": False,
                    "start_time": None if index % 2 == 0 else time(10, 0),
                    "end_time": None if index % 2 == 0 else time(11, 0),
                    "reason": f"[seed-week3] bloqueio {index + 1}",
                },
            )

    def _create_patients(self, total: int) -> list[CustomUser]:
        patients: list[CustomUser] = []
        for index in range(total):
            patient, created = CustomUser.objects.get_or_create(
                email=f"patient{index + 1}@healthapp.com.br",
                defaults={
                    "full_name": fake.name(),
                    "role": "patient",
                    "phone": f"+5511955500{index + 1:03d}",
                    "date_of_birth": fake.date_of_birth(minimum_age=18, maximum_age=75),
                    "gender": "F" if index % 2 == 0 else "M",
                    "email_verified": True,
                    "phone_verified": True,
                },
            )
            if created:
                patient.set_password("Patient@2026!")
                patient.save(update_fields=["password", "updated_at"])
            patients.append(patient)
        return patients

    def _create_appointments(self, doctors: list[Doctor], patients: list[CustomUser]) -> list[Appointment]:
        today = timezone.localdate()
        status_sequence = (
            ["completed"] * 20
            + ["confirmed"] * 15
            + ["pending"] * 5
            + ["cancelled"] * 5
            + ["no_show"] * 5
        )
        appointments: list[Appointment] = []

        for index, apt_status in enumerate(status_sequence, start=1):
            doctor = doctors[index % len(doctors)]
            patient = patients[index % len(patients)]
            use_previous_month = index % 2 == 0
            target_month_ref = today - timedelta(days=30) if use_previous_month else today
            month_days = calendar.monthrange(target_month_ref.year, target_month_ref.month)[1]
            day = min((index % 25) + 1, month_days)
            scheduled_date = target_month_ref.replace(day=day)
            scheduled_time = time(8 + (index % 10), 0 if index % 2 == 0 else 30)

            appointment, _ = Appointment.objects.get_or_create(
                notes=f"[seed-week3] appointment-{index}",
                defaults={
                    "patient": patient,
                    "doctor": doctor,
                    "convenio": doctor.convenio,
                    "appointment_type": "consultation" if index % 3 else "exam",
                    "exam_type": doctor.convenio.exam_types.first() if index % 3 == 0 else None,
                    "scheduled_date": scheduled_date,
                    "scheduled_time": scheduled_time,
                    "duration_minutes": 30,
                    "status": apt_status,
                    "cancellation_reason": "Paciente desistiu" if apt_status == "cancelled" else "",
                    "price": doctor.consultation_price,
                },
            )

            appointment.status = apt_status
            appointment.scheduled_date = scheduled_date
            appointment.scheduled_time = scheduled_time
            appointment.cancellation_reason = "Paciente desistiu" if apt_status == "cancelled" else ""
            appointment.save(
                update_fields=["status", "scheduled_date", "scheduled_time", "cancellation_reason", "updated_at"]
            )
            appointments.append(appointment)

        return appointments

    def _create_payments(self, appointments: list[Appointment]) -> list[Payment]:
        payment_statuses = ["completed"] * 20 + ["failed"] * 5 + ["refunded"] * 3 + ["pending"] * 2
        payments: list[Payment] = []

        for index, status_value in enumerate(payment_statuses, start=1):
            appointment = appointments[index - 1]
            payment, _ = Payment.objects.get_or_create(
                stripe_payment_intent_id=f"pi_seed_week3_{index:03d}",
                defaults={
                    "user": appointment.patient,
                    "amount": appointment.price,
                    "payment_method": "pix" if index % 2 == 0 else "credit_card",
                    "status": status_value,
                    "metadata": {"source": "seed-week3", "appointment_seed": index},
                },
            )

            payment.status = status_value
            payment.amount = appointment.price
            payment.user = appointment.patient
            payment.paid_at = timezone.now() - timedelta(days=index % 20) if status_value == "completed" else None
            payment.refund_amount = appointment.price if status_value == "refunded" else None
            payment.refunded_at = timezone.now() - timedelta(days=1) if status_value == "refunded" else None
            payment.save(
                update_fields=["status", "amount", "user", "paid_at", "refund_amount", "refunded_at", "updated_at"]
            )

            appointment.payment = payment
            appointment.save(update_fields=["payment", "updated_at"])
            payments.append(payment)

        return payments

    def _create_ratings(self, appointments: list[Appointment]):
        completed = [item for item in appointments if item.status == "completed"][:20]
        for index, appointment in enumerate(completed, start=1):
            rating, _ = Rating.objects.get_or_create(
                appointment=appointment,
                defaults={
                    "patient": appointment.patient,
                    "doctor": appointment.doctor,
                    "score": (index % 5) + 1,
                    "comment": f"[seed-week3] avaliacao {index}",
                },
            )
            rating.score = (index % 5) + 1
            rating.comment = f"[seed-week3] avaliacao {index}"
            rating.save(update_fields=["score", "comment", "updated_at"])

    def _create_notifications(self, doctors: list[Doctor], patients: list[CustomUser]):
        users_pool = patients + [doctor.user for doctor in doctors]
        types = ["appointment", "payment", "system", "reminder"]
        channels = ["push", "email", "sms"]

        for index in range(50):
            user = users_pool[index % len(users_pool)]
            notif_type = types[index % len(types)]
            channel = channels[index % len(channels)]
            Notification.objects.get_or_create(
                user=user,
                type=notif_type,
                title=f"[seed-week3] notificacao {index + 1}",
                defaults={
                    "body": f"Conteudo de notificacao seed {index + 1}",
                    "channel": channel,
                    "is_read": index % 3 == 0,
                    "metadata": {"source": "seed-week3", "seed_index": index + 1},
                },
            )

    def _create_consents(self):
        for user in CustomUser.objects.all():
            for purpose, _ in CONSENT_PURPOSE_CHOICES:
                consent, _ = ConsentRecord.objects.get_or_create(
                    user=user,
                    purpose=purpose,
                    defaults={"granted": True, "granted_at": timezone.now()},
                )
                if not consent.granted:
                    consent.granted = True
                    consent.granted_at = timezone.now()
                    consent.revoked_at = None
                    consent.save(update_fields=["granted", "granted_at", "revoked_at", "updated_at"])
