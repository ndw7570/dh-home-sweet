from rest_framework import serializers

from trading_discipline.models import WeeklySecurityInvestmentPlan
from trading_discipline.serializers._base import DomainPropertySerializer, DomainSerializer
from trading_discipline.serializers.planning.weekly_plan import WeeklyPlanParentSerializer
from trading_discipline.serializers.portfolio.security import SecurityParentSerializer


class WeeklySecurityPlanListSerializer(DomainPropertySerializer):
    """주투자종목별계획 — (주계획 × 종목).
    v0.0.3 에서 신설. 종목별 예상가/손절가/가용금액이 여기에 있다.
    """

    PROPERTY_FIELDS = ("risk_reward",)

    security_detail = SecurityParentSerializer(source="security", read_only=True)
    weekly_plan_detail = WeeklyPlanParentSerializer(source="weekly_plan", read_only=True)
    daily_count = serializers.SerializerMethodField()

    class Meta:
        model = WeeklySecurityInvestmentPlan
        fields = "__all__"
        extra_kwargs = {
            "weekly_plan": {"required": True, "allow_null": False},
            "security": {"required": True, "allow_null": False},
        }

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


class WeeklySecurityPlanParentSerializer(DomainSerializer):
    security_detail = SecurityParentSerializer(source="security", read_only=True)

    class Meta:
        model = WeeklySecurityInvestmentPlan
        fields = (
            "id",
            "title",
            "weekly_plan",
            "security",
            "security_detail",
            "scenario_planning",
            "predicted_trend",
            "confidence_score",
            "available_amount",
            "predicted_price",
            "stop_loss_price",
        )


class WeeklySecurityPlanDetailSelectSerializer(WeeklySecurityPlanListSerializer):
    daily_plans = serializers.SerializerMethodField()

    class Meta:
        model = WeeklySecurityInvestmentPlan
        fields = "__all__"

    def get_daily_plans(self, obj):
        from trading_discipline.serializers.planning.daily_plan import DailyPlanParentSerializer

        qs = obj.daily_plans.filter(is_deleted=False).order_by("valid_from")
        return DailyPlanParentSerializer(qs, many=True).data
