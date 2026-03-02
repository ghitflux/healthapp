from django.db import models

from apps.core.models import BaseModel

NOTIFICATION_TYPE_CHOICES = [
    ("appointment", "Appointment"),
    ("payment", "Payment"),
    ("system", "System"),
    ("reminder", "Reminder"),
]

CHANNEL_CHOICES = [
    ("email", "Email"),
    ("push", "Push"),
    ("sms", "SMS"),
]


class Notification(BaseModel):
    """User notification (email, push, SMS)."""

    user = models.ForeignKey("users.CustomUser", on_delete=models.CASCADE, related_name="notifications")
    type = models.CharField(max_length=50, choices=NOTIFICATION_TYPE_CHOICES)
    title = models.CharField(max_length=255)
    body = models.TextField()
    channel = models.CharField(max_length=10, choices=CHANNEL_CHOICES, default="push")
    is_read = models.BooleanField(default=False, db_index=True)
    read_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    metadata = models.JSONField(default=dict)  # deep link data

    class Meta:
        verbose_name = "notification"
        verbose_name_plural = "notifications"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "is_read"], name="idx_notif_user_read"),
        ]

    def __str__(self):
        return f"{self.title} → {self.user.full_name}"


DEVICE_TYPE_CHOICES = [
    ("ios", "iOS"),
    ("android", "Android"),
    ("web", "Web"),
]


class DeviceToken(BaseModel):
    """FCM device token for push notifications."""

    user = models.ForeignKey("users.CustomUser", on_delete=models.CASCADE, related_name="device_tokens")
    token = models.CharField(max_length=500, unique=True)
    device_type = models.CharField(max_length=20, choices=DEVICE_TYPE_CHOICES)
    device_name = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)
    last_used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "device token"
        verbose_name_plural = "device tokens"
        ordering = ["-updated_at"]
        constraints = [
            models.UniqueConstraint(fields=["user", "token"], name="uniq_device_token_user_token"),
        ]
        indexes = [
            models.Index(fields=["user", "is_active"], name="idx_device_user_active"),
        ]

    def __str__(self):
        return f"{self.user.email} ({self.device_type})"
