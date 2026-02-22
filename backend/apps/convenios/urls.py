from django.urls import include, path
from rest_framework.routers import SimpleRouter

from . import views

app_name = "convenios"

router = SimpleRouter()
router.register("convenios", views.ConvenioViewSet, basename="convenio")
router.register("exam-types", views.ExamTypeViewSet, basename="exam-type")

urlpatterns = [
    path("", include(router.urls)),
]
