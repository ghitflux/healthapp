from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import NotificationSerializer, UnreadCountSerializer
from .services import NotificationService


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="listNotifications",
        tags=["notifications"],
        summary="List user notifications",
        responses={200: NotificationSerializer(many=True)},
    )
    def get(self, request):
        notifications = Notification.objects.filter(user=request.user)[:50]
        serializer = NotificationSerializer(notifications, many=True)
        return Response({"status": "success", "data": serializer.data})


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
