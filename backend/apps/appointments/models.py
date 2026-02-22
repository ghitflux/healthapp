from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.core.models import BaseModel


APPOINTMENT_TYPE_CHOICES = [
    ("consultation", "Consultation"),
    ("exam", "Exam"),
    ("return_visit", "Return Visit"),
]

APPOINTMENT_STATUS_CHOICES = [
    ("pending", "Pending"),
    ("confirmed", "Confirmed"),
    ("in_progress", "In Progress"),
    ("completed", "Completed"),
    ("cancelled", "Cancelled"),
    ("no_show", "No Show"),
]


class Appointment(BaseModel):
    """Medical appointment between a patient and a doctor."""

    patient = models.ForeignKey(
        "users.CustomUser",
        on_delete=models.CASCADE,
        related_name="appointments",
    )
    doctor = models.ForeignKey(
        "doctors.Doctor",
        on_delete=models.CASCADE,
        related_name="appointments",
    )
    convenio = models.ForeignKey(
        "convenios.Convenio",
        on_delete=models.CASCADE,
        related_name="appointments",
    )
    appointment_type = models.CharField(max_length=20, choices=APPOINTMENT_TYPE_CHOICES)
    exam_type = models.ForeignKey(
        "convenios.ExamType",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="appointments",
    )
    scheduled_date = models.DateField(db_index=True)
    scheduled_time = models.TimeField()
    duration_minutes = models.IntegerField(default=30)
    status = models.CharField(max_length=20, choices=APPOINTMENT_STATUS_CHOICES, default="pending", db_index=True)
    cancellation_reason = models.TextField(blank=True)
    cancelled_by = models.ForeignKey(
        "users.CustomUser",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="cancelled_appointments",
    )
    notes = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    payment = models.OneToOneField(
        "payments.Payment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="appointment",
    )
    reminder_sent = models.BooleanField(default=False)

    class Meta:
        verbose_name = "appointment"
        verbose_name_plural = "appointments"
        ordering = ["-scheduled_date", "-scheduled_time"]
        indexes = [
            models.Index(fields=["doctor", "scheduled_date"], name="idx_apt_doctor_date"),
            models.Index(fields=["patient", "status"], name="idx_apt_patient_status"),
            models.Index(fields=["convenio", "scheduled_date"], name="idx_apt_convenio_date"),
        ]

    def __str__(self):
        return f"{self.patient} → Dr. {self.doctor.user.full_name} on {self.scheduled_date}"


class Rating(BaseModel):
    """Patient rating for a completed appointment."""

    appointment = models.OneToOneField(Appointment, on_delete=models.CASCADE, related_name="rating_obj")
    patient = models.ForeignKey("users.CustomUser", on_delete=models.CASCADE, related_name="ratings_given")
    doctor = models.ForeignKey("doctors.Doctor", on_delete=models.CASCADE, related_name="ratings")
    score = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True)
    is_anonymous = models.BooleanField(default=False)
    is_moderated = models.BooleanField(default=False)

    class Meta:
        verbose_name = "rating"
        verbose_name_plural = "ratings"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Rating {self.score}/5 for Dr. {self.doctor.user.full_name}"
