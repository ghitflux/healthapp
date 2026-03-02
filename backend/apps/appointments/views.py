from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.core.permissions import IsOwnerOrConvenioAdmin, IsPatient

from .models import Appointment, Rating
from .serializers import (
    AppointmentCreateSerializer,
    AppointmentListSerializer,
    AppointmentSerializer,
    CancelAppointmentSerializer,
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
        if self.action == "confirm":
            return [IsOwnerOrConvenioAdmin()]
        if self.action == "rate":
            return [IsPatient()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Appointment.objects.none()
        if user.role == "owner":
            return Appointment.objects.all().select_related("patient", "doctor__user", "convenio")
        if user.role == "convenio_admin" and user.convenio:
            return Appointment.objects.filter(convenio=user.convenio).select_related(
                "patient", "doctor__user", "convenio"
            )
        if user.role == "doctor":
            return Appointment.objects.filter(doctor__user=user).select_related(
                "patient", "doctor__user", "convenio"
            )
        # patient — sees only their own
        return Appointment.objects.filter(patient=user).select_related("patient", "doctor__user", "convenio")

    def get_serializer_class(self):
        if self.action == "list":
            return AppointmentListSerializer
        if self.action == "create":
            return AppointmentCreateSerializer
        return AppointmentSerializer

    def perform_create(self, serializer):
        from apps.doctors.models import Doctor

        data = serializer.validated_data
        doctor = Doctor.objects.get(id=data["doctor"].id)
        BookingService.create_appointment(self.request.user, doctor, data)

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
            return Response(
                {"status": "error", "errors": [{"detail": "Can only rate completed appointments."}]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = RatingCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        rating = Rating.objects.create(
            appointment=appointment,
            patient=request.user,
            doctor=appointment.doctor,
            **serializer.validated_data,
        )
        return Response(
            {"status": "success", "data": RatingSerializer(rating).data},
            status=status.HTTP_201_CREATED,
        )
