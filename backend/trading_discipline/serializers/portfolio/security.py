from trading_discipline.models import Security
from trading_discipline.serializers._base import DomainPropertySerializer, DomainSerializer
from trading_discipline.serializers.portfolio.broker_account import BrokerAccountParentSerializer


class SecurityListSerializer(DomainPropertySerializer):
    PROPERTY_FIELDS = ("computed_holding_quantity", "market_value")

    class Meta:
        model = Security
        fields = "__all__"


class SecurityParentSerializer(DomainSerializer):
    """계획·이행 응답에 종목이 붙어 나갈 때 쓰는 최소 형태."""

    class Meta:
        model = Security
        fields = ("id", "symbol", "name", "market", "currency", "sector", "current_price")


class SecurityDetailSelectSerializer(DomainPropertySerializer):
    PROPERTY_FIELDS = ("computed_holding_quantity", "market_value")
    account_detail = BrokerAccountParentSerializer(source="account", read_only=True)

    class Meta:
        model = Security
        fields = "__all__"
