from rest_framework import serializers

from apps.core.utils import validate_cnpj

from .models import Convenio, ConvenioPlan, ExamType


class ConvenioSerializer(serializers.ModelSerializer):
    def validate_cnpj(self, value):
        if not validate_cnpj(value):
            raise serializers.ValidationError("Invalid CNPJ.")
        existing_query = Convenio.objects.all()
        if self.instance is not None:
            existing_query = existing_query.exclude(id=self.instance.id)
        for convenio in existing_query.only("id", "cnpj"):
            if convenio.cnpj == value:
                raise serializers.ValidationError("CNPJ already exists.")
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
    revenue_comparison = serializers.FloatField()
    top_doctors = serializers.ListField(child=serializers.DictField(), required=False)
    appointments_by_status = serializers.DictField(child=serializers.IntegerField(), required=False)
    revenue_by_day = serializers.ListField(child=serializers.DictField(), required=False)


class RevenueByPeriodSerializer(serializers.Serializer):
    period = serializers.CharField()
    total = serializers.DecimalField(max_digits=12, decimal_places=2)
    count = serializers.IntegerField()


class FinancialReportSerializer(serializers.Serializer):
    total_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_refunds = serializers.DecimalField(max_digits=12, decimal_places=2)
    net_revenue = serializers.DecimalField(max_digits=12, decimal_places=2)
    transaction_count = serializers.IntegerField()
    average_ticket = serializers.DecimalField(max_digits=12, decimal_places=2)
    revenue_by_period = serializers.ListField(child=serializers.DictField())
    revenue_by_payment_method = serializers.ListField(child=serializers.DictField())
    top_services = serializers.ListField(child=serializers.DictField())


class ExportQuerySerializer(serializers.Serializer):
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    format = serializers.ChoiceField(choices=["csv", "json"], default="json")

    def validate(self, attrs):
        if attrs["start_date"] > attrs["end_date"]:
            raise serializers.ValidationError({"start_date": "start_date must be before end_date."})
        return attrs


class FinancialReportQuerySerializer(serializers.Serializer):
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    group_by = serializers.ChoiceField(choices=["day", "week", "month"], default="day")

    def validate(self, attrs):
        if attrs["start_date"] > attrs["end_date"]:
            raise serializers.ValidationError({"start_date": "start_date must be before end_date."})
        return attrs
