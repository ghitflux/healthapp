import logging

from rest_framework import status
from rest_framework.exceptions import (
    APIException,
    AuthenticationFailed,
    NotAuthenticated,
    NotFound,
    PermissionDenied,
    Throttled,
    ValidationError,
)
from rest_framework.views import exception_handler

logger = logging.getLogger(__name__)


class BusinessLogicError(APIException):
    """422 Unprocessable Entity — business rule violation."""

    status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    default_detail = "A business rule was violated."
    default_code = "business_logic_error"


class ConflictError(APIException):
    """409 Conflict — resource state conflict (e.g., slot already booked)."""

    status_code = status.HTTP_409_CONFLICT
    default_detail = "The request conflicts with the current state of the resource."
    default_code = "conflict"


class GoneError(APIException):
    """410 Gone — resource no longer available."""

    status_code = status.HTTP_410_GONE
    default_detail = "The requested resource is no longer available."
    default_code = "gone"


def _normalize_errors(data) -> list:
    """Convert DRF error data into a list of {field, detail} dicts."""
    errors = []
    if isinstance(data, list):
        for item in data:
            if isinstance(item, dict):
                for field, messages in item.items():
                    if isinstance(messages, list):
                        for msg in messages:
                            errors.append({"field": field, "detail": str(msg)})
                    else:
                        errors.append({"field": field, "detail": str(messages)})
            else:
                errors.append({"field": "non_field_errors", "detail": str(item)})
    elif isinstance(data, dict):
        for field, messages in data.items():
            if isinstance(messages, list):
                for msg in messages:
                    errors.append({"field": field, "detail": str(msg)})
            else:
                errors.append({"field": field, "detail": str(messages)})
    else:
        errors.append({"field": "non_field_errors", "detail": str(data)})
    return errors


def custom_exception_handler(exc, context):
    """Custom exception handler that wraps DRF errors in a standard envelope."""
    response = exception_handler(exc, context)

    if response is None:
        logger.exception("Unhandled server error in %s", context.get("view"))
        return None

    errors = _normalize_errors(response.data)

    if isinstance(exc, ValidationError):
        code = "validation_error"
    elif isinstance(exc, AuthenticationFailed):
        code = "authentication_failed"
    elif isinstance(exc, NotAuthenticated):
        code = "not_authenticated"
    elif isinstance(exc, PermissionDenied):
        code = "permission_denied"
    elif isinstance(exc, NotFound):
        code = "not_found"
    elif isinstance(exc, Throttled):
        code = "throttled"
    elif isinstance(exc, ConflictError):
        code = "conflict"
    elif isinstance(exc, BusinessLogicError):
        code = "business_logic_error"
    elif isinstance(exc, GoneError):
        code = "gone"
    else:
        code = getattr(exc, "default_code", "error")

    envelope: dict = {
        "status": "error",
        "errors": errors,
        "code": code,
    }

    wait = getattr(exc, "wait", None)
    if isinstance(exc, Throttled) and wait is not None:
        envelope["retry_after"] = int(wait)

    response.data = envelope
    return response
