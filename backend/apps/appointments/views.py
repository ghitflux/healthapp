from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.exceptions import BusinessLogicError, ConflictError
from apps.core.permissions import IsOwnerOrConvenioAdmin, IsPatient
from apps.doctors.models import Doctor

from .models import Appointment, Rating
from .serializers import (
    AppointmentCancellationPolicySerializer,
    AppointmentCreateSerializer,
    AppointmentListSerializer,
    AppointmentReminderSerializer,
    AppointmentSerializer,
    CancelAppointmentSerializer,
    CompleteAppointmentSerializer,
    NoShowSerializer,
    RatingCreateSerializer,
    RatingSerializer,
)
from .services import BookingService


@extend_schema_view(
    list=extend_schema(operation_id="listAppointments", tags=["appointments"], summary="List user appointments"),
    retrieve=extend_schema(
        operation_id="getAppointmentById", tags=["appointments"], summary="Get appointment details"
    ),
    create=extend_schema(
        operation_id="createAppointment",
        tags=["appointments"],
        summary="Create appointment (with Redis lock) — patients only",
        request=AppointmentCreateSerializer,
        responses={201: AppointmentSerializer},
    ),
)
class AppointmentViewSet(viewsets.ModelViewSet):
    serializer_class = AppointmentSerializer
    http_method_names = ["get", "post"]

    def get_permissions(self):
        if self.action == "create":
            return [IsPatient()]
        if self.action in {"confirm", "no_show"}:
            return [IsOwnerOrConvenioAdmin()]
        if self.action == "rate":
            return [IsPatient()]
        if self.action in {"start", "complete"}:
            return [IsAuthenticated()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Appointment.objects.none()
        base_queryset = Appointment.objects.select_related(
            "patient",
            "doctor__user",
            "convenio",
            "exam_type",
            "payment",
        )
        if user.role == "owner":
            return base_queryset.all()
        if user.role == "convenio_admin" and user.convenio:
            return base_queryset.filter(convenio=user.convenio)
        if user.role == "doctor":
            return base_queryset.filter(doctor__user=user)
        # patient — sees only their own
        return base_queryset.filter(patient=user)

    def get_serializer_class(self):
        if self.action == "list":
            return AppointmentListSerializer
        if self.action == "create":
            return AppointmentCreateSerializer
        return AppointmentSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated_data = serializer.validated_data
        doctor = Doctor.objects.get(id=validated_data["doctor"].id)
        appointment = BookingService.create_appointment(request.user, doctor, validated_data)
        response_serializer = AppointmentSerializer(appointment)
        return Response({"status": "success", "data": response_serializer.data}, status=status.HTTP_201_CREATED)

    @extend_schema(
        operation_id="cancelAppointment",
        tags=["appointments"],
        summary="Cancel an appointment",
        request=CancelAppointmentSerializer,
        responses={200: AppointmentSerializer},
    )
    @action(detail=True, methods=["post"], url_path="cancel")
    def cancel(self, request, pk=None):
        appointment = self.get_object()
        serializer = CancelAppointmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        appointment = BookingService.cancel_appointment(
            appointment, request.user, serializer.validated_data.get("reason", "")
        )
        return Response({"status": "success", "data": AppointmentSerializer(appointment).data})

    @extend_schema(
        operation_id="confirmAppointment",
        tags=["appointments"],
        summary="Confirm an appointment (convenio)",
        responses={200: AppointmentSerializer},
    )
    @action(detail=True, methods=["post"], url_path="confirm", permission_classes=[IsOwnerOrConvenioAdmin])
    def confirm(self, request, pk=None):
        appointment = self.get_object()
        appointment = BookingService.confirm_appointment(appointment)
        return Response({"status": "success", "data": AppointmentSerializer(appointment).data})

    @extend_schema(
        operation_id="startAppointment",
        tags=["appointments"],
        summary="Start an appointment (confirmed -> in_progress)",
        request=None,
        responses={200: AppointmentSerializer},
    )
    @action(detail=True, methods=["post"], url_path="start")
    def start(self, request, pk=None):
        if request.user.role not in {"doctor", "convenio_admin"}:
            raise PermissionDenied("Only doctors and convenio admins can start appointments.")
        appointment = self.get_object()
        appointment = BookingService.start_appointment(appointment)
        return Response({"status": "success", "data": AppointmentSerializer(appointment).data})

    @extend_schema(
        operation_id="completeAppointment",
        tags=["appointments"],
        summary="Complete an appointment (in_progress -> completed)",
        request=CompleteAppointmentSerializer,
        responses={200: AppointmentSerializer},
    )
    @action(detail=True, methods=["post"], url_path="complete")
    def complete(self, request, pk=None):
        if request.user.role not in {"doctor", "convenio_admin"}:
            raise PermissionDenied("Only doctors and convenio admins can complete appointments.")
        serializer = CompleteAppointmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        appointment = self.get_object()
        appointment = BookingService.complete_appointment(appointment, serializer.validated_data.get("notes", ""))
        return Response({"status": "success", "data": AppointmentSerializer(appointment).data})

    @extend_schema(
        operation_id="markNoShow",
        tags=["appointments"],
        summary="Mark appointment as no-show",
        request=NoShowSerializer,
        responses={200: AppointmentSerializer},
    )
    @action(detail=True, methods=["post"], url_path="no-show")
    def no_show(self, request, pk=None):
        appointment = self.get_object()
        appointment = BookingService.mark_no_show(appointment)
        return Response({"status": "success", "data": AppointmentSerializer(appointment).data})

    @extend_schema(
        operation_id="getAppointmentCancellationPolicy",
        tags=["appointments"],
        summary="Get cancellation policy preview for appointment",
        responses={200: AppointmentCancellationPolicySerializer},
    )
    @action(detail=True, methods=["get"], url_path="cancellation-policy")
    def cancellation_policy(self, request, pk=None):
        appointment = self.get_object()
        if request.user.role == "patient" and appointment.patient_id != request.user.id:
            raise PermissionDenied("You can only view cancellation policy for your own appointments.")
        policy = BookingService.get_cancellation_policy(appointment, request.user)
        serializer = AppointmentCancellationPolicySerializer(policy)
        return Response({"status": "success", "data": serializer.data})

    @extend_schema(
        operation_id="getAppointmentReminders",
        tags=["appointments"],
        summary="Get reminder stages already sent for appointment",
        responses={200: AppointmentReminderSerializer(many=True)},
    )
    @action(detail=True, methods=["get"], url_path="reminders")
    def reminders(self, request, pk=None):
        appointment = self.get_object()
        reminders = [
            {"stage": stage, "sent_at": sent_at}
            for stage, sent_at in (appointment.reminder_stages_sent or {}).items()
        ]
        serializer = AppointmentReminderSerializer(reminders, many=True)
        return Response({"status": "success", "data": serializer.data})

    @extend_schema(
        operation_id="rateAppointment",
        tags=["appointments"],
        summary="Rate a completed appointment",
        request=RatingCreateSerializer,
        responses={201: RatingSerializer},
    )
    @action(detail=True, methods=["post"], url_path="rate")
    def rate(self, request, pk=None):
        appointment = self.get_object()
        if appointment.status != "completed":
            raise BusinessLogicError("Can only rate completed appointments.")
        if Rating.objects.filter(appointment=appointment).exists():
            raise ConflictError("This appointment has already been rated.")
        serializer = RatingCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        rating = Rating.objects.create(
            appointment=appointment,
            patient=request.user,
            doctor=appointment.doctor,
            **serializer.validated_data,
        )
        BookingService.update_doctor_rating(appointment.doctor)
        return Response(
            {"status": "success", "data": RatingSerializer(rating).data},
            status=status.HTTP_201_CREATED,
        )
