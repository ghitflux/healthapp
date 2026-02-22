from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.views import exception_handler


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


def custom_exception_handler(exc, context):
    """Custom exception handler that wraps DRF errors in a standard envelope."""
    response = exception_handler(exc, context)

    if response is not None:
        response.data = {
            "status": "error",
            "code": response.status_code,
            "errors": response.data if isinstance(response.data, list) else [response.data],
        }

    return response
