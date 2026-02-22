from django.contrib import admin

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ["title", "user", "type", "channel", "is_read", "sent_at", "created_at"]
    list_filter = ["type", "channel", "is_read"]
    search_fields = ["title", "user__full_name", "user__email"]
    readonly_fields = ["id", "created_at", "updated_at"]
    raw_id_fields = ["user"]
