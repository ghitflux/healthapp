from rest_framework import serializers

from .models import DeviceToken, Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            "id",
            "user",
            "type",
            "title",
            "body",
            "channel",
            "is_read",
            "read_at",
            "sent_at",
            "metadata",
            "created_at",
        ]
        read_only_fields = ["id", "user", "type", "title", "body", "channel", "sent_at", "created_at"]


class UnreadCountSerializer(serializers.Serializer):
    count = serializers.IntegerField()


class DeviceTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceToken
        fields = [
            "id",
            "token",
            "device_type",
            "device_name",
            "is_active",
            "last_used_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "is_active", "last_used_at", "created_at", "updated_at"]


class RegisterDeviceTokenSerializer(serializers.Serializer):
    token = serializers.CharField(max_length=500)
    device_type = serializers.ChoiceField(choices=["ios", "android", "web"])
    device_name = serializers.CharField(max_length=255, required=False, allow_blank=True)


class UnregisterDeviceTokenSerializer(serializers.Serializer):
    token = serializers.CharField(max_length=500)
