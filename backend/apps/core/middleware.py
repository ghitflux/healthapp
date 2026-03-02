from __future__ import annotations

from django.http import JsonResponse

from .services import PlatformSettingsService


class MaintenanceModeMiddleware:
    """Return 503 while platform is in maintenance mode."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path
        if path.startswith("/api/v1/admin-panel/"):
            return self.get_response(request)

        settings_obj = PlatformSettingsService.get_settings()
        if settings_obj.maintenance_mode:
            message = settings_obj.maintenance_message or "Plataforma em manutencao."
            return JsonResponse(
                {"status": "error", "errors": [{"detail": message}], "code": "maintenance_mode"},
                status=503,
            )
        return self.get_response(request)
