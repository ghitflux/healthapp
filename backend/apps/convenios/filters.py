import django_filters

from .models import Convenio


class ConvenioFilter(django_filters.FilterSet):
    name = django_filters.CharFilter(lookup_expr="icontains")
    subscription_plan = django_filters.CharFilter()
    is_active = django_filters.BooleanFilter()

    class Meta:
        model = Convenio
        fields = ["name", "subscription_plan", "is_active"]
