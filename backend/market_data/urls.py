"""시세 API 라우팅.

`api/trading/` 아래에 함께 붙는다 — 프론트의 `VITE_API_BASE` 가 그 하나이고,
종목 화면에서 규율 데이터와 시세를 나란히 부르기 때문이다. 리소스 이름이 규율 앱과
겹치지 않도록 `market-` 접두를 붙였다.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from market_data.views import DailyCandleViewSet, MinuteCandleViewSet, SymbolViewSet

router = DefaultRouter()
router.register("market-symbol", SymbolViewSet, basename="market-symbol")
router.register("market-daily-candle", DailyCandleViewSet, basename="market-daily-candle")
router.register("market-minute-candle", MinuteCandleViewSet, basename="market-minute-candle")

urlpatterns = [path("", include(router.urls))]
