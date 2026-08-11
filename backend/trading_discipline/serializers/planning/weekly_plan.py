from rest_framework import serializers

from trading_discipline.models import WeeklyInvestmentPlan
from trading_discipline.serializers._base import DomainSerializer
from trading_discipline.serializers.planning._common import PlanSerializerBase
from trading_discipline.serializers.portfolio.security import SecurityParentSerializer


class WeeklyPlanListSerializer(PlanSerializerBase):
    PROPERTY_FIELDS = ("period_label", "is_current", "risk_reward")

    security_detail = SecurityParentSerializer(source="security", read_only=True)
    daily_count = serializers.SerializerMethodField()

    class Meta:
        model = WeeklyInvestmentPlan
        fields = "__all__"
        # DDL 은 monthly_plan_id 를 NULLABLE 로 두지만, 실제로 상위 논리 없이 뜨는 주계획을
        # 만들지 않기 위해 시리얼라이저에서 필수로 강제한다. 이행 대조의 UNGROUNDED_PLAN 이
        # 이 규칙의 방어선 역할을 한다.
        extra_kwargs = {"monthly_plan": {"required": True, "allow_null": False}}

    def get_daily_count(self, obj) -> int:
        return obj.daily_plans.filter(is_deleted=False).count()

    def validate(self, attrs):
        attrs = super().validate(attrs)
        predicted = attrs.get("predicted_price") or getattr(self.instance, "predicted_price", None)
        stop_loss = attrs.get("stop_loss_price") or getattr(self.instance, "stop_loss_price", None)
        trend = attrs.get("predicted_trend") or getattr(self.instance, "predicted_trend", None)
        # 상승을 본다면서 손절가가 예상가보다 위에 있으면 둘 중 하나는 오타다.
        if trend == "UP" and predicted and stop_loss and stop_loss >= predicted:
            raise serializers.ValidationError(
                {"stop_loss_price": "상승을 예측하면서 손절가가 예상가보다 높거나 같다."}
            )
        return attrs


class WeeklyPlanParentSerializer(DomainSerializer):
    class Meta:
        model = WeeklyInvestmentPlan
        fields = (
            "id",
            "title",
            "monthly_plan",
            "security",
            "scenario_planning",
            "predicted_trend",
            "confidence_score",
            "predicted_price",
            "stop_loss_price",
            "valid_from",
            "valid_until",
        )


class WeeklyPlanDetailSelectSerializer(WeeklyPlanListSerializer):
    daily_plans = serializers.SerializerMethodField()

    class Meta:
        model = WeeklyInvestmentPlan
        fields = "__all__"

    def get_daily_plans(self, obj):
        from trading_discipline.serializers.planning.daily_plan import DailyPlanParentSerializer

        qs = obj.daily_plans.filter(is_deleted=False).order_by("valid_from")
        return DailyPlanParentSerializer(qs, many=True).data
