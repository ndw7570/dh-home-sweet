from trading_discipline.models import SecurityPriceData
from trading_discipline.serializers._base import DomainSerializer
from trading_discipline.serializers.portfolio.security import SecurityParentSerializer


class SecurityPriceDataListSerializer(DomainSerializer):
    class Meta:
        model = SecurityPriceData
        fields = "__all__"


class SecurityPriceDataParentSerializer(DomainSerializer):
    """전략이 '어느 시점 가격을 보고 세웠나' 를 같이 내보낼 때."""

    class Meta:
        model = SecurityPriceData
        fields = ("id", "security", "price_at", "high_price", "low_price", "quote_price")


class SecurityPriceDataDetailSelectSerializer(DomainSerializer):
    security_detail = SecurityParentSerializer(source="security", read_only=True)

    class Meta:
        model = SecurityPriceData
        fields = "__all__"
