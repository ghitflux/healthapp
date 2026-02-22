from django.urls import path

from . import views

app_name = "payments"

urlpatterns = [
    path("payments/create-intent/", views.CreatePaymentIntentView.as_view(), name="create-intent"),
    path("payments/pix/generate/", views.PIXGenerateView.as_view(), name="pix-generate"),
    path("payments/<uuid:pk>/status/", views.PaymentStatusView.as_view(), name="payment-status"),
    path("payments/<uuid:pk>/refund/", views.RefundView.as_view(), name="refund"),
    path("payments/history/", views.PaymentHistoryView.as_view(), name="payment-history"),
    path("webhooks/stripe/", views.StripeWebhookView.as_view(), name="stripe-webhook"),
]
