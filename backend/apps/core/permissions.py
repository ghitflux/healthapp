from rest_framework.permissions import BasePermission


class IsOwner(BasePermission):
    """Allows access only to users with role 'owner'."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "owner")


class IsConvenioAdmin(BasePermission):
    """Allows access only to users with role 'convenio_admin'."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "convenio_admin")


class IsDoctor(BasePermission):
    """Allows access only to users with role 'doctor'."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "doctor")


class IsPatient(BasePermission):
    """Allows access only to users with role 'patient'."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "patient")


class IsOwnerOrConvenioAdmin(BasePermission):
    """Allows access to owner or convenio_admin."""

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ("owner", "convenio_admin")
        )
