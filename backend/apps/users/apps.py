from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.users"
    verbose_name = "Users"

    def ready(self):
        from auditlog.registry import auditlog

        from .models import ConsentRecord, CustomUser

        auditlog.register(CustomUser)
        auditlog.register(ConsentRecord)
