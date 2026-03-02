from typing import cast

from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.models import CustomUser

from .filters import NotificationFilter
from .models import Notification
from .serializers import NotificationSerializer, UnreadCountSerializer
from .services import NotificationService


class NotificationListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer
    filterset_class = NotificationFilter
    queryset = Notification.objects.none()

    @extend_schema(
        operation_id="listNotifications",
        tags=["notifications"],
        summary="List user notifications",
        parameters=[
            OpenApiParameter(name="type", type=str, required=False),
            OpenApiParameter(name="is_read", type=bool, required=False),
            OpenApiParameter(name="channel", type=str, required=False),
            OpenApiParameter(name="page", type=int, required=False),
            OpenApiParameter(name="page_size", type=int, required=False),
        ],
        responses={200: NotificationSerializer(many=True)},
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return Notification.objects.none()
        user = cast(CustomUser, self.request.user)
        return Notification.objects.filter(user=user).order_by("-created_at")


class MarkAsReadView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="markNotificationRead",
        tags=["notifications"],
        summary="Mark notification as read",
        request=None,
        responses={200: NotificationSerializer},
    )
    def patch(self, request, pk):
        try:
            notification = Notification.objects.get(id=pk, user=request.user)
        except Notification.DoesNotExist:
            return Response(
                {"status": "error", "errors": [{"detail": "Notification not found."}]},
                status=status.HTTP_404_NOT_FOUND,
            )
        NotificationService.mark_as_read(notification)
        return Response({"status": "success", "data": NotificationSerializer(notification).data})


class MarkAllAsReadView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="markAllNotificationsRead",
        tags=["notifications"],
        summary="Mark all notifications as read",
        request=None,
        responses={200: dict},
    )
    def post(self, request):
        NotificationService.mark_all_as_read(request.user)
        return Response({"status": "success", "data": {"message": "All notifications marked as read."}})


class UnreadCountView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="getUnreadNotificationCount",
        tags=["notifications"],
        summary="Get unread notification count",
        responses={200: UnreadCountSerializer},
    )
    def get(self, request):
        count = NotificationService.get_unread_count(request.user)
        return Response({"status": "success", "data": {"count": count}})
