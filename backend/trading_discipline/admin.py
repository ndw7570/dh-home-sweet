"""admin 등록 — 시드 데이터 넣을 때만 쓴다. 화면은 프론트가 담당한다."""

from django.contrib import admin

from trading_discipline.models import (
    AffectedSecurity,
    AiDecisionFeedback,
    AiModelRun,
    AnnualInvestmentPlan,
    BrokerAccount,
    DailyInvestmentPlan,
    InvestmentPrinciple,
    MandatoryPrinciple,
    MarketDirection,
    MonthlyInvestmentPlan,
    MonthlyInvestmentPrinciple,
    Order,
    PerformanceRecord,
    PrincipleSource,
    QuarterlyInvestmentPlan,
    QuarterlyInvestmentPrinciple,
    DailySecurityPriceData,
    SecuritiesLoan,
    Security,
    TradingStrategy,
    TradingStrategyMethod,
    WeeklyInvestmentPlan,
    WeeklySecurityInvestmentPlan,
)


@admin.register(Security)
class SecurityAdmin(admin.ModelAdmin):
    list_display = (
        "id", "symbol", "name", "market", "account",
        "holding_quantity", "current_price", "is_active",
    )
    search_fields = ("symbol", "name", "sector")
    list_filter = ("market", "asset_type", "is_active", "is_deleted")


@admin.register(AnnualInvestmentPlan)
class AnnualPlanAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "market", "direction", "status", "valid_from", "valid_until")
    list_filter = ("status", "direction", "market")
    search_fields = ("title", "thesis")


@admin.register(WeeklyInvestmentPlan)
class WeeklyPlanAdmin(admin.ModelAdmin):
    list_display = (
        "id", "title", "monthly_plan", "predicted_trend",
        "confidence_score", "valid_from", "valid_until",
    )
    list_filter = ("scenario_planning", "predicted_trend")
    search_fields = ("title", "thesis")


@admin.register(WeeklySecurityInvestmentPlan)
class WeeklySecurityPlanAdmin(admin.ModelAdmin):
    list_display = (
        "id", "title", "weekly_plan", "security", "predicted_trend",
        "confidence_score", "predicted_price", "stop_loss_price",
    )
    list_filter = ("scenario_planning", "predicted_trend")
    search_fields = ("title", "thesis")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "id", "security", "action_type", "side", "quantity", "limit_price", "executed_at",
    )
    list_filter = ("action_type", "side", "order_type")


@admin.register(MandatoryPrinciple)
class MandatoryPrincipleAdmin(admin.ModelAdmin):
    list_display = ("id", "priority", "content")
    ordering = ("priority", "id")


admin.site.register(
    [
        BrokerAccount,
        SecuritiesLoan,
        DailySecurityPriceData,
        QuarterlyInvestmentPlan,
        MonthlyInvestmentPlan,
        DailyInvestmentPlan,
        PrincipleSource,
        InvestmentPrinciple,
        QuarterlyInvestmentPrinciple,
        MonthlyInvestmentPrinciple,
        MarketDirection,
        AffectedSecurity,
        TradingStrategy,
        TradingStrategyMethod,
        PerformanceRecord,
        AiModelRun,
        AiDecisionFeedback,
    ]
)

admin.site.site_header = "주식 규율 관리"
admin.site.site_title = "주식 규율 관리"
