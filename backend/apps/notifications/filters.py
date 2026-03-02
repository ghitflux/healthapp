import django_filters

from .models import Notification


class NotificationFilter(django_filters.FilterSet):
    type = django_filters.CharFilter()
    is_read = django_filters.BooleanFilter()
    channel = django_filters.CharFilter()

    class Meta:
        model = Notification
        fields = ["type", "is_read", "channel"]
