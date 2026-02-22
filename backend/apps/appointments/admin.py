from django.contrib import admin

from .models import Appointment, Rating


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ["patient", "doctor", "scheduled_date", "scheduled_time", "status", "price", "created_at"]
    list_filter = ["status", "appointment_type", "scheduled_date"]
    search_fields = ["patient__full_name", "doctor__user__full_name"]
    readonly_fields = ["id", "created_at", "updated_at"]
    raw_id_fields = ["patient", "doctor", "convenio", "cancelled_by", "payment"]
    date_hierarchy = "scheduled_date"


@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    list_display = ["patient", "doctor", "score", "is_anonymous", "is_moderated", "created_at"]
    list_filter = ["score", "is_moderated"]
    search_fields = ["patient__full_name", "doctor__user__full_name", "comment"]
    readonly_fields = ["id", "created_at", "updated_at"]
    raw_id_fields = ["appointment", "patient", "doctor"]
