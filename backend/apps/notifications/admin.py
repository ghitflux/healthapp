from django.contrib import admin

from .models import DeviceToken, Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ["title", "user", "type", "channel", "is_read", "sent_at", "created_at"]
    list_filter = ["type", "channel", "is_read"]
    search_fields = ["title", "user__full_name", "user__email"]
    readonly_fields = ["id", "created_at", "updated_at"]
    raw_id_fields = ["user"]


@admin.register(DeviceToken)
class DeviceTokenAdmin(admin.ModelAdmin):
    list_display = ["user", "device_type", "device_name", "is_active", "last_used_at", "updated_at"]
    list_filter = ["device_type", "is_active"]
    search_fields = ["user__email", "token", "device_name"]
    readonly_fields = ["id", "created_at", "updated_at"]
    raw_id_fields = ["user"]
