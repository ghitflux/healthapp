import factory
from faker import Faker

from apps.notifications.models import Notification
from apps.users.tests.factories import PatientFactory

fake = Faker("pt_BR")


class NotificationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Notification

    user = factory.SubFactory(PatientFactory)
    type = factory.Iterator(["appointment", "payment", "system", "reminder"])
    title = factory.LazyAttribute(lambda _: fake.sentence(nb_words=5))
    body = factory.LazyAttribute(lambda _: fake.text(max_nb_chars=200))
    channel = "push"
    is_read = False
