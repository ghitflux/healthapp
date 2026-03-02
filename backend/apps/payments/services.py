import logging
from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.utils import timezone

from apps.core.exceptions import BusinessLogicError
from apps.core.services import PlatformSettingsService
from apps.notifications.helpers import (
    notify_payment_completed,
    notify_payment_failed,
    notify_payment_refunded,
)
from apps.users.models import CustomUser

from .models import Payment

logger = logging.getLogger(__name__)


class StripeService:
    """Service for Stripe payment operations."""

    @staticmethod
    def _get_stripe():
        import stripe

        stripe.api_key = settings.STRIPE_SECRET_KEY
        return stripe

    @staticmethod
    def _obj_get(data, key, default=None):
        if isinstance(data, dict):
            return data.get(key, default)
        return getattr(data, key, default)

    @classmethod
    def create_payment_intent(cls, appointment, payment_method: str = "credit_card") -> dict:
        """Create a Stripe PaymentIntent for card payments."""
        settings_obj = PlatformSettingsService.get_settings()
        if not settings_obj.credit_card_enabled:
            raise BusinessLogicError("Credit card payments are currently disabled.")

        stripe = cls._get_stripe()
        payment = Payment.objects.create(
            user=appointment.patient,
            amount=appointment.price,
            payment_method=payment_method,
            status="pending",
            metadata={
                "appointment_id": str(appointment.id),
                "patient_id": str(appointment.patient_id),
                "doctor_id": str(appointment.doctor_id),
                "convenio_id": str(appointment.convenio_id),
            },
        )
        appointment.payment = payment
        appointment.save(update_fields=["payment", "updated_at"])

        amount_cents = int((appointment.price * Decimal("100")).quantize(Decimal("1")))
        try:
            intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency="brl",
                metadata={
                    "payment_id": str(payment.id),
                    "appointment_id": str(appointment.id),
                    "patient_id": str(appointment.patient_id),
                    "doctor_id": str(appointment.doctor_id),
                    "convenio_id": str(appointment.convenio_id),
                },
                automatic_payment_methods={"enabled": True},
            )
            payment.stripe_payment_intent_id = cls._obj_get(intent, "id", "")
            payment.status = "processing"
            payment.save(update_fields=["stripe_payment_intent_id", "status", "updated_at"])
            return {
                "client_secret": cls._obj_get(intent, "client_secret", ""),
                "payment_intent_id": cls._obj_get(intent, "id", ""),
                "payment_id": str(payment.id),
            }
        except Exception as exc:
            logger.error("Stripe error creating payment intent: %s", exc)
            raise BusinessLogicError(f"Payment processing error: {exc}") from exc

    @classmethod
    def create_pix_payment(cls, appointment) -> dict:
        """Create a PIX payment via Stripe."""
        settings_obj = PlatformSettingsService.get_settings()
        if not settings_obj.pix_enabled:
            raise BusinessLogicError("PIX payments are currently disabled.")

        stripe = cls._get_stripe()
        payment = Payment.objects.create(
            user=appointment.patient,
            amount=appointment.price,
            payment_method="pix",
            status="pending",
            metadata={
                "appointment_id": str(appointment.id),
                "patient_id": str(appointment.patient_id),
                "doctor_id": str(appointment.doctor_id),
                "convenio_id": str(appointment.convenio_id),
            },
        )
        appointment.payment = payment
        appointment.save(update_fields=["payment", "updated_at"])

        try:
            intent = stripe.PaymentIntent.create(
                amount=int((appointment.price * Decimal("100")).quantize(Decimal("1"))),
                currency="brl",
                payment_method_types=["pix"],
                metadata={
                    "payment_id": str(payment.id),
                    "appointment_id": str(appointment.id),
                    "patient_id": str(appointment.patient_id),
                    "doctor_id": str(appointment.doctor_id),
                    "convenio_id": str(appointment.convenio_id),
                },
            )
            next_action = cls._obj_get(intent, "next_action", {}) or {}
            pix_data: dict[str, object] = {}
            if isinstance(next_action, dict):
                pix_data = next_action.get("pix_display_qr_code", {}) or next_action.get("pix", {}) or {}

            payment.stripe_payment_intent_id = cls._obj_get(intent, "id", "")
            payment.status = "processing"
            payment.pix_qr_code = str(
                pix_data.get("image_url_png")
                or pix_data.get("qr_code")
                or pix_data.get("qrcode")
                or ""
            )
            payment.pix_code = str(
                pix_data.get("copy_paste")
                or pix_data.get("copy_and_paste")
                or pix_data.get("payload")
                or ""
            )
            payment.pix_expiration = timezone.now() + timedelta(minutes=settings_obj.payment_timeout_minutes)
            payment.save(
                update_fields=[
                    "stripe_payment_intent_id",
                    "status",
                    "pix_qr_code",
                    "pix_code",
                    "pix_expiration",
                    "updated_at",
                ]
            )
            return {
                "payment_intent_id": cls._obj_get(intent, "id", ""),
                "client_secret": cls._obj_get(intent, "client_secret", ""),
                "qr_code_base64": payment.pix_qr_code,
                "copy_paste_code": payment.pix_code,
                "expiration": payment.pix_expiration.isoformat() if payment.pix_expiration else "",
                "payment_id": str(payment.id),
            }
        except Exception as exc:
            logger.error("Stripe error creating PIX payment: %s", exc)
            raise BusinessLogicError(f"PIX payment error: {exc}") from exc

    @classmethod
    def process_webhook_event(cls, payload: bytes, sig_header: str | None) -> dict:
        """Validate and process Stripe webhook event payload."""
        stripe = cls._get_stripe()
        if not sig_header:
            raise BusinessLogicError("Missing Stripe signature header.")

        event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
        event_type = event.get("type")
        event_data = event.get("data", {}).get("object", {})

        if event_type == "payment_intent.succeeded":
            payment_id = event_data.get("metadata", {}).get("payment_id")
            if payment_id:
                try:
                    payment = Payment.objects.select_related("appointment").get(id=payment_id)
                except Payment.DoesNotExist:
                    logger.warning("Payment %s not found for succeeded webhook", payment_id)
                else:
                    payment.status = "completed"
                    payment.paid_at = timezone.now()
                    payment.save(update_fields=["status", "paid_at", "updated_at"])
                    appointment = getattr(payment, "appointment", None)
                    if appointment and appointment.status == "pending":
                        from apps.appointments.services import BookingService

                        BookingService.confirm_appointment(appointment)
                    notify_payment_completed(payment)

        elif event_type == "payment_intent.payment_failed":
            payment_id = event_data.get("metadata", {}).get("payment_id")
            if payment_id:
                try:
                    payment = Payment.objects.get(id=payment_id)
                except Payment.DoesNotExist:
                    logger.warning("Payment %s not found for failure webhook", payment_id)
                else:
                    payment.status = "failed"
                    payment.save(update_fields=["status", "updated_at"])
                    notify_payment_failed(payment)

        elif event_type == "charge.refunded":
            metadata = event_data.get("metadata", {})
            payment_id = metadata.get("payment_id")
            payment_intent_id = event_data.get("payment_intent")
            payment = None
            if payment_id:
                payment = Payment.objects.filter(id=payment_id).first()
            if payment is None and payment_intent_id:
                payment = Payment.objects.filter(stripe_payment_intent_id=payment_intent_id).first()
            if payment:
                refunded_amount = Decimal(str(event_data.get("amount_refunded", 0))) / Decimal("100")
                payment.status = "refunded"
                payment.refunded_at = timezone.now()
                payment.refund_amount = refunded_amount or payment.amount
                payment.save(update_fields=["status", "refunded_at", "refund_amount", "updated_at"])
                notify_payment_refunded(payment)

        elif event_type == "charge.dispute.created":
            owners = CustomUser.objects.filter(role="owner", is_active=True)
            for owner in owners:
                owner.notifications.create(
                    type="system",
                    title="Disputa de pagamento criada",
                    body="Uma nova disputa de pagamento foi aberta no Stripe.",
                    channel="push",
                    metadata={"event": "charge.dispute.created"},
                )

        return event

    @classmethod
    def refund_payment(cls, payment: Payment, amount: Decimal | None = None) -> Payment:
        """Refund a completed payment. Supports partial refunds."""
        stripe = cls._get_stripe()

        if payment.status == "refunded":
            raise BusinessLogicError("Payment is already refunded.")
        if payment.status != "completed":
            raise BusinessLogicError("Can only refund completed payments.")

        target_amount = amount if amount is not None else payment.amount
        if target_amount <= Decimal("0.00"):
            raise BusinessLogicError("Refund amount must be greater than zero.")
        if target_amount > payment.amount:
            raise BusinessLogicError("Refund amount cannot exceed payment amount.")

        try:
            params: dict[str, object] = {"payment_intent": payment.stripe_payment_intent_id}
            if target_amount < payment.amount:
                params["amount"] = int((target_amount * Decimal("100")).quantize(Decimal("1")))
            stripe.Refund.create(**params)
            payment.status = "refunded"
            payment.refunded_at = timezone.now()
            payment.refund_amount = target_amount
            payment.save(update_fields=["status", "refunded_at", "refund_amount", "updated_at"])
            notify_payment_refunded(payment)
            logger.info("Payment %s refunded amount=%s", payment.id, target_amount)
            return payment
        except Exception as exc:
            logger.error("Stripe refund error: %s", exc)
            raise BusinessLogicError(f"Refund error: {exc}") from exc
