from trading_discipline.models import AffectedSecurity
from trading_discipline.serializers._base import DomainSerializer
from trading_discipline.serializers.market.market_direction import MarketDirectionParentSerializer
from trading_discipline.serializers.portfolio.security import SecurityParentSerializer


class AffectedSecurityListSerializer(DomainSerializer):
    market_direction_detail = MarketDirectionParentSerializer(
        source="market_direction", read_only=True
    )
    affected_security_detail = SecurityParentSerializer(source="affected_security", read_only=True)

    class Meta:
        model = AffectedSecurity
        fields = "__all__"


class AffectedSecurityDetailSelectSerializer(AffectedSecurityListSerializer):
    pass
