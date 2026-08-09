from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView

from users.views import MeView, PersonViewSet, SignUpView

router = DefaultRouter()
router.register(r"person", PersonViewSet)

urlpatterns = [
    path("token/", TokenObtainPairView.as_view(), name="token-obtain-pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("token/verify/", TokenVerifyView.as_view(), name="token-verify"),
    path("signup/", SignUpView.as_view(), name="signup"),
    path("me/", MeView.as_view(), name="me"),
    path("", include(router.urls)),
]
