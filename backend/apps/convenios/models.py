from django.db import models
from encrypted_model_fields.fields import EncryptedCharField

from apps.core.models import BaseModel


class Convenio(BaseModel):
    """Healthcare provider / clinic organization."""

    name = models.CharField(max_length=255)
    cnpj = EncryptedCharField(max_length=18, unique=True)
    logo_url = models.URLField(blank=True)
    description = models.TextField(blank=True)
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=20)
    address = models.JSONField(default=dict)  # {street, city, state, zip, lat, lng}
    settings = models.JSONField(default=dict)  # cancellation_policy, etc.

    # Subscription
    subscription_plan = models.CharField(max_length=50, default="starter")
    subscription_status = models.CharField(max_length=20, default="active")

    is_active = models.BooleanField(default=True, db_index=True)
    is_approved = models.BooleanField(default=False)
    approved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "convenio"
        verbose_name_plural = "convenios"
        ordering = ["name"]

    def __str__(self):
        return self.name


class ConvenioPlan(BaseModel):
    """Subscription plans available for convenios."""

    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    features = models.JSONField(default=list)
    max_doctors = models.IntegerField()
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "convenio plan"
        verbose_name_plural = "convenio plans"
        ordering = ["price"]

    def __str__(self):
        return f"{self.name} — R${self.price}"


class ExamType(BaseModel):
    """Types of medical exams offered by a convenio."""

    convenio = models.ForeignKey(Convenio, on_delete=models.CASCADE, related_name="exam_types")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    preparation = models.TextField(blank=True)
    duration_minutes = models.IntegerField(default=30)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "exam type"
        verbose_name_plural = "exam types"
        ordering = ["name"]
        unique_together = ["convenio", "name"]

    def __str__(self):
        return f"{self.name} ({self.convenio.name})"
