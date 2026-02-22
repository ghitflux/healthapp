from django.db import models

from apps.core.models import BaseModel


PAYMENT_METHOD_CHOICES = [
    ("pix", "PIX"),
    ("credit_card", "Credit Card"),
    ("debit_card", "Debit Card"),
]

PAYMENT_STATUS_CHOICES = [
    ("pending", "Pending"),
    ("processing", "Processing"),
    ("completed", "Completed"),
    ("failed", "Failed"),
    ("refunded", "Refunded"),
]


class Payment(BaseModel):
    """Payment record linked to an appointment."""

    user = models.ForeignKey("users.CustomUser", on_delete=models.CASCADE, related_name="payments")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default="BRL")
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES)
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default="pending", db_index=True)

    # Stripe
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True, db_index=True)
    stripe_charge_id = models.CharField(max_length=255, blank=True)

    # PIX
    pix_code = models.TextField(blank=True)
    pix_qr_code = models.TextField(blank=True)
    pix_expiration = models.DateTimeField(null=True, blank=True)

    # Timestamps
    paid_at = models.DateTimeField(null=True, blank=True)
    refunded_at = models.DateTimeField(null=True, blank=True)
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    # Metadata
    metadata = models.JSONField(default=dict)

    class Meta:
        verbose_name = "payment"
        verbose_name_plural = "payments"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "created_at"], name="idx_pay_status_created"),
        ]

    def __str__(self):
        return f"Payment R${self.amount} — {self.status} ({self.payment_method})"
