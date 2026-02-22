from rest_framework.permissions import BasePermission


class IsAccountOwner(BasePermission):
    """Allows access only to the owner of the account being accessed."""

    def has_object_permission(self, request, view, obj):
        return obj == request.user
