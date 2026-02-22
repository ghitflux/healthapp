import factory
from faker import Faker

from apps.convenios.tests.factories import ConvenioFactory
from apps.doctors.models import Doctor, DoctorSchedule, ScheduleException
from apps.users.tests.factories import DoctorUserFactory

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
]


class DoctorFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Doctor

    user = factory.SubFactory(DoctorUserFactory)
    convenio = factory.SubFactory(ConvenioFactory)
    crm = factory.LazyAttribute(lambda _: str(fake.unique.random_number(digits=6)))
    crm_state = factory.LazyAttribute(lambda _: fake.state_abbr())
    specialty = factory.Iterator(SPECIALTIES)
    bio = factory.LazyAttribute(lambda _: fake.text(max_nb_chars=300))
    consultation_duration = 30
    consultation_price = factory.LazyAttribute(
        lambda _: fake.pydecimal(left_digits=3, right_digits=2, positive=True, min_value=100, max_value=500)
    )
    is_available = True


class DoctorScheduleFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = DoctorSchedule

    doctor = factory.SubFactory(DoctorFactory)
    weekday = factory.Iterator(range(5))  # Mon-Fri
    start_time = "08:00"
    end_time = "17:00"
    slot_duration = 30
    is_active = True


class ScheduleExceptionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ScheduleException

    doctor = factory.SubFactory(DoctorFactory)
    date = factory.LazyAttribute(lambda _: fake.future_date())
    is_full_day = True
    is_available = False
    reason = "Feriado"
