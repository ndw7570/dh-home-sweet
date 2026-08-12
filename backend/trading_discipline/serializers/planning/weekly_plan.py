from rest_framework import serializers

from trading_discipline.models import WeeklyInvestmentPlan
from trading_discipline.serializers._base import DomainSerializer
from trading_discipline.serializers.planning._common import PlanSerializerBase


class WeeklyPlanListSerializer(PlanSerializerBase):
    """주계획은 이제 기간 그룹만이다(v0.0.3~).
    종목 · 가격 필드는 `WeeklySecurityInvestmentPlan` 이 가진다.
    """

    PROPERTY_FIELDS = ("period_label", "is_current")

    security_plan_count = serializers.SerializerMethodField()

    class Meta:
        model = WeeklyInvestmentPlan
        fields = "__all__"
        # DDL 은 monthly_plan_id 를 NULLABLE 로 두지만, 실제로 상위 논리 없이 뜨는 주계획을
        # 만들지 않기 위해 시리얼라이저에서 필수로 강제한다.
        extra_kwargs = {"monthly_plan": {"required": True, "allow_null": False}}

    def get_security_plan_count(self, obj) -> int:
        return obj.security_plans.filter(is_deleted=False).count()


class WeeklyPlanParentSerializer(DomainSerializer):
    class Meta:
        model = WeeklyInvestmentPlan
        fields = (
            "id",
            "title",
            "monthly_plan",
            "scenario_planning",
            "predicted_trend",
            "confidence_score",
            "valid_from",
            "valid_until",
        )


class WeeklyPlanDetailSelectSerializer(WeeklyPlanListSerializer):
    security_plans = serializers.SerializerMethodField()

    class Meta:
        model = WeeklyInvestmentPlan
        fields = "__all__"

    def get_security_plans(self, obj):
        from trading_discipline.serializers.planning.weekly_security_plan import (
            WeeklySecurityPlanParentSerializer,
        )

        qs = obj.security_plans.filter(is_deleted=False).order_by("security_id")
        return WeeklySecurityPlanParentSerializer(qs, many=True).data
