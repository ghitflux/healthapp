from __future__ import annotations

from auditlog.models import LogEntry
from rest_framework import serializers

from apps.convenios.models import Convenio
from apps.core.models import PlatformSettings
from apps.users.models import CustomUser


class OwnerDashboardSerializer(serializers.Serializer):
    total_users = serializers.DictField()
    total_convenios = serializers.DictField()
    total_appointments = serializers.DictField()
    total_revenue = serializers.DictField()
    average_ticket = serializers.DecimalField(max_digits=12, decimal_places=2)
    payment_success_rate = serializers.FloatField()
    top_convenios = serializers.ListField(child=serializers.DictField())
    users_by_day = serializers.ListField(child=serializers.DictField())
    appointments_by_day = serializers.ListField(child=serializers.DictField())
    revenue_by_day = serializers.ListField(child=serializers.DictField())


class AdminConvenioListSerializer(serializers.ModelSerializer):
    doctors_count = serializers.SerializerMethodField()

    def get_doctors_count(self, obj: Convenio) -> int:
        return obj.doctors.count()

    class Meta:
        model = Convenio
        fields = [
            "id",
            "name",
            "contact_email",
            "subscription_plan",
            "subscription_status",
            "is_active",
            "is_approved",
            "approved_at",
            "doctors_count",
            "created_at",
        ]


class AdminConvenioDetailSerializer(serializers.ModelSerializer):
    metrics = serializers.SerializerMethodField()

    def get_metrics(self, obj: Convenio) -> dict:
        del obj
        return self.context.get("metrics", {})

    class Meta:
        model = Convenio
        fields = [
            "id",
            "name",
            "cnpj",
            "logo_url",
            "description",
            "contact_email",
            "contact_phone",
            "address",
            "settings",
            "subscription_plan",
            "subscription_status",
            "is_active",
            "is_approved",
            "approved_at",
            "metrics",
            "created_at",
            "updated_at",
        ]


class AdminUserListSerializer(serializers.ModelSerializer):
    convenio_name = serializers.CharField(source="convenio.name", read_only=True)

    class Meta:
        model = CustomUser
        fields = [
            "id",
            "email",
            "full_name",
            "role",
            "is_active",
            "email_verified",
            "phone_verified",
            "convenio",
            "convenio_name",
            "date_joined",
        ]


class AuditLogSerializer(serializers.ModelSerializer):
    model_name = serializers.CharField(source="content_type.model", read_only=True)
    actor_email = serializers.SerializerMethodField()
    action_label = serializers.SerializerMethodField()

    class Meta:
        model = LogEntry
        fields = [
            "id",
            "model_name",
            "object_pk",
            "object_repr",
            "action",
            "action_label",
            "actor",
            "actor_email",
            "changes",
            "timestamp",
            "remote_addr",
        ]

    def get_actor_email(self, obj: LogEntry) -> str:
        return obj.actor.email if obj.actor else obj.actor_email or ""

    def get_action_label(self, obj: LogEntry) -> str:
        action_map = {choice[0]: choice[1] for choice in LogEntry.Action.choices}
        return action_map.get(obj.action, "unknown")


class OwnerFinancialReportSerializer(serializers.Serializer):
    total_revenue_platform = serializers.DecimalField(max_digits=14, decimal_places=2)
    revenue_by_convenio = serializers.ListField(child=serializers.DictField())
    payment_method_breakdown = serializers.ListField(child=serializers.DictField())
    refund_rate = serializers.FloatField()
    reconciliation = serializers.DictField()


class PlatformSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformSettings
        fields = [
            "id",
            "platform_fee_percentage",
            "max_advance_booking_days",
            "min_cancellation_hours",
            "cancellation_fee_percentage",
            "appointment_lock_ttl_minutes",
            "payment_timeout_minutes",
            "max_appointments_per_day_patient",
            "pix_enabled",
            "credit_card_enabled",
            "maintenance_mode",
            "maintenance_message",
            "updated_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "updated_by", "created_at", "updated_at"]


class UpdatePlatformSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformSettings
        fields = [
            "platform_fee_percentage",
            "max_advance_booking_days",
            "min_cancellation_hours",
            "cancellation_fee_percentage",
            "appointment_lock_ttl_minutes",
            "payment_timeout_minutes",
            "max_appointments_per_day_patient",
            "pix_enabled",
            "credit_card_enabled",
            "maintenance_mode",
            "maintenance_message",
        ]
