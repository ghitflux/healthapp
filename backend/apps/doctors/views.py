from datetime import date

from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.core.permissions import IsConvenioAdmin, IsOwnerOrConvenioAdmin

from .filters import DoctorFilter
from .models import Doctor, DoctorSchedule, ScheduleException
from .serializers import (
    AvailableSlotSerializer,
    DoctorListSerializer,
    DoctorScheduleSerializer,
    DoctorSerializer,
    ScheduleExceptionSerializer,
)
from .services import AvailabilityService


@extend_schema_view(
    list=extend_schema(
        operation_id="listDoctors",
        tags=["doctors"],
        summary="List doctors with filters",
        parameters=[
            OpenApiParameter(name="specialty", type=str, description="Filter by specialty"),
            OpenApiParameter(name="convenio", type=str, description="Filter by convenio ID"),
            OpenApiParameter(name="name", type=str, description="Search by doctor name"),
        ],
    ),
    retrieve=extend_schema(operation_id="getDoctorById", tags=["doctors"], summary="Get doctor details"),
    create=extend_schema(operation_id="createDoctor", tags=["doctors"], summary="Create doctor"),
    partial_update=extend_schema(operation_id="patchDoctor", tags=["doctors"], summary="Update doctor"),
    destroy=extend_schema(operation_id="deleteDoctor", tags=["doctors"], summary="Delete doctor"),
)
class DoctorViewSet(viewsets.ModelViewSet):
    serializer_class = DoctorSerializer
    filterset_class = DoctorFilter
    search_fields = ["user__full_name", "specialty", "bio"]
    ordering_fields = ["rating", "consultation_price", "created_at"]
    http_method_names = ["get", "post", "patch", "delete"]

    def get_permissions(self):
        if self.action in ["list", "retrieve", "slots", "search"]:
            return [AllowAny()]
        return [IsOwnerOrConvenioAdmin()]

    def get_queryset(self):
        return Doctor.objects.select_related("user", "convenio").filter(is_available=True)

    def get_serializer_class(self):
        if self.action == "list":
            return DoctorListSerializer
        return DoctorSerializer

    @extend_schema(
        operation_id="getDoctorSlots",
        tags=["doctors"],
        summary="Get available slots for a doctor on a specific date",
        parameters=[
            OpenApiParameter(name="date", type=str, description="Date in YYYY-MM-DD format", required=True),
        ],
        responses={200: AvailableSlotSerializer(many=True)},
    )
    @action(detail=True, methods=["get"], url_path="slots")
    def slots(self, request, pk=None):
        doctor = self.get_object()
        date_str = request.query_params.get("date")
        if not date_str:
            return Response(
                {"status": "error", "errors": [{"detail": "date parameter is required"}]},
                status=400,
            )
        try:
            selected_date = date.fromisoformat(date_str)
        except ValueError:
            return Response(
                {"status": "error", "errors": [{"detail": "Invalid date format. Use YYYY-MM-DD"}]},
                status=400,
            )

        slots = AvailabilityService.get_available_slots(doctor, selected_date)
        return Response({"status": "success", "data": slots})


@extend_schema_view(
    list=extend_schema(operation_id="listDoctorSchedules", tags=["convenio"], summary="List doctor schedules"),
    retrieve=extend_schema(
        operation_id="getDoctorScheduleById", tags=["convenio"], summary="Get doctor schedule details"
    ),
    create=extend_schema(operation_id="createDoctorSchedule", tags=["convenio"], summary="Create doctor schedule"),
    partial_update=extend_schema(
        operation_id="patchDoctorSchedule", tags=["convenio"], summary="Update doctor schedule"
    ),
    destroy=extend_schema(
        operation_id="deleteDoctorSchedule", tags=["convenio"], summary="Delete doctor schedule"
    ),
)
class DoctorScheduleViewSet(viewsets.ModelViewSet):
    serializer_class = DoctorScheduleSerializer
    permission_classes = [IsAuthenticated, IsConvenioAdmin]
    http_method_names = ["get", "post", "patch", "delete"]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return DoctorSchedule.objects.none()
        if user.convenio:
            return DoctorSchedule.objects.filter(doctor__convenio=user.convenio)
        return DoctorSchedule.objects.none()


@extend_schema_view(
    list=extend_schema(
        operation_id="listScheduleExceptions", tags=["convenio"], summary="List schedule exceptions"
    ),
    retrieve=extend_schema(
        operation_id="getScheduleExceptionById",
        tags=["convenio"],
        summary="Get schedule exception details",
    ),
    create=extend_schema(
        operation_id="createScheduleException", tags=["convenio"], summary="Create schedule exception"
    ),
    destroy=extend_schema(
        operation_id="deleteScheduleException", tags=["convenio"], summary="Delete schedule exception"
    ),
)
class ScheduleExceptionViewSet(viewsets.ModelViewSet):
    serializer_class = ScheduleExceptionSerializer
    permission_classes = [IsAuthenticated, IsConvenioAdmin]
    http_method_names = ["get", "post", "delete"]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return ScheduleException.objects.none()
        if user.convenio:
            return ScheduleException.objects.filter(doctor__convenio=user.convenio)
        return ScheduleException.objects.none()
