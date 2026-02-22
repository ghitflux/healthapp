from django.contrib import admin

from .models import Convenio, ConvenioPlan, ExamType


class ExamTypeInline(admin.TabularInline):
    model = ExamType
    extra = 0
    fields = ["name", "price", "duration_minutes", "is_active"]


@admin.register(Convenio)
class ConvenioAdmin(admin.ModelAdmin):
    list_display = ["name", "contact_email", "subscription_plan", "is_active", "is_approved", "created_at"]
    list_filter = ["is_active", "is_approved", "subscription_plan", "subscription_status"]
    search_fields = ["name", "contact_email"]
    readonly_fields = ["id", "created_at", "updated_at"]
    inlines = [ExamTypeInline]

    fieldsets = (
        (None, {"fields": ("name", "cnpj", "logo_url", "description")}),
        ("Contact", {"fields": ("contact_email", "contact_phone", "address")}),
        ("Subscription", {"fields": ("subscription_plan", "subscription_status")}),
        ("Settings", {"fields": ("settings",)}),
        ("Status", {"fields": ("is_active", "is_approved", "approved_at")}),
        ("Metadata", {"fields": ("id", "created_at", "updated_at", "deleted_at")}),
    )


@admin.register(ConvenioPlan)
class ConvenioPlanAdmin(admin.ModelAdmin):
    list_display = ["name", "price", "max_doctors", "is_active"]
    list_filter = ["is_active"]
    readonly_fields = ["id", "created_at", "updated_at"]


@admin.register(ExamType)
class ExamTypeAdmin(admin.ModelAdmin):
    list_display = ["name", "convenio", "price", "duration_minutes", "is_active"]
    list_filter = ["is_active", "convenio"]
    search_fields = ["name"]
    readonly_fields = ["id", "created_at", "updated_at"]
