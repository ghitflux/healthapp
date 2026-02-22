import factory
from faker import Faker

from apps.convenios.models import Convenio, ConvenioPlan, ExamType

fake = Faker("pt_BR")


class ConvenioFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Convenio

    name = factory.LazyAttribute(lambda _: f"Clínica {fake.company()}")
    cnpj = factory.LazyAttribute(lambda _: fake.cnpj())
    contact_email = factory.LazyAttribute(lambda _: fake.company_email())
    contact_phone = factory.LazyAttribute(lambda _: fake.phone_number())
    description = factory.LazyAttribute(lambda _: fake.text(max_nb_chars=200))
    address = factory.LazyAttribute(
        lambda _: {
            "street": fake.street_address(),
            "city": fake.city(),
            "state": fake.state_abbr(),
            "zip": fake.postcode(),
        }
    )
    subscription_plan = "starter"
    subscription_status = "active"
    is_active = True
    is_approved = True


class ConvenioPlanFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ConvenioPlan

    name = factory.Iterator(["Starter", "Professional", "Enterprise"])
    price = factory.Iterator([99.90, 199.90, 499.90])
    max_doctors = factory.Iterator([5, 20, 100])
    features = factory.LazyAttribute(lambda _: ["feature1", "feature2"])
    is_active = True


class ExamTypeFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ExamType

    convenio = factory.SubFactory(ConvenioFactory)
    name = factory.LazyAttribute(lambda _: fake.unique.word().capitalize())
    description = factory.LazyAttribute(lambda _: fake.sentence())
    preparation = "Jejum de 8 horas"
    duration_minutes = 30
    price = factory.LazyAttribute(lambda _: fake.pydecimal(left_digits=3, right_digits=2, positive=True))
    is_active = True
