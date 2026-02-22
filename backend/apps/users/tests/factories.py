import factory
from faker import Faker

from apps.users.models import CustomUser

fake = Faker("pt_BR")


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = CustomUser

    email = factory.LazyAttribute(lambda _: fake.unique.email())
    full_name = factory.LazyAttribute(lambda _: fake.name())
    phone = factory.LazyAttribute(lambda _: fake.unique.phone_number())
    role = "patient"
    is_active = True
    email_verified = False
    phone_verified = False

    @factory.lazy_attribute
    def password(self):
        return "TestPass123!"

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        password = kwargs.pop("password", "TestPass123!")
        user = model_class(**kwargs)
        user.set_password(password)
        user.save()
        return user


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
