import logging

from django.core.cache import cache
from django.utils import timezone

from apps.core.utils import generate_otp

from .models import CustomUser

logger = logging.getLogger(__name__)

OTP_EXPIRY_SECONDS = 300  # 5 minutes
OTP_PREFIX_EMAIL = "otp:email:"
OTP_PREFIX_PHONE = "otp:phone:"


class OTPService:
    """Service for generating and verifying OTP codes."""

    @staticmethod
    def generate_email_otp(user: CustomUser) -> str:
        code = generate_otp()
        cache.set(f"{OTP_PREFIX_EMAIL}{user.id}", code, timeout=OTP_EXPIRY_SECONDS)
        logger.info("Email OTP generated for user %s", user.id)
        return code

    @staticmethod
    def verify_email_otp(user: CustomUser, code: str) -> bool:
        cached_code = cache.get(f"{OTP_PREFIX_EMAIL}{user.id}")
        if cached_code and cached_code == code:
            cache.delete(f"{OTP_PREFIX_EMAIL}{user.id}")
            user.email_verified = True
            user.save(update_fields=["email_verified", "updated_at"])
            return True
        return False

    @staticmethod
    def generate_phone_otp(user: CustomUser) -> str:
        code = generate_otp()
        cache.set(f"{OTP_PREFIX_PHONE}{user.id}", code, timeout=OTP_EXPIRY_SECONDS)
        logger.info("Phone OTP generated for user %s", user.id)
        return code

    @staticmethod
    def verify_phone_otp(user: CustomUser, code: str) -> bool:
        cached_code = cache.get(f"{OTP_PREFIX_PHONE}{user.id}")
        if cached_code and cached_code == code:
            cache.delete(f"{OTP_PREFIX_PHONE}{user.id}")
            user.phone_verified = True
            user.save(update_fields=["phone_verified", "updated_at"])
            return True
        return False


class AuthService:
    """Service for authentication-related operations."""

    @staticmethod
    def register_user(validated_data: dict) -> CustomUser:
        user = CustomUser.objects.create_user(**validated_data)
        OTPService.generate_email_otp(user)
        return user

    @staticmethod
    def update_last_login(user: CustomUser) -> None:
        user.last_login = timezone.now()
        user.save(update_fields=["last_login"])


class UserService:
    """Service for user management operations."""

    @staticmethod
    def anonymize_user(user: CustomUser) -> None:
        """Anonymize user data for LGPD compliance (right to be forgotten)."""
        user.full_name = "Anonymized User"
        user.email = f"anonymized_{user.id}@deleted.healthapp.com.br"
        user.phone = None
        user.cpf = None
        user.date_of_birth = None
        user.gender = ""
        user.avatar_url = ""
        user.is_active = False
        user.deleted_at = timezone.now()
        user.save()
        logger.info("User %s anonymized (LGPD)", user.id)

    @staticmethod
    def export_user_data(user: CustomUser) -> dict:
        """Export all personal data for LGPD compliance."""
        return {
            "personal_info": {
                "full_name": user.full_name,
                "email": user.email,
                "phone": user.phone,
                "date_of_birth": str(user.date_of_birth) if user.date_of_birth else None,
                "gender": user.gender,
                "role": user.role,
                "date_joined": user.date_joined.isoformat(),
            },
            "exported_at": timezone.now().isoformat(),
        }
