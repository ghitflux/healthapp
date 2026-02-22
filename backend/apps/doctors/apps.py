from django.apps import AppConfig


class DoctorsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.doctors"
    verbose_name = "Doctors"

    def ready(self):
        from auditlog.registry import auditlog

        from .models import Doctor

        auditlog.register(Doctor)
