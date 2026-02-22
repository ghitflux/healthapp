from django.apps import AppConfig


class ConveniosConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.convenios"
    verbose_name = "Convenios"

    def ready(self):
        from auditlog.registry import auditlog

        from .models import Convenio

        auditlog.register(Convenio)
