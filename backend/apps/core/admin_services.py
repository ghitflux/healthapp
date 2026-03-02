from __future__ import annotations

from datetime import date, timedelta
from decimal import Decimal
from typing import Any

from django.db.models import Count, Q, Sum
from django.db.models.functions import Coalesce, TruncDate
from django.utils import timezone

from apps.appointments.models import Appointment
from apps.convenios.models import Convenio
from apps.payments.models import Payment
from apps.users.models import CustomUser

ZERO_DECIMAL = Decimal("0.00")


class OwnerDashboardService:
    """Aggregations for owner admin panel."""

    @staticmethod
    def _month_window(reference_date: date) -> tuple[date, date]:
        month_start = reference_date.replace(day=1)
        if month_start.month == 12:
            next_month = month_start.replace(year=month_start.year + 1, month=1)
        else:
            next_month = month_start.replace(month=month_start.month + 1)
        return month_start, next_month

    @staticmethod
    def _growth(current: Decimal | int, previous: Decimal | int) -> float:
        current_decimal = Decimal(str(current))
        previous_decimal = Decimal(str(previous))
        if previous_decimal <= ZERO_DECIMAL:
            return 100.0 if current_decimal > ZERO_DECIMAL else 0.0
        return float(round(((current_decimal - previous_decimal) / previous_decimal) * Decimal("100"), 2))

    @classmethod
    def get_dashboard_data(cls) -> dict[str, Any]:
        today = timezone.localdate()
        month_start, next_month = cls._month_window(today)
        previous_month_end = month_start - timedelta(days=1)
        previous_month_start, previous_month_next = cls._month_window(previous_month_end)

        users_by_role = {
            item["role"]: item["count"] for item in CustomUser.objects.values("role").annotate(count=Count("id"))
        }

        current_appointments = Appointment.objects.filter(
            scheduled_date__gte=month_start,
            scheduled_date__lt=next_month,
        ).count()
        previous_appointments = Appointment.objects.filter(
            scheduled_date__gte=previous_month_start,
            scheduled_date__lt=previous_month_next,
        ).count()

        current_revenue = (
            Payment.objects.filter(
                status="completed",
                paid_at__date__gte=month_start,
                paid_at__date__lt=next_month,
            ).aggregate(total=Coalesce(Sum("amount"), ZERO_DECIMAL))["total"]
            or ZERO_DECIMAL
        )
        previous_revenue = (
            Payment.objects.filter(
                status="completed",
                paid_at__date__gte=previous_month_start,
                paid_at__date__lt=previous_month_next,
            ).aggregate(total=Coalesce(Sum("amount"), ZERO_DECIMAL))["total"]
            or ZERO_DECIMAL
        )

        successful_payments = Payment.objects.filter(status="completed").count()
        failed_payments = Payment.objects.filter(status="failed").count()
        successful_plus_failed = successful_payments + failed_payments
        payment_success_rate = (
            round((successful_payments / successful_plus_failed) * 100, 2) if successful_plus_failed else 0.0
        )

        completed_payment_qs = Payment.objects.filter(status="completed")
        completed_count = completed_payment_qs.count()
        average_ticket = (
            completed_payment_qs.aggregate(total=Coalesce(Sum("amount"), ZERO_DECIMAL))["total"] / completed_count
            if completed_count
            else ZERO_DECIMAL
        )

        top_convenios = (
            Convenio.objects.annotate(
                revenue=Coalesce(
                    Sum(
                        "appointments__payment__amount",
                        filter=Q(
                            appointments__payment__status="completed",
                            appointments__payment__paid_at__date__gte=month_start,
                            appointments__payment__paid_at__date__lt=next_month,
                        ),
                    ),
                    ZERO_DECIMAL,
                )
            )
            .order_by("-revenue", "name")[:5]
        )

        users_by_day = (
            CustomUser.objects.filter(date_joined__date__gte=month_start, date_joined__date__lt=next_month)
            .annotate(day=TruncDate("date_joined"))
            .values("day")
            .annotate(count=Count("id"))
            .order_by("day")
        )
        appointments_by_day = (
            Appointment.objects.filter(scheduled_date__gte=month_start, scheduled_date__lt=next_month)
            .values("scheduled_date")
            .annotate(count=Count("id"))
            .order_by("scheduled_date")
        )
        revenue_by_day = (
            Payment.objects.filter(status="completed", paid_at__date__gte=month_start, paid_at__date__lt=next_month)
            .annotate(day=TruncDate("paid_at"))
            .values("day")
            .annotate(total=Coalesce(Sum("amount"), ZERO_DECIMAL))
            .order_by("day")
        )

        return {
            "total_users": {
                "patients": users_by_role.get("patient", 0),
                "doctors": users_by_role.get("doctor", 0),
                "convenio_admins": users_by_role.get("convenio_admin", 0),
                "owners": users_by_role.get("owner", 0),
            },
            "total_convenios": {
                "active": Convenio.objects.filter(is_active=True).count(),
                "inactive": Convenio.objects.filter(is_active=False).count(),
                "pending_approval": Convenio.objects.filter(is_approved=False).count(),
            },
            "total_appointments": {
                "current_month": current_appointments,
                "previous_month": previous_appointments,
                "growth": cls._growth(current_appointments, previous_appointments),
            },
            "total_revenue": {
                "current_month": current_revenue,
                "previous_month": previous_revenue,
                "growth": cls._growth(current_revenue, previous_revenue),
            },
            "average_ticket": average_ticket,
            "payment_success_rate": payment_success_rate,
            "top_convenios": [
                {"id": str(convenio.id), "name": convenio.name, "revenue": str(convenio.revenue)}
                for convenio in top_convenios
            ],
            "users_by_day": [{"date": item["day"].isoformat(), "count": item["count"]} for item in users_by_day],
            "appointments_by_day": [
                {"date": item["scheduled_date"].isoformat(), "count": item["count"]} for item in appointments_by_day
            ],
            "revenue_by_day": [
                {"date": item["day"].isoformat(), "total": str(item["total"])} for item in revenue_by_day
            ],
        }

    @classmethod
    def get_convenio_metrics(cls, convenio: Convenio) -> dict[str, Any]:
        today = timezone.localdate()
        month_start, next_month = cls._month_window(today)

        appointments_month = Appointment.objects.filter(
            convenio=convenio,
            scheduled_date__gte=month_start,
            scheduled_date__lt=next_month,
        )
        revenue_month = (
            Payment.objects.filter(
                appointment__convenio=convenio,
                status="completed",
                paid_at__date__gte=month_start,
                paid_at__date__lt=next_month,
            ).aggregate(total=Coalesce(Sum("amount"), ZERO_DECIMAL))["total"]
            or ZERO_DECIMAL
        )
        return {
            "doctors_count": convenio.doctors.count(),
            "appointments_month": appointments_month.count(),
            "revenue_month": revenue_month,
            "cancelled_month": appointments_month.filter(status="cancelled").count(),
        }

    @classmethod
    def get_financial_report(cls) -> dict[str, Any]:
        completed = Payment.objects.filter(status="completed")
        refunded = Payment.objects.filter(status="refunded")

        total_revenue = completed.aggregate(total=Coalesce(Sum("amount"), ZERO_DECIMAL))["total"] or ZERO_DECIMAL
        total_completed_count = completed.count()
        total_refunded_count = refunded.count()

        revenue_by_convenio_rows = (
            Convenio.objects.annotate(
                total=Coalesce(
                    Sum(
                        "appointments__payment__amount",
                        filter=Q(appointments__payment__status="completed"),
                    ),
                    ZERO_DECIMAL,
                )
            )
            .values("id", "name", "total")
            .order_by("-total")
        )
        revenue_by_convenio = [
            {"convenio_id": str(row["id"]), "convenio_name": row["name"], "total": str(row["total"])}
            for row in revenue_by_convenio_rows
        ]

        method_rows = completed.values("payment_method").annotate(
            count=Count("id"),
            total=Coalesce(Sum("amount"), ZERO_DECIMAL),
        )
        payment_method_breakdown = []
        for row in method_rows:
            percentage = round((row["count"] / total_completed_count) * 100, 2) if total_completed_count else 0.0
            payment_method_breakdown.append(
                {
                    "payment_method": row["payment_method"],
                    "count": row["count"],
                    "total": str(row["total"]),
                    "percentage": percentage,
                }
            )

        total_processed = total_completed_count + total_refunded_count
        refund_rate = round((total_refunded_count / total_processed) * 100, 2) if total_processed else 0.0

        stripe_completed = completed.exclude(stripe_payment_intent_id="").count()
        internal_completed = total_completed_count
        reconciliation = {
            "internal_completed": internal_completed,
            "stripe_completed": stripe_completed,
            "difference": internal_completed - stripe_completed,
        }

        return {
            "total_revenue_platform": total_revenue,
            "revenue_by_convenio": revenue_by_convenio,
            "payment_method_breakdown": payment_method_breakdown,
            "refund_rate": refund_rate,
            "reconciliation": reconciliation,
        }
