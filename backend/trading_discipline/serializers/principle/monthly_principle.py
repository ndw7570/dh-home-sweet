from rest_framework import serializers

from trading_discipline.models import MonthlyInvestmentPrinciple
from trading_discipline.serializers._base import DomainSerializer
from trading_discipline.serializers.portfolio.security import SecurityParentSerializer


class MonthlyPrincipleListSerializer(DomainSerializer):
    security_detail = SecurityParentSerializer(source="security", read_only=True)
    upside_ratio = serializers.SerializerMethodField()

    class Meta:
        model = MonthlyInvestmentPrinciple
        fields = "__all__"

    def get_upside_ratio(self, obj):
        """현재가 대비 예상가가 몇 % 위인가. 종목의 현재가가 비면 계산 못 한다."""
        current = obj.security.current_price if obj.security_id else None
        if not current or not obj.predicted_price or current == 0:
            return None
        return round(float((obj.predicted_price - current) / current * 100), 2)

    def validate(self, attrs):
        attrs = super().validate(attrs)
        rationale = attrs.get("rationale", getattr(self.instance, "rationale", None))
        if not (rationale or "").strip():
            # 근거 없는 목표가는 그냥 희망사항이다.
            raise serializers.ValidationError({"rationale": "근거 없이 예상가만 적을 수 없다."})
        return attrs


class MonthlyPrincipleDetailSelectSerializer(MonthlyPrincipleListSerializer):
    pass
