from trading_discipline.models import AffectedSecurity
from trading_discipline.serializers._base import DomainSerializer
from trading_discipline.serializers.market.news import NewsParentSerializer
from trading_discipline.serializers.portfolio.security import SecurityParentSerializer


class AffectedSecurityListSerializer(DomainSerializer):
    """영향종목 — 뉴스 ↔ 종목. 부모가 시장방향에서 뉴스로 바뀌었다."""

    news_detail = NewsParentSerializer(source="news", read_only=True)
    security_detail = SecurityParentSerializer(source="security", read_only=True)

    class Meta:
        model = AffectedSecurity
        fields = "__all__"
        extra_kwargs = {
            "news": {"required": True, "allow_null": False},
            "security": {"required": True, "allow_null": False},
        }


class AffectedSecurityDetailSelectSerializer(AffectedSecurityListSerializer):
    pass
