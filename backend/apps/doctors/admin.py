from django.contrib import admin

from .models import Doctor, DoctorSchedule, ScheduleException


class DoctorScheduleInline(admin.TabularInline):
    model = DoctorSchedule
    extra = 0
    fields = ["weekday", "start_time", "end_time", "slot_duration", "is_active"]


class ScheduleExceptionInline(admin.TabularInline):
    model = ScheduleException
    extra = 0
    fields = ["date", "is_full_day", "start_time", "end_time", "is_available", "reason"]


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ["__str__", "specialty", "convenio", "rating", "is_available", "created_at"]
    list_filter = ["specialty", "is_available", "convenio"]
    search_fields = ["user__full_name", "crm", "specialty"]
    readonly_fields = ["id", "rating", "total_ratings", "created_at", "updated_at"]
    inlines = [DoctorScheduleInline, ScheduleExceptionInline]
    raw_id_fields = ["user", "convenio"]


@admin.register(DoctorSchedule)
class DoctorScheduleAdmin(admin.ModelAdmin):
    list_display = ["doctor", "weekday", "start_time", "end_time", "is_active"]
    list_filter = ["weekday", "is_active"]
    readonly_fields = ["id", "created_at", "updated_at"]


@admin.register(ScheduleException)
class ScheduleExceptionAdmin(admin.ModelAdmin):
    list_display = ["doctor", "date", "is_full_day", "is_available", "reason"]
    list_filter = ["is_available", "is_full_day"]
    readonly_fields = ["id", "created_at", "updated_at"]
