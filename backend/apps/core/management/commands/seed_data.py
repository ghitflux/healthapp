"""
Seed database with realistic Brazilian test data.

Usage: python manage.py seed_data
"""

import random
from datetime import date, time, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone
from faker import Faker

from apps.appointments.models import Appointment, Rating
from apps.convenios.models import Convenio, ConvenioPlan, ExamType
from apps.doctors.models import Doctor, DoctorSchedule, ScheduleException
from apps.notifications.models import Notification
from apps.payments.models import Payment
from apps.users.models import CustomUser

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

EXAM_TYPES = [
    ("Hemograma Completo", 30, Decimal("45.00"), "Jejum de 8 horas"),
    ("Eletrocardiograma", 20, Decimal("80.00"), "Sem preparo especial"),
    ("Ultrassonografia Abdominal", 40, Decimal("150.00"), "Jejum de 6 horas e bexiga cheia"),
    ("Raio-X Tórax", 15, Decimal("60.00"), "Sem preparo especial"),
    ("Ecocardiograma", 45, Decimal("200.00"), "Sem preparo especial"),
]


class Command(BaseCommand):
    help = "Seed database with realistic Brazilian test data"

    def handle(self, *args, **options):
        self.stdout.write("Seeding database...")

        # 1. Owner
        owner = self._create_owner()

        # 2. Plans
        plans = self._create_plans()

        # 3. Convenios
        convenios = self._create_convenios(2)

        # 4. Exam Types
        for convenio in convenios:
            self._create_exam_types(convenio)

        # 5. Doctors (with schedules)
        doctors = []
        for convenio in convenios:
            for _ in range(3):
                doctor = self._create_doctor(convenio)
                doctors.append(doctor)
                self._create_schedules(doctor)

        # 6. Patients
        patients = self._create_patients(10)

        # 7. Appointments
        appointments = self._create_appointments(patients, doctors, 20)

        # 8. Payments
        self._create_payments(appointments)

        # 9. Ratings
        self._create_ratings(appointments)

        # 10. Notifications
        self._create_notifications(patients, 30)

        self.stdout.write(self.style.SUCCESS("Database seeded successfully!"))
        self.stdout.write(f"  Owner: {owner.email}")
        self.stdout.write(f"  Convenios: {len(convenios)}")
        self.stdout.write(f"  Doctors: {len(doctors)}")
        self.stdout.write(f"  Patients: {len(patients)}")
        self.stdout.write(f"  Appointments: {len(appointments)}")

    def _create_owner(self):
        owner, created = CustomUser.objects.get_or_create(
            email="owner@healthapp.com.br",
            defaults={
                "full_name": "Admin HealthApp",
                "role": "owner",
                "is_staff": True,
                "is_superuser": True,
                "email_verified": True,
                "phone": "(11) 99999-0000",
            },
        )
        if created:
            owner.set_password("Owner@2026!")
            owner.save()
            self.stdout.write(f"  Created owner: {owner.email}")
        return owner

    def _create_plans(self):
        plans_data = [
            ("Starter", Decimal("99.90"), 5, ["Até 5 médicos", "Dashboard básico"]),
            ("Professional", Decimal("199.90"), 20, ["Até 20 médicos", "Relatórios", "Suporte prioritário"]),
            ("Enterprise", Decimal("499.90"), 100, ["Ilimitado", "API access", "Suporte 24h", "White label"]),
        ]
        plans = []
        for name, price, max_docs, features in plans_data:
            plan, _ = ConvenioPlan.objects.get_or_create(
                name=name,
                defaults={"price": price, "max_doctors": max_docs, "features": features},
            )
            plans.append(plan)
        return plans

    def _create_convenios(self, count):
        convenios = []
        names = ["Clínica São Lucas", "Hospital Vida Nova"]
        for i in range(count):
            convenio, _ = Convenio.objects.get_or_create(
                name=names[i],
                defaults={
                    "cnpj": fake.cnpj(),
                    "contact_email": f"contato@{names[i].lower().replace(' ', '')}.com.br",
                    "contact_phone": fake.phone_number(),
                    "description": f"Referência em saúde na região de {fake.city()}",
                    "address": {
                        "street": fake.street_address(),
                        "city": fake.city(),
                        "state": fake.state_abbr(),
                        "zip": fake.postcode(),
                    },
                    "subscription_plan": "professional",
                    "is_approved": True,
                    "approved_at": timezone.now(),
                },
            )

            # Create convenio admin user
            admin_email = f"admin@{names[i].lower().replace(' ', '')}.com.br"
            admin, created = CustomUser.objects.get_or_create(
                email=admin_email,
                defaults={
                    "full_name": f"Admin {names[i]}",
                    "role": "convenio_admin",
                    "convenio": convenio,
                    "email_verified": True,
                    "phone": fake.unique.phone_number(),
                },
            )
            if created:
                admin.set_password("Admin@2026!")
                admin.save()

            convenios.append(convenio)
        return convenios

    def _create_exam_types(self, convenio):
        for name, duration, price, prep in EXAM_TYPES:
            ExamType.objects.get_or_create(
                convenio=convenio,
                name=name,
                defaults={
                    "duration_minutes": duration,
                    "price": price,
                    "preparation": prep,
                    "description": f"Exame de {name.lower()}",
                },
            )

    def _create_doctor(self, convenio):
        user = CustomUser.objects.create_user(
            email=fake.unique.email(),
            password="Doctor@2026!",
            full_name=f"Dr. {fake.name()}",
            role="doctor",
            convenio=convenio,
            phone=fake.unique.phone_number(),
            email_verified=True,
        )
        specialty = random.choice(SPECIALTIES)
        doctor = Doctor.objects.create(
            user=user,
            convenio=convenio,
            crm=str(fake.unique.random_number(digits=6)),
            crm_state=fake.state_abbr(),
            specialty=specialty,
            bio=f"Especialista em {specialty} com {random.randint(5, 25)} anos de experiência.",
            consultation_price=Decimal(str(random.randint(150, 450))),
            consultation_duration=30,
            is_available=True,
        )
        return doctor

    def _create_schedules(self, doctor):
        for weekday in range(5):  # Mon-Fri
            DoctorSchedule.objects.get_or_create(
                doctor=doctor,
                weekday=weekday,
                start_time=time(8, 0),
                defaults={
                    "end_time": time(12, 0),
                    "slot_duration": 30,
                },
            )
            DoctorSchedule.objects.get_or_create(
                doctor=doctor,
                weekday=weekday,
                start_time=time(14, 0),
                defaults={
                    "end_time": time(18, 0),
                    "slot_duration": 30,
                },
            )

    def _create_patients(self, count):
        patients = []
        for _ in range(count):
            patient = CustomUser.objects.create_user(
                email=fake.unique.email(),
                password="Patient@2026!",
                full_name=fake.name(),
                role="patient",
                phone=fake.unique.phone_number(),
                date_of_birth=fake.date_of_birth(minimum_age=18, maximum_age=80),
                gender=random.choice(["M", "F"]),
            )
            patients.append(patient)
        return patients

    def _create_appointments(self, patients, doctors, count):
        statuses = ["pending", "confirmed", "completed", "cancelled", "no_show"]
        weights = [0.15, 0.25, 0.35, 0.15, 0.10]
        appointments = []

        for i in range(count):
            patient = random.choice(patients)
            doctor = random.choice(doctors)
            apt_status = random.choices(statuses, weights=weights, k=1)[0]
            apt_date = date.today() + timedelta(days=random.randint(-30, 30))
            apt_time = time(random.randint(8, 17), random.choice([0, 30]))

            apt = Appointment.objects.create(
                patient=patient,
                doctor=doctor,
                convenio=doctor.convenio,
                appointment_type=random.choice(["consultation", "exam", "return_visit"]),
                scheduled_date=apt_date,
                scheduled_time=apt_time,
                duration_minutes=30,
                status=apt_status,
                price=doctor.consultation_price,
                cancellation_reason="Motivo pessoal" if apt_status == "cancelled" else "",
            )
            appointments.append(apt)
        return appointments

    def _create_payments(self, appointments):
        for apt in appointments:
            if apt.status in ("confirmed", "completed"):
                payment = Payment.objects.create(
                    user=apt.patient,
                    amount=apt.price,
                    payment_method=random.choice(["pix", "credit_card"]),
                    status="completed" if apt.status == "completed" else "pending",
                    paid_at=timezone.now() if apt.status == "completed" else None,
                    stripe_payment_intent_id=f"pi_{fake.hexify(text='^^^^^^^^^^^^^^^^')}",
                )
                apt.payment = payment
                apt.save(update_fields=["payment"])

    def _create_ratings(self, appointments):
        completed = [a for a in appointments if a.status == "completed"]
        for apt in completed[:10]:  # Rate first 10 completed
            Rating.objects.create(
                appointment=apt,
                patient=apt.patient,
                doctor=apt.doctor,
                score=random.randint(3, 5),
                comment=random.choice([
                    "Excelente atendimento!",
                    "Médico muito atencioso.",
                    "Recomendo!",
                    "Ótima consulta.",
                    "Profissional competente.",
                ]),
            )

    def _create_notifications(self, patients, count):
        types = ["appointment", "payment", "system", "reminder"]
        titles = {
            "appointment": "Consulta confirmada",
            "payment": "Pagamento recebido",
            "system": "Bem-vindo ao HealthApp!",
            "reminder": "Lembrete de consulta",
        }
        for _ in range(count):
            patient = random.choice(patients)
            notif_type = random.choice(types)
            Notification.objects.create(
                user=patient,
                type=notif_type,
                title=titles[notif_type],
                body=fake.text(max_nb_chars=150),
                channel=random.choice(["push", "email"]),
                is_read=random.choice([True, False]),
            )
