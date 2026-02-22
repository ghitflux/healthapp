import pytest

from .factories import DoctorFactory, DoctorScheduleFactory, ScheduleExceptionFactory


@pytest.mark.django_db
class TestDoctor:
    def test_create_doctor(self):
        doctor = DoctorFactory()
        assert doctor.pk is not None
        assert doctor.user is not None
        assert doctor.convenio is not None
        assert doctor.crm

    def test_str_representation(self):
        doctor = DoctorFactory()
        assert "Dr." in str(doctor)
        assert doctor.specialty in str(doctor)

    def test_default_consultation_duration(self):
        doctor = DoctorFactory()
        assert doctor.consultation_duration == 30

    def test_default_rating(self):
        doctor = DoctorFactory()
        assert doctor.rating == 0
        assert doctor.total_ratings == 0


@pytest.mark.django_db
class TestDoctorSchedule:
    def test_create_schedule(self):
        schedule = DoctorScheduleFactory()
        assert schedule.pk is not None
        assert 0 <= schedule.weekday <= 6

    def test_str_representation(self):
        schedule = DoctorScheduleFactory(weekday=0)
        assert "Mon" in str(schedule)


@pytest.mark.django_db
class TestScheduleException:
    def test_create_exception(self):
        exc = ScheduleExceptionFactory()
        assert exc.pk is not None
        assert exc.is_full_day is True
        assert exc.is_available is False

    def test_str_representation(self):
        exc = ScheduleExceptionFactory()
        assert "Blocked" in str(exc)
