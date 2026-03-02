from __future__ import annotations

import logging
from typing import Any

from .services import NotificationService
from .tasks import send_email_notification, send_push_notification

logger = logging.getLogger(__name__)


def _safe_delay(task, *args, **kwargs):
    try:
        task.delay(*args, **kwargs)
    except Exception:  # noqa: BLE001
        logger.exception("Failed to enqueue task %s", task.name)


def _format_time(value) -> str:
    if hasattr(value, "strftime"):
        return value.strftime("%H:%M")
    return str(value)[:5]


def notify_appointment_created(appointment) -> None:
    patient_title = "Agendamento criado"
    patient_body = "Agendamento criado com sucesso. Realize o pagamento em ate 30 minutos."
    NotificationService.create_notification(
        user=appointment.patient,
        notification_type="appointment",
        title=patient_title,
        body=patient_body,
        channel="push",
        metadata={"appointment_id": str(appointment.id)},
    )
    _safe_delay(
        send_push_notification,
        str(appointment.patient.id),
        patient_title,
        patient_body,
        {"appointment_id": str(appointment.id)},
    )

    doctor_title = "Novo agendamento pendente"
    doctor_body = (
        f"Paciente {appointment.patient.full_name} solicitou consulta em "
        f"{appointment.scheduled_date} as {_format_time(appointment.scheduled_time)}."
    )
    NotificationService.create_notification(
        user=appointment.doctor.user,
        notification_type="appointment",
        title=doctor_title,
        body=doctor_body,
        channel="push",
        metadata={"appointment_id": str(appointment.id)},
    )
    _safe_delay(
        send_push_notification,
        str(appointment.doctor.user.id),
        doctor_title,
        doctor_body,
        {"appointment_id": str(appointment.id)},
    )


def notify_appointment_confirmed(appointment) -> None:
    title = "Consulta confirmada"
    body = (
        f"Sua consulta com Dr. {appointment.doctor.user.full_name} foi confirmada para "
        f"{appointment.scheduled_date} as {_format_time(appointment.scheduled_time)}."
    )
    NotificationService.create_notification(
        user=appointment.patient,
        notification_type="appointment",
        title=title,
        body=body,
        channel="push",
        metadata={"appointment_id": str(appointment.id)},
    )
    _safe_delay(
        send_push_notification,
        str(appointment.patient.id),
        title,
        body,
        {"appointment_id": str(appointment.id)},
    )
    _safe_delay(send_email_notification, str(appointment.patient.id), title, body)


def notify_appointment_cancelled(appointment, cancelled_by) -> None:
    cancelled_by_role = getattr(cancelled_by, "role", "")
    if cancelled_by_role == "patient":
        title = "Consulta cancelada pelo paciente"
        body = (
            f"Paciente {appointment.patient.full_name} cancelou a consulta de "
            f"{appointment.scheduled_date} as {_format_time(appointment.scheduled_time)}."
        )
        target_user = appointment.doctor.user
    else:
        title = "Sua consulta foi cancelada"
        reason = appointment.cancellation_reason or "Sem motivo informado."
        body = (
            f"Sua consulta de {appointment.scheduled_date} as {_format_time(appointment.scheduled_time)} "
            f"foi cancelada. Motivo: {reason}"
        )
        target_user = appointment.patient

    NotificationService.create_notification(
        user=target_user,
        notification_type="appointment",
        title=title,
        body=body,
        channel="push",
        metadata={"appointment_id": str(appointment.id)},
    )
    _safe_delay(send_push_notification, str(target_user.id), title, body, {"appointment_id": str(appointment.id)})
    if target_user == appointment.patient:
        _safe_delay(send_email_notification, str(target_user.id), title, body)


def notify_payment_completed(payment) -> None:
    title = "Pagamento confirmado"
    body = "Pagamento confirmado. Sua consulta esta agendada."
    metadata: dict[str, Any] = {"payment_id": str(payment.id)}
    if hasattr(payment, "appointment"):
        metadata["appointment_id"] = str(payment.appointment.id)

    NotificationService.create_notification(
        user=payment.user,
        notification_type="payment",
        title=title,
        body=body,
        channel="push",
        metadata=metadata,
    )
    _safe_delay(send_push_notification, str(payment.user.id), title, body, metadata)


def notify_payment_failed(payment) -> None:
    title = "Falha no pagamento"
    body = "Nao foi possivel confirmar seu pagamento. Tente novamente."
    NotificationService.create_notification(
        user=payment.user,
        notification_type="payment",
        title=title,
        body=body,
        channel="push",
        metadata={"payment_id": str(payment.id), "status": "failed"},
    )
    _safe_delay(send_push_notification, str(payment.user.id), title, body, {"payment_id": str(payment.id)})


def notify_payment_refunded(payment) -> None:
    title = "Reembolso processado"
    body = (
        f"Reembolso de R$ {payment.refund_amount or payment.amount} processado. "
        "Prazo estimado: 5 a 10 dias uteis."
    )
    NotificationService.create_notification(
        user=payment.user,
        notification_type="payment",
        title=title,
        body=body,
        channel="email",
        metadata={"payment_id": str(payment.id)},
    )
    _safe_delay(send_email_notification, str(payment.user.id), title, body)
