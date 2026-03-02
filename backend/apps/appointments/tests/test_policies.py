from datetime import timedelta
from decimal import Decimal

import pytest
from django.utils import timezone

from apps.appointments.policies import CancellationPolicy, RefundCalculator
from apps.appointments.tests.factories import AppointmentFactory
from apps.core.models import PlatformSettings
from apps.payments.tests.factories import CompletedPaymentFactory


@pytest.mark.django_db
class TestCancellationPolicy:
    def test_free_cancellation_before_deadline(self):
        appointment = AppointmentFactory(status="confirmed")
        appointment.scheduled_date = timezone.localdate() + timedelta(days=3)
        appointment.save(update_fields=["scheduled_date", "updated_at"])

        result = CancellationPolicy.check_cancellation(appointment)

        assert result.allowed is True
        assert result.fee_amount == Decimal("0.00")

    def test_late_cancellation_fee_applied(self):
        settings_obj = PlatformSettings.load()
        settings_obj.min_cancellation_hours = 24
        settings_obj.cancellation_fee_percentage = Decimal("20.00")
        settings_obj.save()

        appointment = AppointmentFactory(status="confirmed")
        appointment.scheduled_date = timezone.localdate()
        appointment.scheduled_time = (timezone.localtime() + timedelta(hours=2)).time().replace(second=0, microsecond=0)
        appointment.save(update_fields=["scheduled_date", "scheduled_time", "updated_at"])

        result = CancellationPolicy.check_cancellation(appointment)

        assert result.allowed is True
        assert result.fee_amount > Decimal("0.00")

    def test_in_progress_is_full_fee(self):
        appointment = AppointmentFactory(status="in_progress", price=Decimal("150.00"))

        result = CancellationPolicy.check_cancellation(appointment)

        assert result.allowed is True
        assert result.fee_amount == Decimal("150.00")

    def test_refund_calculator(self):
        payment = CompletedPaymentFactory(amount=Decimal("200.00"))
        appointment = AppointmentFactory(status="confirmed", price=Decimal("200.00"), payment=payment)

        result = CancellationPolicy.check_cancellation(appointment)
        refund_amount = RefundCalculator.calculate_refund(payment, result)

        assert refund_amount <= Decimal("200.00")
