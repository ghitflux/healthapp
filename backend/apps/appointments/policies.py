from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, time, timedelta
from decimal import Decimal

from django.utils import timezone

from apps.core.services import PlatformSettingsService


@dataclass
class CancellationResult:
    allowed: bool
    fee_amount: Decimal
    reason: str
    deadline: datetime | None


class CancellationPolicy:
    @staticmethod
    def _normalize_time(value) -> time:
        if isinstance(value, time):
            return value
        if isinstance(value, str):
            try:
                return time.fromisoformat(value)
            except ValueError:
                pass
        raise ValueError("Invalid scheduled_time value for appointment.")

    @staticmethod
    def _appointment_datetime(appointment) -> datetime:
        scheduled_time = CancellationPolicy._normalize_time(appointment.scheduled_time)
        return timezone.make_aware(
            datetime.combine(appointment.scheduled_date, scheduled_time),
            timezone.get_current_timezone(),
        )

    @classmethod
    def check_cancellation(cls, appointment, user=None) -> CancellationResult:
        del user
        now = timezone.now()
        if appointment.status in {"completed", "cancelled", "no_show"}:
            return CancellationResult(
                allowed=False,
                fee_amount=Decimal("0.00"),
                reason="Appointment cannot be cancelled in current status.",
                deadline=None,
            )

        settings_obj = PlatformSettingsService.get_settings()
        appointment_datetime = cls._appointment_datetime(appointment)
        deadline = appointment_datetime - timedelta(hours=settings_obj.min_cancellation_hours)

        if appointment.status == "in_progress":
            return CancellationResult(
                allowed=True,
                fee_amount=appointment.price,
                reason="Appointment already in progress. Full cancellation fee applies.",
                deadline=deadline,
            )

        if now <= deadline:
            return CancellationResult(
                allowed=True,
                fee_amount=Decimal("0.00"),
                reason="Free cancellation window.",
                deadline=deadline,
            )

        fee_percentage = Decimal(str(settings_obj.cancellation_fee_percentage)) / Decimal("100")
        fee_amount = (appointment.price * fee_percentage).quantize(Decimal("0.01"))
        return CancellationResult(
            allowed=True,
            fee_amount=fee_amount,
            reason="Late cancellation fee applied.",
            deadline=deadline,
        )


class RefundCalculator:
    @staticmethod
    def calculate_refund(payment, cancellation_result: CancellationResult) -> Decimal:
        if not payment:
            return Decimal("0.00")
        refund = (payment.amount - cancellation_result.fee_amount).quantize(Decimal("0.01"))
        if refund <= Decimal("0.00"):
            return Decimal("0.00")
        return refund
