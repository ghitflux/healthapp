from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(BaseUserAdmin):
    list_display = ["email", "full_name", "role", "is_active", "email_verified", "date_joined"]
    list_filter = ["role", "is_active", "email_verified", "phone_verified", "is_staff"]
    search_fields = ["email", "full_name", "phone"]
    ordering = ["-date_joined"]
    readonly_fields = ["id", "created_at", "updated_at", "date_joined", "last_login"]

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (
            "Personal Info",
            {"fields": ("full_name", "phone", "cpf", "date_of_birth", "gender", "avatar_url")},
        ),
        (
            "Role & Association",
            {"fields": ("role", "convenio")},
        ),
        (
            "Verification",
            {"fields": ("email_verified", "phone_verified", "is_2fa_enabled")},
        ),
        (
            "Permissions",
            {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")},
        ),
        (
            "Metadata",
            {"fields": ("id", "created_at", "updated_at", "date_joined", "last_login", "deleted_at")},
        ),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "full_name", "role", "password1", "password2"),
            },
        ),
    )
