import django_filters

from .models import Doctor


class DoctorFilter(django_filters.FilterSet):
    specialty = django_filters.CharFilter(lookup_expr="icontains")
    convenio = django_filters.UUIDFilter(field_name="convenio_id")
    city = django_filters.CharFilter(field_name="convenio__address__city", lookup_expr="icontains")
    name = django_filters.CharFilter(field_name="user__full_name", lookup_expr="icontains")
    is_available = django_filters.BooleanFilter()
    min_price = django_filters.NumberFilter(field_name="consultation_price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="consultation_price", lookup_expr="lte")

    class Meta:
        model = Doctor
        fields = ["specialty", "convenio", "is_available"]
