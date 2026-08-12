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

    def validate(self, attrs):
        """일계획은 하루짜리다 — 유효시작일과 유효종료일을 늘 같은 날로 맞춘다.

        화면은 입력창을 하나만 두고 두 값을 같이 보내지만, 규칙을 프론트에만 두면
        API 를 직접 부르는 경로에서 '이틀짜리 일계획' 이 만들어진다. 그게 생기면
        어느 날의 계획인지 알 수 없어져 주문 대조의 기준선이 흔들린다.
        """
        attrs = super().validate(attrs)
        # 둘 중 하나만 와도 그 날짜로 양쪽을 맞춘다. 둘 다 오면 시작일을 따른다.
        if "valid_from" in attrs or "valid_until" in attrs:
            day = attrs.get("valid_from") or attrs.get("valid_until")
            if day is not None:
                attrs["valid_from"] = day
                attrs["valid_until"] = day
        return attrs


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
