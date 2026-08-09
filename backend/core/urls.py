"""URL configuration — asset planner."""

from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    path("admin/", admin.site.urls),

    # 인증
    path("api/auth/", include("users.urls")),

    # 도메인 API — 프론트 VITE_API_BASE 와 반드시 일치해야 한다.
    path("api/planner", include("asset_planning.urls")),

    # OpenAPI 스키마 / Swagger UI / Redoc
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path("docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]
