"""Root conftest.py — shared fixtures for all tests."""
import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.convenios.tests.factories import ConvenioFactory
from apps.doctors.tests.factories import DoctorFactory, DoctorScheduleFactory
from apps.users.tests.factories import (
    ConvenioAdminFactory,
    DoctorUserFactory,
    OwnerFactory,
    PatientFactory,
    UserFactory,
)


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def patient_user(db):
    return PatientFactory(email_verified=True, phone_verified=True)


@pytest.fixture
def doctor_user(db):
    return DoctorUserFactory(email_verified=True)


@pytest.fixture
def convenio_admin_user(db, convenio):
    user = ConvenioAdminFactory(email_verified=True, convenio=convenio)
    return user


@pytest.fixture
def owner_user(db):
    return OwnerFactory(email_verified=True)


@pytest.fixture
def convenio(db):
    return ConvenioFactory()


@pytest.fixture
def doctor(db, convenio):
    doc_user = DoctorUserFactory(convenio=convenio)
    return DoctorFactory(user=doc_user, convenio=convenio)


@pytest.fixture
def authenticated_client(api_client):
    """Return a factory that authenticates a client with the given user."""

    def _auth(user):
        refresh = RefreshToken.for_user(user)
        api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
        return api_client

    return _auth


@pytest.fixture
def patient_client(api_client, patient_user):
    refresh = RefreshToken.for_user(patient_user)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
    return api_client


@pytest.fixture
def owner_client(api_client, owner_user):
    refresh = RefreshToken.for_user(owner_user)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
    return api_client


@pytest.fixture
def convenio_admin_client(api_client, convenio_admin_user):
    refresh = RefreshToken.for_user(convenio_admin_user)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
    return api_client
