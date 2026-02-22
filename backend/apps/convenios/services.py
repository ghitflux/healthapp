import logging

logger = logging.getLogger(__name__)


class ConvenioDashboardService:
    """Service for computing convenio dashboard KPIs."""

    @staticmethod
    def get_dashboard_data(convenio):
        """Compute dashboard metrics for a convenio."""
        # TODO: Implement actual queries
        return {
            "total_doctors": 0,
            "total_appointments_month": 0,
            "total_revenue_month": 0,
            "occupancy_rate": 0.0,
            "cancellation_rate": 0.0,
        }
