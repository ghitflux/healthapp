import factory
from faker import Faker

from apps.payments.models import Payment
from apps.users.tests.factories import PatientFactory

fake = Faker("pt_BR")


class PaymentFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Payment

    user = factory.SubFactory(PatientFactory)
    amount = factory.LazyAttribute(
        lambda _: fake.pydecimal(left_digits=3, right_digits=2, positive=True, min_value=50, max_value=1000)
    )
    currency = "BRL"
    payment_method = factory.Iterator(["pix", "credit_card"])
    status = "pending"


class CompletedPaymentFactory(PaymentFactory):
    status = "completed"
    stripe_payment_intent_id = factory.LazyAttribute(lambda _: f"pi_{fake.hexify(text='^^^^^^^^^^^^^^^^')}")
