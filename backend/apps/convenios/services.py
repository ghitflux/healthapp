from __future__ import annotations

import calendar
import logging
from datetime import date, datetime, timedelta
from decimal import Decimal
from typing import Any

from django.core.cache import cache
from django.db.models import Count, F, Q, Sum
from django.db.models.functions import Coalesce, TruncDate, TruncMonth, TruncWeek
from django.utils import timezone

from apps.appointments.models import Appointment
from apps.doctors.models import Doctor, DoctorSchedule
from apps.payments.models import Payment

logger = logging.getLogger(__name__)

ZERO_DECIMAL = Decimal("0.00")


class ConvenioDashboardService:
    """Service for convenio dashboard and financial reporting KPIs."""

    DASHBOARD_CACHE_TTL = 60 * 10  # 10 minutes

    @staticmethod
    def _month_window(reference_date: date) -> tuple[date, date]:
        month_start = reference_date.replace(day=1)
        if month_start.month == 12:
            next_month = month_start.replace(year=month_start.year + 1, month=1)
        else:
            next_month = month_start.replace(month=month_start.month + 1)
        return month_start, next_month

    @staticmethod
    def _percentage_growth(current_value: Decimal, previous_value: Decimal) -> float:
        if previous_value <= ZERO_DECIMAL:
            return 100.0 if current_value > ZERO_DECIMAL else 0.0
        growth = ((current_value - previous_value) / previous_value) * Decimal("100")
        return float(round(growth, 2))

    @staticmethod
    def _weekday_occurrences_in_month(year: int, month: int, weekday: int) -> int:
        cal = calendar.Calendar()
        return sum(1 for day in cal.itermonthdates(year, month) if day.month == month and day.weekday() == weekday)

    @classmethod
    def _estimate_total_month_slots(cls, convenio, month_start: date) -> int:
        schedules = DoctorSchedule.objects.filter(
            doctor__convenio=convenio,
            doctor__is_available=True,
            is_active=True,
        ).values("weekday", "start_time", "end_time", "slot_duration")

        total_slots = 0
        for schedule in schedules:
            minutes = (
                datetime.combine(month_start, schedule["end_time"])
                - datetime.combine(month_start, schedule["start_time"])
            ).seconds // 60
            if schedule["slot_duration"] <= 0:
                continue
            slots_per_day = minutes // schedule["slot_duration"]
            occurrences = cls._weekday_occurrences_in_month(month_start.year, month_start.month, schedule["weekday"])
            total_slots += slots_per_day * occurrences
        return total_slots

    @classmethod
    def get_dashboard_data(cls, convenio) -> dict[str, Any]:
        """Compute dashboard metrics for a convenio with cache and aggregate queries."""
        today = timezone.localdate()
        month_start, next_month = cls._month_window(today)
        cache_key = f"convenio:dashboard:{convenio.id}:{month_start.isoformat()}"
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return cached_data

        month_appointments = Appointment.objects.filter(
            convenio=convenio,
            scheduled_date__gte=month_start,
            scheduled_date__lt=next_month,
        )
        total_appointments = month_appointments.count()
        cancelled_count = month_appointments.filter(status="cancelled").count()
        total_appointments_month = month_appointments.exclude(status="cancelled").count()
        confirmed_or_completed = month_appointments.filter(status__in=["confirmed", "completed"]).count()

        current_revenue = (
            Payment.objects.filter(
                appointment__convenio=convenio,
                status="completed",
                paid_at__date__gte=month_start,
                paid_at__date__lt=next_month,
            ).aggregate(total=Coalesce(Sum("amount"), ZERO_DECIMAL))["total"]
            or ZERO_DECIMAL
        )

        previous_month_last_day = month_start - timedelta(days=1)
        previous_month_start, previous_month_end = cls._month_window(previous_month_last_day)
        previous_revenue = (
            Payment.objects.filter(
                appointment__convenio=convenio,
                status="completed",
                paid_at__date__gte=previous_month_start,
                paid_at__date__lt=previous_month_end,
            ).aggregate(total=Coalesce(Sum("amount"), ZERO_DECIMAL))["total"]
            or ZERO_DECIMAL
        )

        total_slots = cls._estimate_total_month_slots(convenio, month_start)
        occupancy_rate = float(round((confirmed_or_completed / total_slots) * 100, 2)) if total_slots else 0.0
        cancellation_rate = float(round((cancelled_count / total_appointments) * 100, 2)) if total_appointments else 0.0

        top_doctors = (
            Doctor.objects.filter(convenio=convenio)
            .select_related("user")
            .annotate(
                apt_count=Count(
                    "appointments",
                    filter=Q(
                        appointments__scheduled_date__gte=month_start,
                        appointments__scheduled_date__lt=next_month,
                    ),
                )
            )
            .order_by("-apt_count", "user__full_name")[:5]
        )
        top_doctors_payload = [
            {
                "doctor_id": str(doctor.id),
                "doctor_name": doctor.user.full_name,
                "specialty": doctor.specialty,
                "appointments": doctor.apt_count,
            }
            for doctor in top_doctors
        ]

        appointments_by_status = {
            status: 0 for status in ["pending", "confirmed", "in_progress", "completed", "cancelled", "no_show"]
        }
        for item in month_appointments.values("status").annotate(count=Count("id")):
            appointments_by_status[item["status"]] = item["count"]

        revenue_by_day_rows = (
            Payment.objects.filter(
                appointment__convenio=convenio,
                status="completed",
                paid_at__date__gte=month_start,
                paid_at__date__lt=next_month,
            )
            .annotate(day=TruncDate("paid_at"))
            .values("day")
            .annotate(total=Coalesce(Sum("amount"), ZERO_DECIMAL))
            .order_by("day")
        )
        revenue_by_day = [{"date": row["day"].isoformat(), "total": str(row["total"])} for row in revenue_by_day_rows]

        payload = {
            "total_doctors": Doctor.objects.filter(convenio=convenio, is_available=True).count(),
            "total_appointments_month": total_appointments_month,
            "total_revenue_month": current_revenue,
            "occupancy_rate": occupancy_rate,
            "cancellation_rate": cancellation_rate,
            "revenue_comparison": cls._percentage_growth(current_revenue, previous_revenue),
            "top_doctors": top_doctors_payload,
            "appointments_by_status": appointments_by_status,
            "revenue_by_day": revenue_by_day,
        }
        cache.set(cache_key, payload, timeout=cls.DASHBOARD_CACHE_TTL)
        return payload

    @staticmethod
    def get_financial_report(convenio, start_date: date, end_date: date, group_by: str = "day") -> dict[str, Any]:
        payments = Payment.objects.filter(
            appointment__convenio=convenio,
            status="completed",
            paid_at__date__gte=start_date,
            paid_at__date__lte=end_date,
        )
        refunded_payments = Payment.objects.filter(
            appointment__convenio=convenio,
            status="refunded",
            refunded_at__date__gte=start_date,
            refunded_at__date__lte=end_date,
        )

        total_revenue = payments.aggregate(total=Coalesce(Sum("amount"), ZERO_DECIMAL))["total"] or ZERO_DECIMAL
        total_refunds = (
            refunded_payments.aggregate(total=Coalesce(Sum("refund_amount"), ZERO_DECIMAL))["total"] or ZERO_DECIMAL
        )
        net_revenue = total_revenue - total_refunds
        transaction_count = payments.count()
        average_ticket = (total_revenue / transaction_count) if transaction_count else ZERO_DECIMAL

        period_trunc_map = {
            "day": TruncDate("paid_at"),
            "week": TruncWeek("paid_at"),
            "month": TruncMonth("paid_at"),
        }
        truncated = period_trunc_map.get(group_by, TruncDate("paid_at"))

        revenue_by_period = (
            payments.annotate(period=truncated)
            .values("period")
            .annotate(total=Coalesce(Sum("amount"), ZERO_DECIMAL), count=Count("id"))
            .order_by("period")
        )
        revenue_by_period_payload = [
            {
                "period": row["period"].isoformat() if row["period"] else "",
                "total": str(row["total"]),
                "count": row["count"],
            }
            for row in revenue_by_period
        ]

        payment_methods = payments.values("payment_method").annotate(
            total=Coalesce(Sum("amount"), ZERO_DECIMAL),
            count=Count("id"),
        )
        revenue_by_payment_method = [
            {"payment_method": row["payment_method"], "total": str(row["total"]), "count": row["count"]}
            for row in payment_methods
        ]

        top_exam_types = (
            Appointment.objects.filter(
                convenio=convenio,
                status__in=["confirmed", "in_progress", "completed"],
                scheduled_date__gte=start_date,
                scheduled_date__lte=end_date,
                exam_type__isnull=False,
            )
            .values(service=F("exam_type__name"))
            .annotate(total_revenue=Coalesce(Sum("price"), ZERO_DECIMAL), total_count=Count("id"))
            .order_by("-total_revenue")[:5]
        )
        top_services = [
            {"service": row["service"], "total_revenue": str(row["total_revenue"]), "count": row["total_count"]}
            for row in top_exam_types
        ]

        return {
            "total_revenue": total_revenue,
            "total_refunds": total_refunds,
            "net_revenue": net_revenue,
            "transaction_count": transaction_count,
            "average_ticket": average_ticket,
            "revenue_by_period": revenue_by_period_payload,
            "revenue_by_payment_method": revenue_by_payment_method,
            "top_services": top_services,
        }

    @staticmethod
    def get_export_appointments(convenio, start_date: date, end_date: date) -> list[dict[str, str]]:
        appointments = (
            Appointment.objects.filter(
                convenio=convenio,
                scheduled_date__gte=start_date,
                scheduled_date__lte=end_date,
            )
            .select_related("patient", "doctor__user", "exam_type", "payment")
            .order_by("scheduled_date", "scheduled_time")
        )
        return [
            {
                "date": appointment.scheduled_date.isoformat(),
                "time": appointment.scheduled_time.strftime("%H:%M:%S"),
                "patient_name": appointment.patient.full_name,
                "doctor_name": appointment.doctor.user.full_name,
                "type": appointment.exam_type.name if appointment.exam_type else appointment.appointment_type,
                "status": appointment.status,
                "price": str(appointment.price),
                "payment_status": appointment.payment.status if appointment.payment else "unpaid",
            }
            for appointment in appointments
        ]
