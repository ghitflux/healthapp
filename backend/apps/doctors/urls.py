from django.urls import include, path
from rest_framework.routers import SimpleRouter

from . import views

app_name = "doctors"

router = SimpleRouter()
router.register("doctors", views.DoctorViewSet, basename="doctor")
router.register("schedules", views.DoctorScheduleViewSet, basename="schedule")
router.register("schedule-exceptions", views.ScheduleExceptionViewSet, basename="schedule-exception")

urlpatterns = [
    path("", include(router.urls)),
]
