import uuid
from decimal import Decimal

from django.core.cache import cache
from django.db import models
from django.utils import timezone

PLATFORM_SETTINGS_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


class SoftDeleteManager(models.Manager):
    """Manager that filters out soft-deleted records by default."""

    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)


class AllObjectsManager(models.Manager):
    """Manager that includes soft-deleted records."""

    pass


class BaseModel(models.Model):
    """Abstract base model with UUID pk, timestamps, and soft delete."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)

    objects = SoftDeleteManager()
    all_objects = AllObjectsManager()

    class Meta:
        abstract = True
        ordering = ["-created_at"]

    def soft_delete(self):
        """Mark record as deleted without removing from database."""
        self.deleted_at = timezone.now()
        self.save(update_fields=["deleted_at", "updated_at"])

    def restore(self):
        """Restore a soft-deleted record."""
        self.deleted_at = None
        self.save(update_fields=["deleted_at", "updated_at"])

    @property
    def is_deleted(self) -> bool:
        return self.deleted_at is not None


class PlatformSettings(BaseModel):
    """Singleton model for global platform settings."""

    platform_fee_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("10.00"))
    max_advance_booking_days = models.PositiveIntegerField(default=60)
    min_cancellation_hours = models.PositiveIntegerField(default=24)
    cancellation_fee_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("0.00"))
    appointment_lock_ttl_minutes = models.PositiveIntegerField(default=10)
    payment_timeout_minutes = models.PositiveIntegerField(default=30)
    max_appointments_per_day_patient = models.PositiveIntegerField(default=3)
    pix_enabled = models.BooleanField(default=True)
    credit_card_enabled = models.BooleanField(default=True)
    maintenance_mode = models.BooleanField(default=False)
    maintenance_message = models.TextField(blank=True)
    updated_by = models.ForeignKey(
        "users.CustomUser",
        on_delete=models.SET_NULL,
        related_name="platform_settings_updates",
        null=True,
        blank=True,
    )

    class Meta:
        verbose_name = "platform setting"
        verbose_name_plural = "platform settings"

    def __str__(self):
        return "Platform Settings"

    def save(self, *args, **kwargs):
        self.pk = PLATFORM_SETTINGS_ID
        super().save(*args, **kwargs)
        cache.delete("platform_settings:singleton")

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=PLATFORM_SETTINGS_ID)
        return obj
