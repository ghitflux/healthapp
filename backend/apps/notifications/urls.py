from django.urls import path

from . import views

app_name = "notifications"

urlpatterns = [
    path("notifications/", views.NotificationListView.as_view(), name="list"),
    path("notifications/<uuid:pk>/read/", views.MarkAsReadView.as_view(), name="mark-read"),
    path("notifications/read-all/", views.MarkAllAsReadView.as_view(), name="mark-all-read"),
    path("notifications/unread-count/", views.UnreadCountView.as_view(), name="unread-count"),
    path("notifications/devices/", views.DeviceTokenListView.as_view(), name="device-list"),
    path("notifications/devices/register/", views.RegisterDeviceTokenView.as_view(), name="device-register"),
    path("notifications/devices/unregister/", views.UnregisterDeviceTokenView.as_view(), name="device-unregister"),
]
