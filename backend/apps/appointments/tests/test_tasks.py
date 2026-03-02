from datetime import timedelta

import pytest
from django.utils import timezone

from apps.appointments.tasks import cleanup_expired_appointments
from apps.appointments.tests.factories import AppointmentFactory


@pytest.mark.django_db
class TestAppointmentTasks:
    def test_cleanup_expired_appointments(self):
        expired = AppointmentFactory(status="pending")
        recent = AppointmentFactory(status="pending")
        completed = AppointmentFactory(status="completed")

        cutoff = timezone.now() - timedelta(minutes=31)
        type(expired).objects.filter(id=expired.id).update(created_at=cutoff)
        type(completed).objects.filter(id=completed.id).update(created_at=cutoff)

        cleaned = cleanup_expired_appointments()

        assert cleaned == 1
        expired.refresh_from_db()
        recent.refresh_from_db()
        completed.refresh_from_db()

        assert expired.status == "cancelled"
        assert expired.cancellation_reason == "Payment timeout"
        assert recent.status == "pending"
        assert completed.status == "completed"
