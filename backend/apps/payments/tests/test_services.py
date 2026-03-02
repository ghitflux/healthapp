import sys
import types
from decimal import Decimal

import pytest

from apps.appointments.tests.factories import AppointmentFactory
from apps.core.exceptions import BusinessLogicError
from apps.payments.models import Payment
from apps.payments.services import StripeService
from apps.payments.tests.factories import CompletedPaymentFactory


@pytest.mark.django_db
class TestStripeService:
    def _patch_stripe(self, monkeypatch, payment_intent_create=None, webhook_construct=None, refund_create=None):
        class _PaymentIntent:
            @staticmethod
            def create(**kwargs):
                if payment_intent_create:
                    return payment_intent_create(**kwargs)
                return types.SimpleNamespace(id="pi_test_123", client_secret="cs_test_123", next_action={})

        class _Webhook:
            @staticmethod
            def construct_event(payload, sig_header, secret):
                del payload, sig_header, secret
                if webhook_construct:
                    return webhook_construct()
                return {"type": "payment_intent.succeeded", "data": {"object": {"metadata": {}}}}

        class _Refund:
            @staticmethod
            def create(**kwargs):
                if refund_create:
                    return refund_create(**kwargs)
                return {"id": "re_test"}

        dummy = types.SimpleNamespace(PaymentIntent=_PaymentIntent, Webhook=_Webhook, Refund=_Refund)
        monkeypatch.setitem(sys.modules, "stripe", dummy)

    def test_create_payment_intent_success(self, monkeypatch, settings):
        settings.STRIPE_SECRET_KEY = "sk_test"
        appointment = AppointmentFactory(status="pending", price=Decimal("150.00"))
        captured = {}

        def _fake_create(**kwargs):
            captured.update(kwargs)
            return types.SimpleNamespace(id="pi_ok", client_secret="cs_ok", next_action={})

        self._patch_stripe(monkeypatch, payment_intent_create=_fake_create)

        result = StripeService.create_payment_intent(appointment, payment_method="credit_card")
        payment = Payment.objects.get(id=result["payment_id"])

        assert result["payment_intent_id"] == "pi_ok"
        assert captured["amount"] == 15000
        assert payment.status == "processing"

    def test_create_pix_payment_success(self, monkeypatch, settings):
        settings.STRIPE_SECRET_KEY = "sk_test"
        appointment = AppointmentFactory(status="pending", price=Decimal("89.90"))

        def _fake_create(**kwargs):
            del kwargs
            return types.SimpleNamespace(
                id="pi_pix",
                client_secret="cs_pix",
                next_action={"pix_display_qr_code": {"qr_code": "img", "copy_paste": "code"}},
            )

        self._patch_stripe(monkeypatch, payment_intent_create=_fake_create)

        result = StripeService.create_pix_payment(appointment)
        payment = Payment.objects.get(id=result["payment_id"])

        assert result["payment_intent_id"] == "pi_pix"
        assert payment.status == "processing"
        assert payment.pix_expiration is not None

    def test_process_webhook_payment_succeeded(self, monkeypatch, settings):
        settings.STRIPE_SECRET_KEY = "sk_test"
        settings.STRIPE_WEBHOOK_SECRET = "whsec"
        payment = Payment.objects.create(
            user=AppointmentFactory().patient,
            amount=Decimal("120.00"),
            payment_method="pix",
            status="processing",
            stripe_payment_intent_id="pi_webhook",
        )
        appointment = AppointmentFactory(status="pending", payment=payment)

        def _event():
            return {
                "type": "payment_intent.succeeded",
                "data": {"object": {"metadata": {"payment_id": str(payment.id)}}},
            }

        self._patch_stripe(monkeypatch, webhook_construct=_event)

        StripeService.process_webhook_event(b"{}", "sig")

        payment.refresh_from_db()
        appointment.refresh_from_db()
        assert payment.status == "completed"
        assert payment.paid_at is not None
        assert appointment.status == "confirmed"

    def test_process_webhook_payment_failed(self, monkeypatch, settings):
        settings.STRIPE_SECRET_KEY = "sk_test"
        settings.STRIPE_WEBHOOK_SECRET = "whsec"
        payment = Payment.objects.create(
            user=AppointmentFactory().patient,
            amount=Decimal("90.00"),
            payment_method="credit_card",
            status="processing",
        )

        def _event():
            return {
                "type": "payment_intent.payment_failed",
                "data": {"object": {"metadata": {"payment_id": str(payment.id)}}},
            }

        self._patch_stripe(monkeypatch, webhook_construct=_event)
        StripeService.process_webhook_event(b"{}", "sig")
        payment.refresh_from_db()
        assert payment.status == "failed"

    def test_refund_payment_full(self, monkeypatch, settings):
        settings.STRIPE_SECRET_KEY = "sk_test"
        payment = CompletedPaymentFactory(stripe_payment_intent_id="pi_refund", amount=Decimal("200.00"))
        self._patch_stripe(monkeypatch)

        result = StripeService.refund_payment(payment)
        result.refresh_from_db()

        assert result.status == "refunded"
        assert result.refund_amount == Decimal("200.00")

    def test_refund_payment_partial(self, monkeypatch, settings):
        settings.STRIPE_SECRET_KEY = "sk_test"
        payment = CompletedPaymentFactory(stripe_payment_intent_id="pi_refund2", amount=Decimal("200.00"))
        self._patch_stripe(monkeypatch)

        result = StripeService.refund_payment(payment, amount=Decimal("50.00"))
        result.refresh_from_db()

        assert result.status == "refunded"
        assert result.refund_amount == Decimal("50.00")

    def test_refund_payment_requires_completed_status(self, monkeypatch, settings):
        settings.STRIPE_SECRET_KEY = "sk_test"
        payment = Payment.objects.create(
            user=AppointmentFactory().patient,
            amount=Decimal("100.00"),
            payment_method="pix",
            status="pending",
        )
        self._patch_stripe(monkeypatch)

        with pytest.raises(BusinessLogicError):
            StripeService.refund_payment(payment, amount=Decimal("10.00"))
