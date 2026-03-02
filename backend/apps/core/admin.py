from django.contrib import admin

from .models import PlatformSettings


@admin.register(PlatformSettings)
class PlatformSettingsAdmin(admin.ModelAdmin):
    list_display = [
        "platform_fee_percentage",
        "max_advance_booking_days",
        "min_cancellation_hours",
        "appointment_lock_ttl_minutes",
        "maintenance_mode",
        "updated_at",
    ]
    readonly_fields = ["id", "created_at", "updated_at"]

    def has_add_permission(self, request):
        return not PlatformSettings.objects.exists()
