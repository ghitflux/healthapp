import pytest

from apps.convenios.services import ConvenioDashboardService
from apps.convenios.tests.factories import ConvenioFactory


@pytest.mark.django_db
class TestConvenioDashboardService:
    def test_get_dashboard_data_returns_expected_shape(self):
        convenio = ConvenioFactory()

        data = ConvenioDashboardService.get_dashboard_data(convenio)

        assert data == {
            "total_doctors": 0,
            "total_appointments_month": 0,
            "total_revenue_month": 0,
            "occupancy_rate": 0.0,
            "cancellation_rate": 0.0,
        }
