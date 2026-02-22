import pytest

from .factories import CompletedPaymentFactory, PaymentFactory


@pytest.mark.django_db
class TestPayment:
    def test_create_payment(self):
        payment = PaymentFactory()
        assert payment.pk is not None
        assert payment.status == "pending"
        assert payment.amount > 0

    def test_str_representation(self):
        payment = PaymentFactory(amount=150.00, payment_method="pix")
        assert "R$150" in str(payment)
        assert "pix" in str(payment)

    def test_completed_payment(self):
        payment = CompletedPaymentFactory()
        assert payment.status == "completed"
        assert payment.stripe_payment_intent_id.startswith("pi_")

    def test_default_currency_brl(self):
        payment = PaymentFactory()
        assert payment.currency == "BRL"
