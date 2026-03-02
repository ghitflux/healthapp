from __future__ import annotations

from datetime import datetime

from auditlog.models import LogEntry
from django.shortcuts import get_object_or_404
from django.utils import timezone
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.convenios.models import Convenio
from apps.users.models import CustomUser

from .admin_serializers import (
    AdminConvenioDetailSerializer,
    AdminConvenioListSerializer,
    AdminUserListSerializer,
    AuditLogSerializer,
    OwnerDashboardSerializer,
    OwnerFinancialReportSerializer,
)
from .admin_services import OwnerDashboardService
from .permissions import IsOwner


class OwnerDashboardView(APIView):
    permission_classes = [IsAuthenticated, IsOwner]

    @extend_schema(
        operation_id="getOwnerDashboard",
        tags=["owner"],
        summary="Get global owner dashboard KPIs",
        responses={200: OwnerDashboardSerializer},
    )
    def get(self, request):
        data = OwnerDashboardService.get_dashboard_data()
        return Response({"status": "success", "data": data})


class OwnerConvenioListView(ListAPIView):
    permission_classes = [IsAuthenticated, IsOwner]
    serializer_class = AdminConvenioListSerializer
    queryset = Convenio.objects.prefetch_related("doctors").order_by("name")

    @extend_schema(
        operation_id="listAdminConvenios",
        tags=["owner"],
        summary="List convenios for owner admin panel",
        parameters=[
            OpenApiParameter(name="name", type=str, required=False),
            OpenApiParameter(name="subscription_plan", type=str, required=False),
            OpenApiParameter(name="is_active", type=bool, required=False),
            OpenApiParameter(name="is_approved", type=bool, required=False),
        ],
        responses={200: AdminConvenioListSerializer(many=True)},
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        queryset = super().get_queryset()
        params = self.request.query_params
        if params.get("name"):
            queryset = queryset.filter(name__icontains=params["name"])
        if params.get("subscription_plan"):
            queryset = queryset.filter(subscription_plan=params["subscription_plan"])
        if params.get("is_active") in {"true", "false"}:
            queryset = queryset.filter(is_active=params["is_active"] == "true")
        if params.get("is_approved") in {"true", "false"}:
            queryset = queryset.filter(is_approved=params["is_approved"] == "true")
        return queryset


class OwnerConvenioDetailView(RetrieveAPIView):
    permission_classes = [IsAuthenticated, IsOwner]
    serializer_class = AdminConvenioDetailSerializer
    queryset = Convenio.objects.prefetch_related("doctors", "exam_types").all()

    @extend_schema(
        operation_id="getAdminConvenioById",
        tags=["owner"],
        summary="Get convenio details and metrics",
        responses={200: AdminConvenioDetailSerializer},
    )
    def get(self, request, *args, **kwargs):
        return self.retrieve(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        convenio = self.get_object()
        metrics = OwnerDashboardService.get_convenio_metrics(convenio)
        serializer = self.get_serializer(convenio, context={**self.get_serializer_context(), "metrics": metrics})
        return Response({"status": "success", "data": serializer.data})


class OwnerConvenioSuspendView(APIView):
    permission_classes = [IsAuthenticated, IsOwner]

    @extend_schema(
        operation_id="suspendConvenio",
        tags=["owner"],
        summary="Suspend a convenio",
        request=None,
        responses={200: dict},
    )
    def post(self, request, pk):
        convenio = get_object_or_404(Convenio, id=pk)
        convenio.is_active = False
        convenio.save(update_fields=["is_active", "updated_at"])
        return Response({"status": "success", "data": {"id": str(convenio.id), "is_active": convenio.is_active}})


class OwnerConvenioApproveView(APIView):
    permission_classes = [IsAuthenticated, IsOwner]

    @extend_schema(
        operation_id="approveConvenio",
        tags=["owner"],
        summary="Approve a convenio",
        request=None,
        responses={200: dict},
    )
    def post(self, request, pk):
        convenio = get_object_or_404(Convenio, id=pk)
        convenio.is_approved = True
        convenio.approved_at = timezone.now()
        convenio.save(update_fields=["is_approved", "approved_at", "updated_at"])
        return Response(
            {"status": "success", "data": {"id": str(convenio.id), "is_approved": convenio.is_approved}}
        )


class OwnerUserListView(ListAPIView):
    permission_classes = [IsAuthenticated, IsOwner]
    serializer_class = AdminUserListSerializer
    queryset = CustomUser.objects.select_related("convenio").order_by("-date_joined")

    @extend_schema(
        operation_id="listAdminUsers",
        tags=["owner"],
        summary="List users for owner admin panel",
        parameters=[
            OpenApiParameter(name="role", type=str, required=False),
            OpenApiParameter(name="is_active", type=bool, required=False),
            OpenApiParameter(name="email", type=str, required=False),
            OpenApiParameter(name="full_name", type=str, required=False),
        ],
        responses={200: AdminUserListSerializer(many=True)},
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        queryset = super().get_queryset()
        params = self.request.query_params
        if params.get("role"):
            queryset = queryset.filter(role=params["role"])
        if params.get("is_active") in {"true", "false"}:
            queryset = queryset.filter(is_active=params["is_active"] == "true")
        if params.get("email"):
            queryset = queryset.filter(email__icontains=params["email"])
        if params.get("full_name"):
            queryset = queryset.filter(full_name__icontains=params["full_name"])
        return queryset


class OwnerAuditLogView(ListAPIView):
    permission_classes = [IsAuthenticated, IsOwner]
    serializer_class = AuditLogSerializer
    queryset = LogEntry.objects.select_related("actor", "content_type").order_by("-timestamp")

    @extend_schema(
        operation_id="listAuditLogs",
        tags=["owner"],
        summary="List audit logs",
        parameters=[
            OpenApiParameter(name="model_name", type=str, required=False),
            OpenApiParameter(name="action", type=str, required=False, description="create|update|delete|access"),
            OpenApiParameter(name="user", type=str, required=False, description="Actor user UUID"),
            OpenApiParameter(name="date_from", type=str, required=False, description="YYYY-MM-DD"),
            OpenApiParameter(name="date_to", type=str, required=False, description="YYYY-MM-DD"),
        ],
        responses={200: AuditLogSerializer(many=True)},
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        queryset = super().get_queryset()
        params = self.request.query_params

        if params.get("model_name"):
            queryset = queryset.filter(content_type__model__iexact=params["model_name"])

        if params.get("action"):
            action_map = {"create": 0, "update": 1, "delete": 2, "access": 3}
            action_value = action_map.get(params["action"].lower())
            if action_value is not None:
                queryset = queryset.filter(action=action_value)

        if params.get("user"):
            queryset = queryset.filter(actor_id=params["user"])

        date_from = params.get("date_from")
        date_to = params.get("date_to")
        if date_from:
            try:
                parsed = datetime.fromisoformat(date_from)
                queryset = queryset.filter(timestamp__date__gte=parsed.date())
            except ValueError:
                pass
        if date_to:
            try:
                parsed = datetime.fromisoformat(date_to)
                queryset = queryset.filter(timestamp__date__lte=parsed.date())
            except ValueError:
                pass

        return queryset


class OwnerFinancialReportView(APIView):
    permission_classes = [IsAuthenticated, IsOwner]

    @extend_schema(
        operation_id="getOwnerFinancialReport",
        tags=["owner"],
        summary="Get global owner financial report",
        responses={200: OwnerFinancialReportSerializer},
    )
    def get(self, request):
        data = OwnerDashboardService.get_financial_report()
        return Response({"status": "success", "data": data}, status=status.HTTP_200_OK)
