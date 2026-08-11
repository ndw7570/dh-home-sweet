from trading_discipline.models import DailySecurityPriceData
from trading_discipline.serializers._base import DomainSerializer
from trading_discipline.serializers.portfolio.security import SecurityParentSerializer


class DailySecurityPriceDataListSerializer(DomainSerializer):
    class Meta:
        model = DailySecurityPriceData
        fields = "__all__"


class DailySecurityPriceDataParentSerializer(DomainSerializer):
    """전략이 '어느 시점 가격을 보고 세웠나' 를 같이 내보낼 때."""

    class Meta:
        model = DailySecurityPriceData
        fields = ("id", "security", "price_at", "high_price", "low_price", "quote_price")


class DailySecurityPriceDataDetailSelectSerializer(DomainSerializer):
    security_detail = SecurityParentSerializer(source="security", read_only=True)

    class Meta:
        model = DailySecurityPriceData
        fields = "__all__"
