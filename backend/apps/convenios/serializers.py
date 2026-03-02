from rest_framework import serializers

from apps.core.utils import validate_cnpj

from .models import Convenio, ConvenioPlan, ExamType


class ConvenioSerializer(serializers.ModelSerializer):
    def validate_cnpj(self, value):
        if not validate_cnpj(value):
            raise serializers.ValidationError("Invalid CNPJ.")
        return value

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
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "is_approved", "approved_at", "created_at", "updated_at"]


class ConvenioListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Convenio
        fields = ["id", "name", "logo_url", "contact_email", "subscription_plan", "is_active", "created_at"]


class ConvenioPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConvenioPlan
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]


class ExamTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamType
        fields = [
            "id",
            "convenio",
            "name",
            "description",
            "preparation",
            "duration_minutes",
            "price",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ConvenioDashboardSerializer(serializers.Serializer):
    total_doctors = serializers.IntegerField()
    total_appointments_month = serializers.IntegerField()
    total_revenue_month = serializers.DecimalField(max_digits=12, decimal_places=2)
    occupancy_rate = serializers.FloatField()
    cancellation_rate = serializers.FloatField()
