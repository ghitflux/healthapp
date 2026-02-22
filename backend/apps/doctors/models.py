from django.contrib.postgres.fields import ArrayField
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from apps.core.models import BaseModel


class Doctor(BaseModel):
    """Doctor profile linked to a user and a convenio."""

    user = models.OneToOneField("users.CustomUser", on_delete=models.CASCADE, related_name="doctor_profile")
    convenio = models.ForeignKey("convenios.Convenio", on_delete=models.CASCADE, related_name="doctors")
    crm = models.CharField(max_length=20)
    crm_state = models.CharField(max_length=2)
    specialty = models.CharField(max_length=100, db_index=True)
    subspecialties = ArrayField(models.CharField(max_length=100), default=list, blank=True)
    bio = models.TextField(blank=True)
    consultation_duration = models.IntegerField(default=30, help_text="Duration in minutes")
    consultation_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    total_ratings = models.IntegerField(default=0)
    is_available = models.BooleanField(default=True, db_index=True)

    class Meta:
        verbose_name = "doctor"
        verbose_name_plural = "doctors"
        ordering = ["-rating"]
        indexes = [
            models.Index(fields=["specialty", "is_available"], name="idx_doc_spec_avail"),
        ]
        unique_together = ["crm", "crm_state"]

    def __str__(self):
        return f"Dr. {self.user.full_name} — {self.specialty}"


class DoctorSchedule(BaseModel):
    """Weekly recurring schedule for a doctor."""

    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name="schedules")
    weekday = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(6)],
        help_text="0=Monday, 6=Sunday",
    )
    start_time = models.TimeField()
    end_time = models.TimeField()
    slot_duration = models.IntegerField(default=30, help_text="Slot duration in minutes")
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "doctor schedule"
        verbose_name_plural = "doctor schedules"
        ordering = ["weekday", "start_time"]
        unique_together = ["doctor", "weekday", "start_time"]

    def __str__(self):
        days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        return f"{self.doctor} — {days[self.weekday]} {self.start_time}-{self.end_time}"

    def clean(self):
        from django.core.exceptions import ValidationError

        if self.start_time and self.end_time and self.start_time >= self.end_time:
            raise ValidationError("Start time must be before end time.")


class ScheduleException(BaseModel):
    """Exceptions to the regular schedule (vacations, holidays, blocks)."""

    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name="schedule_exceptions")
    date = models.DateField(db_index=True)
    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)
    is_full_day = models.BooleanField(default=True)
    is_available = models.BooleanField(default=False)
    reason = models.CharField(max_length=255, blank=True)

    class Meta:
        verbose_name = "schedule exception"
        verbose_name_plural = "schedule exceptions"
        ordering = ["-date"]

    def __str__(self):
        return f"{self.doctor} — {self.date} ({'Available' if self.is_available else 'Blocked'})"
