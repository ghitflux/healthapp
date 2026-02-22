from django.apps import AppConfig


class AppointmentsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.appointments"
    verbose_name = "Appointments"

    def ready(self):
        from auditlog.registry import auditlog

        from .models import Appointment

        auditlog.register(Appointment)
