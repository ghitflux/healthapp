from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response

from apps.core.permissions import IsConvenioAdmin, IsOwner, IsOwnerOrConvenioAdmin

from .models import Convenio, ExamType
from .serializers import (
    ConvenioDashboardSerializer,
    ConvenioListSerializer,
    ConvenioSerializer,
    ExamTypeSerializer,
)


@extend_schema_view(
    list=extend_schema(operation_id="listConvenios", tags=["convenio"], summary="List all convenios"),
    retrieve=extend_schema(operation_id="getConvenioById", tags=["convenio"], summary="Get convenio details"),
    create=extend_schema(operation_id="createConvenio", tags=["owner"], summary="Create a new convenio"),
    partial_update=extend_schema(
        operation_id="patchConvenioSettings", tags=["convenio"], summary="Update convenio settings"
    ),
    destroy=extend_schema(operation_id="deleteConvenio", tags=["owner"], summary="Delete convenio"),
)
class ConvenioViewSet(viewsets.ModelViewSet):
    serializer_class = ConvenioSerializer
    http_method_names = ["get", "post", "patch", "delete"]

    def get_permissions(self):
        if self.action in ["create", "destroy"]:
            return [IsOwner()]
        return [IsOwnerOrConvenioAdmin()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Convenio.objects.none()
        if user.role == "owner":
            return Convenio.objects.all()
        if user.role == "convenio_admin" and user.convenio_id is not None:
            return Convenio.objects.filter(id=user.convenio_id)
        return Convenio.objects.none()

    def get_serializer_class(self):
        if self.action == "list":
            return ConvenioListSerializer
        return ConvenioSerializer

    @extend_schema(
        operation_id="getConvenioDashboard",
        tags=["convenio"],
        summary="Get convenio dashboard KPIs",
        responses={200: ConvenioDashboardSerializer},
    )
    @action(detail=False, methods=["get"], url_path="dashboard")
    def dashboard(self, request):
        # TODO: Implement real dashboard data from ConvenioDashboardService
        data = {
            "total_doctors": 0,
            "total_appointments_month": 0,
            "total_revenue_month": 0,
            "occupancy_rate": 0.0,
            "cancellation_rate": 0.0,
        }
        return Response({"status": "success", "data": data})


@extend_schema_view(
    list=extend_schema(operation_id="listExamTypes", tags=["convenio"], summary="List exam types"),
    retrieve=extend_schema(operation_id="getExamTypeById", tags=["convenio"], summary="Get exam type details"),
    create=extend_schema(operation_id="createExamType", tags=["convenio"], summary="Create exam type"),
    partial_update=extend_schema(operation_id="patchExamType", tags=["convenio"], summary="Update exam type"),
    destroy=extend_schema(operation_id="deleteExamType", tags=["convenio"], summary="Delete exam type"),
)
class ExamTypeViewSet(viewsets.ModelViewSet):
    serializer_class = ExamTypeSerializer
    permission_classes = [IsConvenioAdmin]
    http_method_names = ["get", "post", "patch", "delete"]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return ExamType.objects.none()
        if user.convenio:
            return ExamType.objects.filter(convenio=user.convenio)
        return ExamType.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if not user.is_authenticated or user.convenio is None:
            raise PermissionDenied("Convenio admin without convenio cannot create exam types.")
        serializer.save(convenio=user.convenio)
