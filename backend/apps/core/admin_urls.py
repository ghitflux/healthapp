from django.urls import path

from . import admin_views

urlpatterns = [
    path("dashboard/", admin_views.OwnerDashboardView.as_view(), name="owner-dashboard"),
    path("convenios/", admin_views.OwnerConvenioListView.as_view(), name="owner-convenio-list"),
    path("convenios/<uuid:pk>/", admin_views.OwnerConvenioDetailView.as_view(), name="owner-convenio-detail"),
    path(
        "convenios/<uuid:pk>/suspend/",
        admin_views.OwnerConvenioSuspendView.as_view(),
        name="owner-convenio-suspend",
    ),
    path(
        "convenios/<uuid:pk>/approve/",
        admin_views.OwnerConvenioApproveView.as_view(),
        name="owner-convenio-approve",
    ),
    path("users/", admin_views.OwnerUserListView.as_view(), name="owner-user-list"),
    path("audit-logs/", admin_views.OwnerAuditLogView.as_view(), name="owner-audit-logs"),
    path("financial/", admin_views.OwnerFinancialReportView.as_view(), name="owner-financial"),
]
