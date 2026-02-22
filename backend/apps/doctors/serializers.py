from rest_framework import serializers

from .models import Doctor, DoctorSchedule, ScheduleException


class DoctorSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source="user.full_name", read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)
    convenio_name = serializers.CharField(source="convenio.name", read_only=True)

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
