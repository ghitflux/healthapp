from django.urls import include, path
from rest_framework.routers import SimpleRouter

from . import views

app_name = "appointments"

router = SimpleRouter()
router.register("appointments", views.AppointmentViewSet, basename="appointment")

urlpatterns = [
    path("", include(router.urls)),
]
