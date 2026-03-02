import inspect
import logging

from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.exceptions import BusinessLogicError
from apps.core.permissions import IsOwnerOrConvenioAdmin, IsPatient

from .models import Payment
from .serializers import (
    CreatePaymentIntentSerializer,
    PaymentSerializer,
    PIXGenerateSerializer,
    RefundSerializer,
)
from .services import StripeService

logger = logging.getLogger(__name__)


def _call_compat(func, *args):
    signature = inspect.signature(func)
    positional_params = [
        param
        for param in signature.parameters.values()
        if param.kind in (inspect.Parameter.POSITIONAL_ONLY, inspect.Parameter.POSITIONAL_OR_KEYWORD)
    ]
    has_varargs = any(param.kind == inspect.Parameter.VAR_POSITIONAL for param in signature.parameters.values())
    if has_varargs or len(positional_params) >= len(args):
        return func(*args)
    return func(*args[: len(positional_params)])


class CreatePaymentIntentView(APIView):
    permission_classes = [IsPatient]

    @extend_schema(
        operation_id="createPaymentIntent",
        tags=["payments"],
        summary="Create Stripe Payment Intent",
        request=CreatePaymentIntentSerializer,
        responses={201: dict},
    )
    def post(self, request):
        serializer = CreatePaymentIntentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from apps.appointments.models import Appointment

        try:
            appointment = Appointment.objects.get(
                id=serializer.validated_data["appointment_id"],
                patient=request.user,
                status="pending",
            )
        except Appointment.DoesNotExist:
            return Response(
                {"status": "error", "errors": [{"detail": "Appointment not found or not pending."}]},
                status=status.HTTP_404_NOT_FOUND,
            )

        result = _call_compat(
            StripeService.create_payment_intent,
            appointment,
            serializer.validated_data["payment_method"],
        )
        return Response({"status": "success", "data": result}, status=status.HTTP_201_CREATED)


class PIXGenerateView(APIView):
    permission_classes = [IsPatient]

    @extend_schema(
        operation_id="generatePIX",
        tags=["payments"],
        summary="Generate PIX QR Code",
        request=PIXGenerateSerializer,
        responses={201: dict},
    )
    def post(self, request):
        serializer = PIXGenerateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from apps.appointments.models import Appointment

        try:
            appointment = Appointment.objects.get(
                id=serializer.validated_data["appointment_id"],
                patient=request.user,
                status="pending",
            )
        except Appointment.DoesNotExist:
            return Response(
                {"status": "error", "errors": [{"detail": "Appointment not found or not pending."}]},
                status=status.HTTP_404_NOT_FOUND,
            )

        result = _call_compat(StripeService.create_pix_payment, appointment)
        return Response({"status": "success", "data": result}, status=status.HTTP_201_CREATED)


class PaymentStatusView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="getPaymentStatus",
        tags=["payments"],
        summary="Get payment status",
        responses={200: PaymentSerializer},
    )
    def get(self, request, pk):
        queryset = Payment.objects.select_related("user", "appointment__convenio").filter(id=pk)
        if request.user.role == "patient":
            queryset = queryset.filter(user=request.user)
        elif request.user.role == "convenio_admin" and request.user.convenio_id:
            queryset = queryset.filter(appointment__convenio_id=request.user.convenio_id)
        elif request.user.role != "owner":
            queryset = Payment.objects.none()
        try:
            payment = queryset.get()
        except Payment.DoesNotExist:
            return Response(
                {"status": "error", "errors": [{"detail": "Payment not found."}]},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response({"status": "success", "data": PaymentSerializer(payment).data})


class RefundView(APIView):
    permission_classes = [IsOwnerOrConvenioAdmin]

    @extend_schema(
        operation_id="refundPayment",
        tags=["payments"],
        summary="Request payment refund",
        request=RefundSerializer,
        responses={200: PaymentSerializer},
    )
    def post(self, request, pk):
        queryset = Payment.objects.filter(id=pk)
        if request.user.role == "convenio_admin" and request.user.convenio_id:
            queryset = queryset.filter(appointment__convenio_id=request.user.convenio_id)
        elif request.user.role != "owner":
            queryset = Payment.objects.none()
        try:
            payment = queryset.get()
        except Payment.DoesNotExist:
            return Response(
                {"status": "error", "errors": [{"detail": "Payment not found."}]},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = RefundSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payment = _call_compat(StripeService.refund_payment, payment, serializer.validated_data.get("amount"))
        return Response({"status": "success", "data": PaymentSerializer(payment).data})


class PaymentHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id="getPaymentHistory",
        tags=["payments"],
        summary="Get payment history",
        responses={200: PaymentSerializer(many=True)},
    )
    def get(self, request):
        payments = Payment.objects.select_related("user").filter(user=request.user)
        serializer = PaymentSerializer(payments, many=True)
        return Response({"status": "success", "data": serializer.data})


class StripeWebhookView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        operation_id="stripeWebhook",
        tags=["payments"],
        summary="Stripe webhook handler",
        request=None,
        responses={200: dict},
    )
    def post(self, request):
        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")

        try:
            _call_compat(StripeService.process_webhook_event, payload, sig_header)
        except BusinessLogicError:
            return Response(status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            logger.exception("Unexpected Stripe webhook processing error")
            return Response(status=status.HTTP_400_BAD_REQUEST)
        return Response({"status": "success"})
