"""URL configuration — 주식 규율 관리."""

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
    path("api/trading/", include("trading_discipline.urls")),
    # 시세 API — 같은 base 아래에 둔다. 리소스명이 `market-` 로 시작해 규율 앱과 겹치지 않는다.
    path("api/trading/", include("market_data.urls")),

    # OpenAPI 스키마 / Swagger UI / Redoc
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path("docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]
