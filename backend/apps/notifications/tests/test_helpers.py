import pytest

from apps.appointments.tests.factories import AppointmentFactory
from apps.notifications.helpers import (
    notify_appointment_cancelled,
    notify_appointment_confirmed,
    notify_appointment_created,
    notify_payment_completed,
    notify_payment_refunded,
)
from apps.notifications.models import Notification
from apps.payments.tests.factories import CompletedPaymentFactory
from apps.users.tests.factories import PatientFactory


@pytest.mark.django_db
class TestNotificationHelpers:
    def test_notify_appointment_created(self, monkeypatch):
        appointment = AppointmentFactory()
        monkeypatch.setattr("apps.notifications.helpers.send_push_notification.delay", lambda *args, **kwargs: None)

        notify_appointment_created(appointment)

        assert Notification.objects.filter(user=appointment.patient, type="appointment").exists()
        assert Notification.objects.filter(user=appointment.doctor.user, type="appointment").exists()

    def test_notify_appointment_confirmed(self, monkeypatch):
        appointment = AppointmentFactory()
        monkeypatch.setattr("apps.notifications.helpers.send_push_notification.delay", lambda *args, **kwargs: None)
        monkeypatch.setattr("apps.notifications.helpers.send_email_notification.delay", lambda *args, **kwargs: None)

        notify_appointment_confirmed(appointment)

        assert Notification.objects.filter(user=appointment.patient, type="appointment").exists()

    def test_notify_appointment_cancelled(self, monkeypatch):
        appointment = AppointmentFactory()
        cancelled_by = PatientFactory()
        monkeypatch.setattr("apps.notifications.helpers.send_push_notification.delay", lambda *args, **kwargs: None)

        notify_appointment_cancelled(appointment, cancelled_by)

        assert Notification.objects.filter(user=appointment.doctor.user, type="appointment").exists()

    def test_notify_payment_completed(self, monkeypatch):
        payment = CompletedPaymentFactory()
        monkeypatch.setattr("apps.notifications.helpers.send_push_notification.delay", lambda *args, **kwargs: None)

        notify_payment_completed(payment)

        assert Notification.objects.filter(user=payment.user, type="payment").exists()

    def test_notify_payment_refunded(self, monkeypatch):
        payment = CompletedPaymentFactory()
        monkeypatch.setattr("apps.notifications.helpers.send_email_notification.delay", lambda *args, **kwargs: None)

        notify_payment_refunded(payment)

        assert Notification.objects.filter(user=payment.user, type="payment", channel="email").exists()
