import factory
from faker import Faker

from apps.users.models import CustomUser

fake = Faker("pt_BR")


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = CustomUser

    email = factory.LazyAttribute(lambda _: fake.unique.email())
    full_name = factory.LazyAttribute(lambda _: fake.name())
    phone = factory.Sequence(lambda n: f"+5511{90000000 + n:08d}")
    cpf = None  # Encrypted — skip by default in tests
    role = "patient"
    is_active = True
    email_verified = False
    phone_verified = False
    password = "TestPass123!"

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        password = kwargs.pop("password", "TestPass123!")
        return model_class.objects.create_user(password=password, **kwargs)


class PatientFactory(UserFactory):
    role = "patient"


class DoctorUserFactory(UserFactory):
    role = "doctor"


class ConvenioAdminFactory(UserFactory):
    role = "convenio_admin"


class OwnerFactory(UserFactory):
    role = "owner"
    is_staff = True
    is_superuser = True
    email_verified = True
