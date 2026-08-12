from rest_framework import serializers

from trading_discipline.models import News
from trading_discipline.serializers._base import DomainPropertySerializer, DomainSerializer
from trading_discipline.serializers.market.market_direction import MarketDirectionParentSerializer


class NewsListSerializer(DomainPropertySerializer):
    """뉴스 — 시장방향과 종목 사이의 한 단."""

    PROPERTY_FIELDS = ("impact_period_label", "expected_impact_days", "is_impact_current")

    market_direction_detail = MarketDirectionParentSerializer(
        source="market_direction", read_only=True
    )
    affected_count = serializers.SerializerMethodField()

    class Meta:
        model = News
        fields = "__all__"

    def get_affected_count(self, obj) -> int:
        return obj.affected_securities.filter(is_deleted=False).count()

    def validate(self, attrs):
        attrs = super().validate(attrs)
        # 시장방향과 같은 규칙 — 근거 없는 뉴스는 판단의 재료가 못 된다.
        # "이 기사를 왜 시장 판단의 근거로 삼았나" 가 없으면 나중에 되짚을 수 없다.
        rationale = attrs.get("rationale", getattr(self.instance, "rationale", None))
        if not (rationale or "").strip():
            raise serializers.ValidationError(
                {"rationale": "근거 없이 뉴스만 걸어 둘 수 없다. 이 기사를 왜 근거로 삼는지 적는다."}
            )

        start = attrs.get(
            "expected_impact_from", getattr(self.instance, "expected_impact_from", None)
        )
        end = attrs.get(
            "expected_impact_until", getattr(self.instance, "expected_impact_until", None)
        )
        if start and end and start > end:
            raise serializers.ValidationError(
                {"expected_impact_until": "예상영향종료일이 시작일보다 앞설 수 없다."}
            )
        return attrs


class NewsParentSerializer(DomainSerializer):
    class Meta:
        model = News
        fields = (
            "id",
            "market_direction",
            "direction",
            "factor_type",
            "factor_value",
            "content",
            "expected_impact_from",
            "expected_impact_until",
        )


class NewsDetailSelectSerializer(NewsListSerializer):
    affected_securities = serializers.SerializerMethodField()

    class Meta:
        model = News
        fields = "__all__"

    def get_affected_securities(self, obj):
        from trading_discipline.serializers.portfolio.security import SecurityParentSerializer

        rows = obj.affected_securities.filter(is_deleted=False).select_related("security")
        return [SecurityParentSerializer(row.security).data for row in rows if row.security_id]
