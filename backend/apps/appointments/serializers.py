from django.utils import timezone
from rest_framework import serializers

from apps.doctors.models import DoctorSchedule

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

    def validate_scheduled_date(self, value):
        if value < timezone.localdate():
            raise serializers.ValidationError("Scheduled date cannot be in the past.")
        return value

    def validate(self, attrs):
        doctor = attrs.get("doctor")
        scheduled_date = attrs.get("scheduled_date")
        scheduled_time = attrs.get("scheduled_time")
        exam_type = attrs.get("exam_type")

        if not doctor or not scheduled_date or not scheduled_time:
            return attrs

        has_schedule = DoctorSchedule.objects.filter(
            doctor=doctor,
            weekday=scheduled_date.weekday(),
            is_active=True,
            start_time__lte=scheduled_time,
            end_time__gt=scheduled_time,
        ).exists()
        if not has_schedule:
            raise serializers.ValidationError(
                {"scheduled_time": "Scheduled time is outside doctor's available hours."}
            )

        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            patient_has_conflict = (
                Appointment.objects.filter(
                    patient=request.user,
                    scheduled_date=scheduled_date,
                    scheduled_time=scheduled_time,
                )
                .exclude(status="cancelled")
                .exists()
            )
            if patient_has_conflict:
                raise serializers.ValidationError(
                    {"scheduled_time": "You already have an appointment at this time."}
                )

        if exam_type and exam_type.convenio_id != doctor.convenio_id:
            raise serializers.ValidationError(
                {"exam_type": "Exam type does not belong to the doctor's convenio."}
            )

        return attrs


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
