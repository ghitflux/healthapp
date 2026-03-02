from rest_framework.exceptions import NotAuthenticated, PermissionDenied, Throttled, ValidationError

from apps.core.exceptions import (
    BusinessLogicError,
    ConflictError,
    GoneError,
    _normalize_errors,
    custom_exception_handler,
)


class TestCustomExceptionHandler:
    def test_normalize_errors_handles_list_and_dict(self):
        errors = _normalize_errors([{"email": ["already exists"]}, "generic"])
        assert errors == [
            {"field": "email", "detail": "already exists"},
            {"field": "non_field_errors", "detail": "generic"},
        ]

    def test_validation_error_code(self):
        response = custom_exception_handler(ValidationError({"email": ["invalid"]}), context={})
        assert response.status_code == 400
        assert response.data["code"] == "validation_error"

    def test_not_authenticated_code(self):
        response = custom_exception_handler(NotAuthenticated("auth required"), context={})
        assert response.status_code == 401
        assert response.data["code"] == "not_authenticated"

    def test_permission_denied_code(self):
        response = custom_exception_handler(PermissionDenied("forbidden"), context={})
        assert response.status_code == 403
        assert response.data["code"] == "permission_denied"

    def test_throttled_includes_retry_after(self):
        response = custom_exception_handler(Throttled(wait=12), context={})
        assert response.status_code == 429
        assert response.data["code"] == "throttled"
        assert response.data["retry_after"] == 12

    def test_api_exceptions_custom_codes(self):
        conflict = custom_exception_handler(ConflictError("conflict"), context={})
        business = custom_exception_handler(BusinessLogicError("rule"), context={})
        gone = custom_exception_handler(GoneError("gone"), context={})

        assert conflict.status_code == 409
        assert conflict.data["code"] == "conflict"
        assert business.status_code == 422
        assert business.data["code"] == "business_logic_error"
        assert gone.status_code == 410
        assert gone.data["code"] == "gone"
