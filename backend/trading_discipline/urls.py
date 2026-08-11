from django.urls import include, path
from rest_framework.routers import DefaultRouter

from trading_discipline.views.ai import AiDecisionFeedbackViewSet, AiModelRunViewSet
from trading_discipline.views.dashboard import (
    AiDigestView,
    AiFeedbackForView,
    CascadeView,
    ChoicesView,
    ExecutionCompareView,
    HomeBoardView,
    PerformanceSummaryView,
    SecurityPlansView,
)
from trading_discipline.views.execution import OrderViewSet, PerformanceRecordViewSet
from trading_discipline.views.market import AffectedSecurityViewSet, MarketDirectionViewSet
from trading_discipline.views.planning import (
    AnnualPlanViewSet,
    DailyPlanViewSet,
    MonthlyPlanViewSet,
    QuarterlyPlanViewSet,
    WeeklyPlanViewSet,
)
from trading_discipline.views.portfolio import (
    BrokerAccountViewSet,
    DailySecurityPriceDataViewSet,
    SecuritiesLoanViewSet,
    SecurityViewSet,
)
from trading_discipline.views.principle import (
    InvestmentPrincipleViewSet,
    MandatoryPrincipleViewSet,
    MonthlyPrincipleViewSet,
    PrincipleSourceViewSet,
    QuarterlyPrincipleViewSet,
)
from trading_discipline.views.strategy import TradingStrategyMethodViewSet, TradingStrategyViewSet

router = DefaultRouter()

# portfolio
router.register(r"broker-account", BrokerAccountViewSet)
router.register(r"security", SecurityViewSet)
router.register(r"securities-loan", SecuritiesLoanViewSet)
router.register(r"security-price-data", DailySecurityPriceDataViewSet)

# planning — 연 → 분기 → 월 → 주 → 일
router.register(r"annual-plan", AnnualPlanViewSet)
router.register(r"quarterly-plan", QuarterlyPlanViewSet)
router.register(r"monthly-plan", MonthlyPlanViewSet)
router.register(r"weekly-plan", WeeklyPlanViewSet)
router.register(r"daily-plan", DailyPlanViewSet)

# principle
router.register(r"mandatory-principle", MandatoryPrincipleViewSet)
router.register(r"principle-source", PrincipleSourceViewSet)
router.register(r"investment-principle", InvestmentPrincipleViewSet)
router.register(r"quarterly-principle", QuarterlyPrincipleViewSet)
router.register(r"monthly-principle", MonthlyPrincipleViewSet)

# market
router.register(r"market-direction", MarketDirectionViewSet)
router.register(r"affected-security", AffectedSecurityViewSet)

# strategy
router.register(r"trading-strategy", TradingStrategyViewSet)
router.register(r"trading-strategy-method", TradingStrategyMethodViewSet)

# execution
router.register(r"order", OrderViewSet)
router.register(r"performance-record", PerformanceRecordViewSet)

# ai
router.register(r"ai-model-run", AiModelRunViewSet)
router.register(r"ai-decision-feedback", AiDecisionFeedbackViewSet)

urlpatterns = [
    # 화면 전용 조회 — 라우터보다 먼저 와야 경로가 안 먹힌다.
    path("cascade/", CascadeView.as_view(), name="cascade"),
    path("security/<int:security_id>/plans/", SecurityPlansView.as_view(), name="security-plans"),
    path("home/board/", HomeBoardView.as_view(), name="home-board"),
    path("execution/compare/", ExecutionCompareView.as_view(), name="execution-compare"),
    path("performance/summary/", PerformanceSummaryView.as_view(), name="performance-summary"),
    path("ai/digest/", AiDigestView.as_view(), name="ai-digest"),
    path("ai/feedback-for/", AiFeedbackForView.as_view(), name="ai-feedback-for"),
    path("meta/choices/", ChoicesView.as_view(), name="meta-choices"),
    path("", include(router.urls)),
]
