from django.urls import include, path
from rest_framework.routers import SimpleRouter

from . import views

app_name = "convenios"

router = SimpleRouter()
router.register("convenios", views.ConvenioViewSet, basename="convenio")
router.register("exam-types", views.ExamTypeViewSet, basename="exam-type")

convenio_dashboard_view = views.ConvenioViewSet.as_view({"get": "dashboard"})

urlpatterns = [
    path("convenios/dashboard/", convenio_dashboard_view, name="convenio-dashboard"),
    path(
        "convenios/reports/financial/",
        views.ConvenioFinancialReportView.as_view(),
        name="convenio-financial-report",
    ),
    path(
        "convenios/export/appointments/",
        views.ConvenioExportView.as_view(),
        name="convenio-export-appointments",
    ),
    path("", include(router.urls)),
]
