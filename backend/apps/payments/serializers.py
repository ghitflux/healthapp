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
    currency = serializers.ChoiceField(choices=["BRL"], default="BRL")

    def validate_amount(self, value):
        from decimal import Decimal
        if value < Decimal("1.00"):
            raise serializers.ValidationError("Minimum amount is R$ 1.00.")
        if value > Decimal("50000.00"):
            raise serializers.ValidationError("Maximum amount is R$ 50,000.00.")
        return value


class PIXGenerateSerializer(serializers.Serializer):
    appointment_id = serializers.UUIDField()


class PaymentStatusSerializer(serializers.Serializer):
    payment_id = serializers.UUIDField()
    status = serializers.CharField()
    paid_at = serializers.DateTimeField(allow_null=True)


class RefundSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    reason = serializers.CharField(required=False, allow_blank=True)
