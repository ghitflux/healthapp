import pytest
from django.core.management import call_command

from apps.appointments.models import Appointment, Rating
from apps.convenios.models import Convenio, ConvenioPlan, ExamType
from apps.doctors.models import Doctor
from apps.notifications.models import Notification
from apps.payments.models import Payment
from apps.users.models import CustomUser


@pytest.mark.django_db
class TestSeedDataCommand:
    def test_seed_data_creates_expected_records(self):
        call_command("seed_data")

        assert CustomUser.objects.filter(role="owner", email="owner@healthapp.com.br").exists()
        assert ConvenioPlan.objects.count() >= 3
        assert Convenio.objects.count() >= 2
        assert ExamType.objects.count() >= 10
        assert Doctor.objects.count() >= 6
        assert CustomUser.objects.filter(role="patient").count() >= 10
        assert Appointment.objects.count() >= 20
        assert Payment.objects.count() >= 1
        assert Rating.objects.count() >= 1
        assert Notification.objects.count() >= 30
