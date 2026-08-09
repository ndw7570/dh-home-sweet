from rest_framework import serializers

from trading_discipline.models import MonthlyInvestmentPlan
from trading_discipline.serializers._base import DomainSerializer
from trading_discipline.serializers.planning._common import PlanSerializerBase
from trading_discipline.serializers.planning.quarterly_plan import QuarterlyPlanParentSerializer


class MonthlyPlanListSerializer(PlanSerializerBase):
    quarterly_plan_detail = QuarterlyPlanParentSerializer(source="quarterly_plan", read_only=True)
    principle_count = serializers.SerializerMethodField()

    class Meta:
        model = MonthlyInvestmentPlan
        fields = "__all__"

    def get_principle_count(self, obj) -> int:
        return obj.principles.filter(is_deleted=False).count()


class MonthlyPlanParentSerializer(DomainSerializer):
    class Meta:
        model = MonthlyInvestmentPlan
        fields = (
            "id",
            "title",
            "scenario_planning",
            "predicted_trend",
            "confidence_score",
            "valid_from",
            "valid_until",
            "quarterly_plan",
        )


class MonthlyPlanDetailSelectSerializer(MonthlyPlanListSerializer):
    principles = serializers.SerializerMethodField()

    class Meta:
        model = MonthlyInvestmentPlan
        fields = "__all__"

    def get_principles(self, obj):
        """월계획이 종목에 닿는 유일한 통로. 이게 비면 계층이 여기서 끊긴다."""
        from trading_discipline.serializers.principle.monthly_principle import (
            MonthlyPrincipleListSerializer,
        )

        qs = obj.principles.filter(is_deleted=False).select_related("security")
        return MonthlyPrincipleListSerializer(qs, many=True).data
