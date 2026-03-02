from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.notifications"
    verbose_name = "Notifications"

    def ready(self):
        from auditlog.registry import auditlog

        from .models import DeviceToken, Notification

        auditlog.register(Notification)
        auditlog.register(DeviceToken)
