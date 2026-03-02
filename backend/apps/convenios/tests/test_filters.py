import pytest

from apps.convenios.filters import ConvenioFilter
from apps.convenios.tests.factories import ConvenioFactory


@pytest.mark.django_db
class TestConvenioFilter:
    def test_filters_by_name(self):
        target = ConvenioFactory(name="Clinica Vida Nova")
        ConvenioFactory(name="Hospital Central")

        queryset = ConvenioFilter(
            data={"name": "vida"},
            queryset=ConvenioFactory._meta.model.objects.all(),
        ).qs

        assert list(queryset) == [target]

    def test_filters_by_subscription_plan_and_active(self):
        target = ConvenioFactory(subscription_plan="professional", is_active=True)
        ConvenioFactory(subscription_plan="starter", is_active=True)
        ConvenioFactory(subscription_plan="professional", is_active=False)

        queryset = ConvenioFilter(
            data={"subscription_plan": "professional", "is_active": "true"},
            queryset=ConvenioFactory._meta.model.objects.all(),
        ).qs

        assert list(queryset) == [target]
