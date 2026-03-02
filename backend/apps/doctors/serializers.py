from rest_framework import serializers

from apps.core.utils import validate_crm, validate_uf

from .models import Doctor, DoctorSchedule, ScheduleException


class DoctorSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.full_name", read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)
    convenio_name = serializers.CharField(source="convenio.name", read_only=True)

    def validate_crm(self, value):
        if not validate_crm(value):
            raise serializers.ValidationError("CRM must contain 4 to 10 numeric digits.")
        return value

    def validate_crm_state(self, value):
        if not validate_uf(value):
            raise serializers.ValidationError("Invalid Brazilian state (UF).")
        return value.upper()

    def validate_consultation_duration(self, value):
        if value < 15:
            raise serializers.ValidationError("Minimum consultation duration is 15 minutes.")
        if value > 120:
            raise serializers.ValidationError("Maximum consultation duration is 120 minutes.")
        return value

    class Meta:
        model = Doctor
        fields = [
            "id",
            "user",
            "user_name",
            "user_email",
            "convenio",
            "convenio_name",
            "crm",
            "crm_state",
            "specialty",
            "subspecialties",
            "bio",
            "consultation_duration",
            "consultation_price",
            "rating",
            "total_ratings",
            "is_available",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "rating", "total_ratings", "created_at", "updated_at"]


class DoctorListSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.full_name", read_only=True)
    avatar_url = serializers.CharField(source="user.avatar_url", read_only=True)
    convenio_name = serializers.CharField(source="convenio.name", read_only=True)

    class Meta:
        model = Doctor
        fields = [
            "id",
            "user_name",
            "avatar_url",
            "specialty",
            "convenio_name",
            "consultation_price",
            "rating",
            "total_ratings",
            "is_available",
        ]


class DoctorScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = DoctorSchedule
        fields = [
            "id",
            "doctor",
            "weekday",
            "start_time",
            "end_time",
            "slot_duration",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class ScheduleExceptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScheduleException
        fields = [
            "id",
            "doctor",
            "date",
            "start_time",
            "end_time",
            "is_full_day",
            "is_available",
            "reason",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class AvailableSlotSerializer(serializers.Serializer):
    time = serializers.TimeField()
    duration_minutes = serializers.IntegerField()
    is_available = serializers.BooleanField()
