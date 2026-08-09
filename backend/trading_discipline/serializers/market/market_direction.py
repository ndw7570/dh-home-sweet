from rest_framework import serializers

from trading_discipline.models import MarketDirection
from trading_discipline.serializers._base import DomainSerializer


class MarketDirectionListSerializer(DomainSerializer):
    affected_count = serializers.SerializerMethodField()

    class Meta:
        model = MarketDirection
        fields = "__all__"

    def get_affected_count(self, obj) -> int:
        return obj.affected_securities.filter(is_deleted=False).count()

    def validate(self, attrs):
        attrs = super().validate(attrs)
        rationale = attrs.get("rationale", getattr(self.instance, "rationale", None))
        if not (rationale or "").strip():
            raise serializers.ValidationError(
                {"rationale": "근거 없이 시장 방향만 바꿀 수 없다."}
            )
        return attrs


class MarketDirectionParentSerializer(DomainSerializer):
    class Meta:
        model = MarketDirection
        fields = ("id", "direction", "factor_type", "factor_value", "content")


class MarketDirectionDetailSelectSerializer(MarketDirectionListSerializer):
    affected_securities = serializers.SerializerMethodField()

    class Meta:
        model = MarketDirection
        fields = "__all__"

    def get_affected_securities(self, obj):
        from trading_discipline.serializers.portfolio.security import SecurityParentSerializer

        rows = obj.affected_securities.filter(is_deleted=False).select_related("affected_security")
        return [
            SecurityParentSerializer(row.affected_security).data
            for row in rows
            if row.affected_security_id
        ]
