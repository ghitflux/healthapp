import logging

from django.conf import settings
from django.utils import timezone

from apps.core.exceptions import BusinessLogicError
from apps.notifications.helpers import (
    notify_appointment_confirmed,
    notify_payment_completed,
    notify_payment_refunded,
)

from .models import Payment

logger = logging.getLogger(__name__)


class StripeService:
    """Service for Stripe payment operations."""

    @staticmethod
    def create_payment_intent(payment: Payment) -> dict:
        """Create a Stripe Payment Intent."""
        import stripe

        stripe.api_key = settings.STRIPE_SECRET_KEY

        try:
            intent = stripe.PaymentIntent.create(
                amount=int(payment.amount * 100),  # cents
                currency=payment.currency.lower(),
                metadata={"payment_id": str(payment.id)},
            )
            payment.stripe_payment_intent_id = intent.id
            payment.status = "processing"
            payment.save(update_fields=["stripe_payment_intent_id", "status", "updated_at"])
            return {
                "client_secret": intent.client_secret,
                "payment_intent_id": intent.id,
            }
        except Exception as exc:
            logger.error("Stripe error creating payment intent: %s", exc)
            raise BusinessLogicError(f"Payment processing error: {exc}") from exc

    @staticmethod
    def create_pix_payment(payment: Payment) -> dict:
        """Create a PIX payment via Stripe."""
        import stripe

        stripe.api_key = settings.STRIPE_SECRET_KEY

        try:
            intent = stripe.PaymentIntent.create(
                amount=int(payment.amount * 100),
                currency="brl",
                payment_method_types=["pix"],
                metadata={"payment_id": str(payment.id)},
            )
            payment.stripe_payment_intent_id = intent.id
            payment.status = "processing"
            payment.save(update_fields=["stripe_payment_intent_id", "status", "updated_at"])
            return {
                "payment_intent_id": intent.id,
                "client_secret": intent.client_secret,
            }
        except Exception as exc:
            logger.error("Stripe error creating PIX payment: %s", exc)
            raise BusinessLogicError(f"PIX payment error: {exc}") from exc

    @staticmethod
    def process_webhook_event(event) -> None:
        """Process Stripe webhook event."""
        if event["type"] == "payment_intent.succeeded":
            payment_intent = event["data"]["object"]
            payment_id = payment_intent["metadata"].get("payment_id")
            if payment_id:
                try:
                    payment = Payment.objects.get(id=payment_id)
                    payment.status = "completed"
                    payment.paid_at = timezone.now()
                    payment.save(update_fields=["status", "paid_at", "updated_at"])
                    try:
                        appointment = payment.appointment
                    except Exception:  # noqa: BLE001
                        appointment = None

                    if appointment and appointment.status == "pending":
                        appointment.status = "confirmed"
                        appointment.save(update_fields=["status", "updated_at"])
                        notify_appointment_confirmed(appointment)

                    notify_payment_completed(payment)
                    logger.info("Payment %s completed via webhook", payment_id)
                except Payment.DoesNotExist:
                    logger.warning("Payment %s not found for webhook", payment_id)

    @staticmethod
    def refund_payment(payment: Payment) -> Payment:
        """Refund a completed payment."""
        import stripe

        stripe.api_key = settings.STRIPE_SECRET_KEY

        if payment.status != "completed":
            raise BusinessLogicError("Can only refund completed payments.")

        try:
            stripe.Refund.create(payment_intent=payment.stripe_payment_intent_id)
            payment.status = "refunded"
            payment.refunded_at = timezone.now()
            payment.refund_amount = payment.amount
            payment.save(update_fields=["status", "refunded_at", "refund_amount", "updated_at"])
            notify_payment_refunded(payment)
            logger.info("Payment %s refunded", payment.id)
            return payment
        except Exception as exc:
            logger.error("Stripe refund error: %s", exc)
            raise BusinessLogicError(f"Refund error: {exc}") from exc
