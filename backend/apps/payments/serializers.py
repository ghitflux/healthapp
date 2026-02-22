from rest_framework import serializers

from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            "id",
            "user",
            "amount",
            "currency",
            "payment_method",
            "status",
            "stripe_payment_intent_id",
            "pix_code",
            "pix_qr_code",
            "pix_expiration",
            "paid_at",
            "refunded_at",
            "refund_amount",
            "metadata",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "stripe_payment_intent_id",
            "pix_code",
            "pix_qr_code",
            "paid_at",
            "refunded_at",
            "created_at",
            "updated_at",
        ]


class CreatePaymentIntentSerializer(serializers.Serializer):
    appointment_id = serializers.UUIDField()
    payment_method = serializers.ChoiceField(choices=["credit_card", "debit_card"])


class PIXGenerateSerializer(serializers.Serializer):
    appointment_id = serializers.UUIDField()


class PaymentStatusSerializer(serializers.Serializer):
    payment_id = serializers.UUIDField()
    status = serializers.CharField()
    paid_at = serializers.DateTimeField(allow_null=True)


class RefundSerializer(serializers.Serializer):
    reason = serializers.CharField(required=False, allow_blank=True)
