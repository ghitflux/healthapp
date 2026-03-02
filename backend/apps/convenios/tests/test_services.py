import pytest

from apps.convenios.services import ConvenioDashboardService
from apps.convenios.tests.factories import ConvenioFactory


@pytest.mark.django_db
class TestConvenioDashboardService:
    def test_get_dashboard_data_returns_expected_shape(self):
        convenio = ConvenioFactory()

        data = ConvenioDashboardService.get_dashboard_data(convenio)

        assert data["total_doctors"] == 0
        assert data["total_appointments_month"] == 0
        assert str(data["total_revenue_month"]) == "0.00"
        assert data["occupancy_rate"] == 0.0
        assert data["cancellation_rate"] == 0.0
        assert "revenue_comparison" in data
        assert "top_doctors" in data
        assert "appointments_by_status" in data
        assert "revenue_by_day" in data
