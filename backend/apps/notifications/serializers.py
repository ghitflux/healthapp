from rest_framework import serializers

from .models import Notification


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
