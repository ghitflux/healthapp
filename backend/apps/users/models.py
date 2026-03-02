import uuid

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from encrypted_model_fields.fields import EncryptedCharField

from apps.core.models import SoftDeleteManager

ROLE_CHOICES = [
    ("patient", "Patient"),
    ("doctor", "Doctor"),
    ("convenio_admin", "Convenio Admin"),
    ("owner", "Owner"),
]

GENDER_CHOICES = [
    ("M", "Male"),
    ("F", "Female"),
    ("O", "Other"),
]


class CustomUserManager(BaseUserManager):
    """Custom user manager with email as the unique identifier."""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The Email field must be set")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)  # type: ignore[attr-defined]
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "owner")
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("email_verified", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    """Custom user model with email as the unique identifier and UUID pk."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True, db_index=True)
    phone = models.CharField(max_length=20, unique=True, db_index=True, blank=True, null=True)
    full_name = models.CharField(max_length=255)
    cpf = EncryptedCharField(max_length=14, unique=True, blank=True, null=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True)
    avatar_url = models.URLField(blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="patient", db_index=True)

    # Verification
    email_verified = models.BooleanField(default=False)
    phone_verified = models.BooleanField(default=False)
    is_2fa_enabled = models.BooleanField(default=False)

    # Convenio association (for convenio_admin and doctor roles)
    convenio = models.ForeignKey(
        "convenios.Convenio",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="users",
    )

    # Django auth fields
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(null=True, blank=True)

    # Soft delete
    deleted_at = models.DateTimeField(null=True, blank=True, db_index=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = CustomUserManager()
    active_objects = SoftDeleteManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    class Meta:
        verbose_name = "user"
        verbose_name_plural = "users"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["role", "is_active"], name="idx_user_role_active"),
        ]

    def __str__(self):
        return f"{self.full_name} ({self.email})"

    @property
    def is_patient(self) -> bool:
        return self.role == "patient"

    @property
    def is_doctor(self) -> bool:
        return self.role == "doctor"

    @property
    def is_convenio_admin(self) -> bool:
        return self.role == "convenio_admin"

    @property
    def is_owner(self) -> bool:
        return self.role == "owner"


CONSENT_PURPOSE_CHOICES = [
    ("appointment_booking", "Agendamento de Consultas"),
    ("notifications_email", "Notificações por Email"),
    ("notifications_push", "Notificações Push"),
    ("notifications_sms", "Notificações SMS"),
    ("marketing", "Comunicações de Marketing"),
    ("data_analytics", "Uso de Dados para Analytics"),
]


class ConsentRecord(models.Model):
    """LGPD consent record — tracks user consent per purpose."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name="consents")
    purpose = models.CharField(max_length=50, choices=CONSENT_PURPOSE_CHOICES)
    granted = models.BooleanField(default=False)
    granted_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=512, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "purpose")
        verbose_name = "consent record"
        verbose_name_plural = "consent records"

    def __str__(self):
        status = "granted" if self.granted else "revoked"
        return f"{self.user.email} — {self.purpose} ({status})"
