from rest_framework import serializers

from .models import Appointment, Rating


class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)
    doctor_name = serializers.CharField(source="doctor.user.full_name", read_only=True)
    convenio_name = serializers.CharField(source="convenio.name", read_only=True)

    class Meta:
        model = Appointment
        fields = [
            "id",
            "patient",
            "patient_name",
            "doctor",
            "doctor_name",
            "convenio",
            "convenio_name",
            "appointment_type",
            "exam_type",
            "scheduled_date",
            "scheduled_time",
            "duration_minutes",
            "status",
            "cancellation_reason",
            "notes",
            "price",
            "payment",
            "reminder_sent",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "cancellation_reason",
            "payment",
            "reminder_sent",
            "created_at",
            "updated_at",
        ]


class AppointmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = [
            "doctor",
            "appointment_type",
            "exam_type",
            "scheduled_date",
            "scheduled_time",
            "notes",
        ]


class AppointmentListSerializer(serializers.ModelSerializer):
    doctor_name = serializers.CharField(source="doctor.user.full_name", read_only=True)
    doctor_specialty = serializers.CharField(source="doctor.specialty", read_only=True)

    class Meta:
        model = Appointment
        fields = [
            "id",
            "doctor_name",
            "doctor_specialty",
            "appointment_type",
            "scheduled_date",
            "scheduled_time",
            "status",
            "price",
        ]


class CancelAppointmentSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True)


class RatingSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.full_name", read_only=True)

    class Meta:
        model = Rating
        fields = [
            "id",
            "appointment",
            "patient",
            "patient_name",
            "doctor",
            "score",
            "comment",
            "is_anonymous",
            "created_at",
        ]
        read_only_fields = ["id", "patient", "doctor", "created_at"]


class RatingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rating
        fields = ["score", "comment", "is_anonymous"]
