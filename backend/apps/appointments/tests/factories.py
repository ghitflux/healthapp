import factory
from faker import Faker

from apps.appointments.models import Appointment, Rating
from apps.doctors.tests.factories import DoctorFactory
from apps.users.tests.factories import PatientFactory

fake = Faker("pt_BR")


class AppointmentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Appointment

    patient = factory.SubFactory(PatientFactory)
    doctor = factory.SubFactory(DoctorFactory)
    convenio = factory.LazyAttribute(lambda o: o.doctor.convenio)
    appointment_type = "consultation"
    scheduled_date = factory.LazyAttribute(lambda _: fake.future_date())
    scheduled_time = "10:00"
    duration_minutes = 30
    status = "pending"
    price = factory.LazyAttribute(lambda o: o.doctor.consultation_price)


class ConfirmedAppointmentFactory(AppointmentFactory):
    status = "confirmed"


class CompletedAppointmentFactory(AppointmentFactory):
    status = "completed"


class RatingFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Rating

    appointment = factory.SubFactory(CompletedAppointmentFactory)
    patient = factory.LazyAttribute(lambda o: o.appointment.patient)
    doctor = factory.LazyAttribute(lambda o: o.appointment.doctor)
    score = factory.LazyAttribute(lambda _: fake.random_int(min=1, max=5))
    comment = factory.LazyAttribute(lambda _: fake.sentence())
    is_anonymous = False
