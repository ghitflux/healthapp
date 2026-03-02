import django_filters
from django.contrib.postgres.search import TrigramSimilarity
from django.db import models
from django.db.models import Q
from django.db.models.functions import Cast, Greatest

from .models import Doctor


class DoctorFilter(django_filters.FilterSet):
    specialty = django_filters.CharFilter(lookup_expr="icontains")
    convenio = django_filters.UUIDFilter(field_name="convenio_id")
    city = django_filters.CharFilter(field_name="convenio__address__city", lookup_expr="icontains")
    name = django_filters.CharFilter(field_name="user__full_name", lookup_expr="icontains")
    is_available = django_filters.BooleanFilter()
    min_price = django_filters.NumberFilter(field_name="consultation_price", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="consultation_price", lookup_expr="lte")
    search = django_filters.CharFilter(method="filter_search")

    def filter_search(self, queryset, name, value):
        del name
        if not value:
            return queryset
        normalized_value = value.strip()
        fuzzy_prefix = normalized_value[:4]

        subspecialties_as_text = Cast("subspecialties", models.TextField())
        return (
            queryset.annotate(
                similarity=Greatest(
                    TrigramSimilarity("user__full_name", normalized_value),
                    TrigramSimilarity("specialty", normalized_value),
                    TrigramSimilarity(subspecialties_as_text, normalized_value),
                )
            )
            .filter(
                Q(similarity__gte=0.05)
                | Q(user__full_name__icontains=normalized_value)
                | Q(specialty__icontains=normalized_value)
                | Q(specialty__icontains=fuzzy_prefix)
            )
            .order_by("-similarity", "-rating")
        )

    class Meta:
        model = Doctor
        fields = ["specialty", "convenio", "is_available", "search"]
