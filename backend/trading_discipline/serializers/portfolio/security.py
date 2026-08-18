from rest_framework import serializers

from market_data.services.pricing import resolve_live_price
from trading_discipline.models import Security
from trading_discipline.serializers._base import DomainPropertySerializer, DomainSerializer
from trading_discipline.serializers.portfolio.broker_account import BrokerAccountParentSerializer


class LivePriceMixin(serializers.ModelSerializer):
    """수집한 시세를 `live` 로 얹는다.

    `current_price`(사람이 입력한 값) 는 그대로 둔다. 지우지 않는 이유는 둘을 나란히
    보여 주는 것이 이 화면의 쓸모이기 때문이다 — 수기 입력값이 얼마나 낡았는지가
    그 자리에서 드러난다(현대차가 수기 450,500 / 실제 437,000 이던 적이 있다).

    묶어서 한 덩어리로 내보내는 이유는 계산을 한 번만 하기 위해서다. 필드를 넷으로
    쪼개면 `resolve_live_price` 가 행마다 네 번 돈다.
    """

    live = serializers.SerializerMethodField()

    def get_live(self, obj) -> dict:
        resolved = resolve_live_price(obj)
        price = resolved["price"]
        quantity = obj.computed_holding_quantity
        market_value = price * quantity if (price is not None and quantity is not None) else None
        return {
            # Decimal 은 문자열로 내보낸다. 다른 금액 필드(DecimalField)와 형식을 맞춰야
            # 프론트가 한 가지 방법으로만 파싱한다.
            "price": str(price) if price is not None else None,
            "at": resolved["at"].isoformat() if resolved["at"] else None,
            "source": resolved["source"],  # SNAPSHOT | MINUTE | DAILY | null
            "market_value": str(market_value) if market_value is not None else None,
        }


class SecurityListSerializer(LivePriceMixin, DomainPropertySerializer):
    PROPERTY_FIELDS = ("computed_holding_quantity", "market_value")

    class Meta:
        model = Security
        fields = "__all__"


class SecurityParentSerializer(DomainSerializer):
    """계획·이행 응답에 종목이 붙어 나갈 때 쓰는 최소 형태."""

    class Meta:
        model = Security
        fields = ("id", "symbol", "name", "market", "currency", "sector", "current_price")


class SecurityDetailSelectSerializer(LivePriceMixin, DomainPropertySerializer):
    PROPERTY_FIELDS = ("computed_holding_quantity", "market_value")
    account_detail = BrokerAccountParentSerializer(source="account", read_only=True)

    class Meta:
        model = Security
        fields = "__all__"
