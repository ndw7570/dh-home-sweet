from rest_framework import serializers

from trading_discipline.models import DailyInvestmentPlan
from trading_discipline.serializers._base import DomainSerializer
from trading_discipline.serializers.planning._common import PlanSerializerBase
from trading_discipline.serializers.planning.weekly_security_plan import (
    WeeklySecurityPlanParentSerializer,
)
from trading_discipline.serializers.portfolio.security import SecurityParentSerializer


class DailyPlanListSerializer(PlanSerializerBase):
    weekly_security_plan_detail = WeeklySecurityPlanParentSerializer(
        source="weekly_security_plan", read_only=True
    )
    security_detail = serializers.SerializerMethodField()

    class Meta:
        model = DailyInvestmentPlan
        fields = "__all__"

    def get_security_detail(self, obj):
        """일계획은 종목 FK 가 없다 — 주투자종목별계획을 거쳐 종목을 꺼낸다."""
        security = obj.security
        return SecurityParentSerializer(security).data if security else None


class DailyPlanParentSerializer(DomainSerializer):
    class Meta:
        model = DailyInvestmentPlan
        fields = (
            "id",
            "title",
            "scenario_planning",
            "predicted_trend",
            "confidence_score",
            "predicted_price",
            "stop_loss_price",
            "valid_from",
            "valid_until",
            "weekly_security_plan",
        )


class DailyPlanDetailSelectSerializer(DailyPlanListSerializer):
    pass
