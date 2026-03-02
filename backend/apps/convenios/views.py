import csv

from django.http import HttpResponse
from drf_spectacular.utils import OpenApiParameter, extend_schema, extend_schema_view
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.permissions import IsConvenioAdmin, IsOwner, IsOwnerOrConvenioAdmin

from .models import Convenio, ExamType
from .serializers import (
    ConvenioDashboardSerializer,
    ConvenioListSerializer,
    ConvenioSerializer,
    ExamTypeSerializer,
    ExportQuerySerializer,
    FinancialReportQuerySerializer,
    FinancialReportSerializer,
)
from .services import ConvenioDashboardService


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
        if self.action in ["dashboard"]:
            return [IsOwnerOrConvenioAdmin()]
        return [IsOwnerOrConvenioAdmin()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Convenio.objects.none()
        if user.role == "owner":
            return Convenio.objects.prefetch_related("exam_types", "doctors")
        if user.role == "convenio_admin" and user.convenio_id is not None:
            return Convenio.objects.filter(id=user.convenio_id).prefetch_related("exam_types", "doctors")
        return Convenio.objects.none()

    def get_serializer_class(self):
        if self.action == "list":
            return ConvenioListSerializer
        return ConvenioSerializer

    @extend_schema(
        operation_id="getConvenioDashboard",
        tags=["convenio"],
        summary="Get convenio dashboard KPIs",
        parameters=[
            OpenApiParameter(
                name="convenio_id",
                type=str,
                location=OpenApiParameter.QUERY,
                required=False,
                description="Convenio ID (required for owner role).",
            )
        ],
        responses={200: ConvenioDashboardSerializer},
    )
    @action(detail=False, methods=["get"], url_path="dashboard")
    def dashboard(self, request):
        convenio = resolve_target_convenio(request)
        data = ConvenioDashboardService.get_dashboard_data(convenio)
        return Response({"status": "success", "data": data})


def resolve_target_convenio(request) -> Convenio:
    user = request.user
    if user.role == "convenio_admin":
        if user.convenio is None:
            raise ValidationError({"detail": "Convenio admin without convenio."})
        return user.convenio

    convenio_id = request.query_params.get("convenio_id")
    if not convenio_id:
        raise ValidationError({"convenio_id": "convenio_id query parameter is required for owner users."})
    try:
        return Convenio.objects.get(id=convenio_id)
    except Convenio.DoesNotExist as exc:
        raise ValidationError({"convenio_id": "Convenio not found."}) from exc


class ConvenioFinancialReportView(APIView):
    permission_classes = [IsAuthenticated, IsOwnerOrConvenioAdmin]

    @extend_schema(
        operation_id="getConvenioFinancialReport",
        tags=["convenio"],
        summary="Get financial report for convenio",
        parameters=[
            FinancialReportQuerySerializer,
            OpenApiParameter(
                name="convenio_id",
                type=str,
                location=OpenApiParameter.QUERY,
                required=False,
                description="Convenio ID (required for owner role).",
            ),
        ],
        responses={200: FinancialReportSerializer},
    )
    def get(self, request):
        query_serializer = FinancialReportQuerySerializer(data=request.query_params)
        query_serializer.is_valid(raise_exception=True)
        convenio = resolve_target_convenio(request)
        report = ConvenioDashboardService.get_financial_report(
            convenio=convenio,
            start_date=query_serializer.validated_data["start_date"],
            end_date=query_serializer.validated_data["end_date"],
            group_by=query_serializer.validated_data["group_by"],
        )
        return Response({"status": "success", "data": report})


class ConvenioExportView(APIView):
    permission_classes = [IsAuthenticated, IsOwnerOrConvenioAdmin]

    @extend_schema(
        operation_id="exportConvenioAppointments",
        tags=["convenio"],
        summary="Export convenio appointments as CSV or JSON",
        parameters=[
            ExportQuerySerializer,
            OpenApiParameter(
                name="convenio_id",
                type=str,
                location=OpenApiParameter.QUERY,
                required=False,
                description="Convenio ID (required for owner role).",
            ),
        ],
        responses={200: dict},
    )
    def get(self, request):
        query_serializer = ExportQuerySerializer(data=request.query_params)
        query_serializer.is_valid(raise_exception=True)
        convenio = resolve_target_convenio(request)
        rows = ConvenioDashboardService.get_export_appointments(
            convenio=convenio,
            start_date=query_serializer.validated_data["start_date"],
            end_date=query_serializer.validated_data["end_date"],
        )

        if query_serializer.validated_data["format"] == "csv":
            response = HttpResponse(content_type="text/csv")
            response["Content-Disposition"] = 'attachment; filename="appointments_export.csv"'
            writer = csv.DictWriter(
                response,
                fieldnames=["date", "time", "patient_name", "doctor_name", "type", "status", "price", "payment_status"],
            )
            writer.writeheader()
            writer.writerows(rows)
            return response

        return Response({"status": "success", "data": rows})


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
