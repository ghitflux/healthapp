import pytest

from .factories import AppointmentFactory, CompletedAppointmentFactory, RatingFactory


@pytest.mark.django_db
class TestAppointment:
    def test_create_appointment(self):
        apt = AppointmentFactory()
        assert apt.pk is not None
        assert apt.status == "pending"
        assert apt.patient is not None
        assert apt.doctor is not None

    def test_str_representation(self):
        apt = AppointmentFactory()
        assert str(apt.scheduled_date) in str(apt)

    def test_default_status_pending(self):
        apt = AppointmentFactory()
        assert apt.status == "pending"

    def test_completed_appointment(self):
        apt = CompletedAppointmentFactory()
        assert apt.status == "completed"


@pytest.mark.django_db
class TestRating:
    def test_create_rating(self):
        rating = RatingFactory()
        assert rating.pk is not None
        assert 1 <= rating.score <= 5
        assert rating.appointment.status == "completed"

    def test_str_representation(self):
        rating = RatingFactory(score=5)
        assert "5/5" in str(rating)
