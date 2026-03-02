from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from rest_framework import serializers

from apps.core.utils import validate_cpf, validate_phone_br

from .models import CONSENT_PURPOSE_CHOICES, ConsentRecord, CustomUser


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = CustomUser
        fields = [
            "email",
            "password",
            "password_confirm",
            "full_name",
            "phone",
            "cpf",
            "date_of_birth",
            "gender",
        ]

    def validate_cpf(self, value):
        if not validate_cpf(value):
            raise serializers.ValidationError("Invalid CPF.")
        if CustomUser.objects.filter(cpf=value).exists():
            raise serializers.ValidationError("CPF already registered.")
        return value

    def validate_phone(self, value):
        if not validate_phone_br(value):
            raise serializers.ValidationError(
                "Invalid phone format. Use +55 followed by 10 or 11 digits."
            )
        if CustomUser.objects.filter(phone=value).exists():
            raise serializers.ValidationError("Phone already registered.")
        return value

    def validate_email(self, value):
        if CustomUser.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email already registered.")
        return value

    def validate_date_of_birth(self, value):
        today = timezone.localdate()
        if value > today:
            raise serializers.ValidationError("Date of birth cannot be in the future.")
        age = (today - value).days // 365
        if age < 16:
            raise serializers.ValidationError("User must be at least 16 years old.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs.pop("password_confirm"):
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        return CustomUser.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(email=attrs["email"], password=attrs["password"])
        if not user:
            # Generic message — do not reveal if email exists
            raise serializers.ValidationError("Invalid email or password.")
        if not user.is_active:
            raise serializers.ValidationError("Invalid email or password.")
        attrs["user"] = user
        return attrs


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = [
            "id",
            "email",
            "full_name",
            "phone",
            "date_of_birth",
            "gender",
            "avatar_url",
            "role",
            "email_verified",
            "phone_verified",
            "is_2fa_enabled",
            "convenio",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "email",
            "role",
            "email_verified",
            "phone_verified",
            "created_at",
            "updated_at",
        ]


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = [
            "id",
            "email",
            "full_name",
            "phone",
            "date_of_birth",
            "gender",
            "avatar_url",
            "role",
            "email_verified",
            "phone_verified",
            "is_2fa_enabled",
            "convenio",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "email",
            "role",
            "email_verified",
            "phone_verified",
            "is_2fa_enabled",
            "convenio",
            "created_at",
        ]


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8, validators=[validate_password])

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, min_length=8, validators=[validate_password])


class VerifyEmailSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=6, min_length=6)


class VerifyPhoneSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=6, min_length=6)


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class RefreshTokenRequestSerializer(serializers.Serializer):
    refresh = serializers.CharField()


class Setup2FAResponseSerializer(serializers.Serializer):
    provisioning_uri = serializers.CharField()
    key = serializers.CharField()


class Verify2FASerializer(serializers.Serializer):
    token = serializers.CharField(max_length=6, min_length=6)


class Disable2FASerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True)


class Login2FASerializer(serializers.Serializer):
    temp_token = serializers.CharField()
    totp_code = serializers.CharField(max_length=6, min_length=6)


class ConsentRecordSerializer(serializers.ModelSerializer):
    purpose_display = serializers.CharField(source="get_purpose_display", read_only=True)

    class Meta:
        model = ConsentRecord
        fields = [
            "id",
            "purpose",
            "purpose_display",
            "granted",
            "granted_at",
            "revoked_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "granted_at", "revoked_at", "created_at", "updated_at"]


class UpdateConsentItemSerializer(serializers.Serializer):
    purpose = serializers.ChoiceField(choices=[c[0] for c in CONSENT_PURPOSE_CHOICES])
    granted = serializers.BooleanField()


class UpdateConsentsSerializer(serializers.Serializer):
    consents = UpdateConsentItemSerializer(many=True)

    def update_consents(self, user, ip_address: str, user_agent: str) -> list:
        now = timezone.now()
        records = []
        for item in self.validated_data["consents"]:
            record, _ = ConsentRecord.objects.get_or_create(
                user=user,
                purpose=item["purpose"],
                defaults={"ip_address": ip_address, "user_agent": user_agent},
            )
            record.granted = item["granted"]
            record.ip_address = ip_address
            record.user_agent = user_agent
            if item["granted"]:
                record.granted_at = now
                record.revoked_at = None
            else:
                record.revoked_at = now
                record.granted_at = record.granted_at
            record.save()
            records.append(record)
        return records
