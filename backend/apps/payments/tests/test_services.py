import sys
import types
from decimal import Decimal

import pytest
from django.utils import timezone

from apps.core.exceptions import BusinessLogicError
from apps.payments.services import StripeService
from apps.payments.tests.factories import CompletedPaymentFactory, PaymentFactory


@pytest.mark.django_db
class TestStripeService:
    @staticmethod
    def _patch_stripe(monkeypatch, payment_intent_create=None, refund_create=None):
        class _PaymentIntent:
            @staticmethod
            def create(**kwargs):
                if payment_intent_create:
                    return payment_intent_create(**kwargs)
                return types.SimpleNamespace(id="pi_test_123", client_secret="cs_test_123")

        class _Refund:
            @staticmethod
            def create(**kwargs):
                if refund_create:
                    return refund_create(**kwargs)
                return {"id": "re_test"}

        dummy = types.SimpleNamespace(PaymentIntent=_PaymentIntent, Refund=_Refund)
        monkeypatch.setitem(sys.modules, "stripe", dummy)

    def test_create_payment_intent_success(self, monkeypatch, settings):
        settings.STRIPE_SECRET_KEY = "sk_test"
        payment = PaymentFactory(amount=Decimal("123.45"), currency="BRL")
        self._patch_stripe(monkeypatch)

        result = StripeService.create_payment_intent(payment)

        payment.refresh_from_db()
        assert result["payment_intent_id"] == "pi_test_123"
        assert result["client_secret"] == "cs_test_123"
        assert payment.status == "processing"
        assert payment.stripe_payment_intent_id == "pi_test_123"

    def test_create_payment_intent_failure(self, monkeypatch, settings):
        settings.STRIPE_SECRET_KEY = "sk_test"
        payment = PaymentFactory(amount=Decimal("50.00"), currency="BRL")

        def _raise_error(**kwargs):
            raise RuntimeError("stripe unavailable")

        self._patch_stripe(monkeypatch, payment_intent_create=_raise_error)

        with pytest.raises(BusinessLogicError):
            StripeService.create_payment_intent(payment)

    def test_create_pix_payment_success(self, monkeypatch, settings):
        settings.STRIPE_SECRET_KEY = "sk_test"
        payment = PaymentFactory(amount=Decimal("89.90"))
        self._patch_stripe(monkeypatch)

        result = StripeService.create_pix_payment(payment)

        payment.refresh_from_db()
        assert result["payment_intent_id"] == "pi_test_123"
        assert payment.status == "processing"

    def test_process_webhook_event_marks_payment_completed(self):
        payment = PaymentFactory(status="processing")

        StripeService.process_webhook_event(
            {
                "type": "payment_intent.succeeded",
                "data": {"object": {"metadata": {"payment_id": str(payment.id)}}},
            }
        )

        payment.refresh_from_db()
        assert payment.status == "completed"
        assert payment.paid_at is not None

    def test_refund_payment_requires_completed_status(self, monkeypatch, settings):
        settings.STRIPE_SECRET_KEY = "sk_test"
        payment = PaymentFactory(status="pending")
        self._patch_stripe(monkeypatch)

        with pytest.raises(BusinessLogicError):
            StripeService.refund_payment(payment)

    def test_refund_payment_success(self, monkeypatch, settings):
        settings.STRIPE_SECRET_KEY = "sk_test"
        payment = CompletedPaymentFactory(stripe_payment_intent_id="pi_refund")
        self._patch_stripe(monkeypatch)

        result = StripeService.refund_payment(payment)

        result.refresh_from_db()
        assert result.status == "refunded"
        assert result.refunded_at is not None
        assert result.refunded_at <= timezone.now()
        assert str(result.refund_amount) == str(result.amount)
