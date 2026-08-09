from rest_framework import serializers

from trading_discipline.models import QuarterlyInvestmentPlan
from trading_discipline.serializers._base import DomainSerializer
from trading_discipline.serializers.planning._common import PlanSerializerBase
from trading_discipline.serializers.planning.annual_plan import AnnualPlanParentSerializer


class QuarterlyPlanListSerializer(PlanSerializerBase):
    PROPERTY_FIELDS = ("period_label", "is_current", "strategy_coverage")

    annual_plan_detail = AnnualPlanParentSerializer(source="annual_plan", read_only=True)
    monthly_count = serializers.SerializerMethodField()

    class Meta:
        model = QuarterlyInvestmentPlan
        fields = "__all__"

    def get_monthly_count(self, obj) -> int:
        return obj.monthly_plans.filter(is_deleted=False).count()

    def validate_rebalancing_ratio(self, value):
        """`{"005930": 30, "CASH": 70}` — 값은 숫자, 합은 100 을 넘지 않아야 한다."""
        if value in (None, ""):
            return value
        if not isinstance(value, dict):
            raise serializers.ValidationError("리벨런싱비율은 {종목코드: 비중} 형태여야 한다.")
        total = 0
        for key, ratio in value.items():
            if not isinstance(ratio, (int, float)):
                raise serializers.ValidationError(f"'{key}' 의 비중이 숫자가 아니다.")
            total += ratio
        if total > 100:
            raise serializers.ValidationError(f"비중 합이 {total} 로 100 을 넘는다.")
        return value


class QuarterlyPlanParentSerializer(DomainSerializer):
    class Meta:
        model = QuarterlyInvestmentPlan
        fields = ("id", "title", "direction", "valid_from", "valid_until", "annual_plan")


class QuarterlyPlanDetailSelectSerializer(QuarterlyPlanListSerializer):
    monthly_plans = serializers.SerializerMethodField()
    principles = serializers.SerializerMethodField()

    class Meta:
        model = QuarterlyInvestmentPlan
        fields = "__all__"

    def get_monthly_plans(self, obj):
        from trading_discipline.serializers.planning.monthly_plan import MonthlyPlanParentSerializer

        qs = obj.monthly_plans.filter(is_deleted=False).order_by("valid_from")
        return MonthlyPlanParentSerializer(qs, many=True).data

    def get_principles(self, obj):
        from trading_discipline.serializers.principle.quarterly_principle import (
            QuarterlyPrincipleListSerializer,
        )

        qs = obj.principles.filter(is_deleted=False).select_related("security")
        return QuarterlyPrincipleListSerializer(qs, many=True).data
