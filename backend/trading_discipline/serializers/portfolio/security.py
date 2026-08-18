from rest_framework import serializers

from market_data.services.pricing import resolve_live_price
from trading_discipline.models import Security
from trading_discipline.serializers._base import DomainPropertySerializer, DomainSerializer
from trading_discipline.serializers.portfolio.broker_account import BrokerAccountParentSerializer


class PriceOriginMixin(serializers.ModelSerializer):
    """`current_price` 가 **언제·어디서 온 값인지**를 덧붙인다.

    값 자체는 `current_price` 에 이미 들어 있다 — 수집기가 그 컬럼을 직접 갱신하므로
    시세를 따로 실어 보낼 이유가 없다. 여기서 주는 것은 그 숫자를 읽는 데 필요한 맥락뿐이다:

        price_at      그 가격이 관측된 시각 (UTC)
        price_source  SNAPSHOT(장중 현재가) | MINUTE(분봉) | DAILY(종가) | null(수집 안 됨)

    시각이 필요한 이유는 장중과 마감 후에 같은 숫자가 다른 뜻을 갖기 때문이다.
    장중 273,000 은 "지금 이 값" 이고 마감 후 273,000 은 "오늘 종가" 다.
    `price_source` 가 null 이면 수집되지 않는 종목이라 사람이 입력한 값이 그대로 있는 것이다.

    `updated_at` 으로 대신할 수 없다. 그 컬럼은 날짜만 갖고, 시세가 아니라 사람이 이 행을
    마지막으로 손본 때를 뜻한다.
    """

    price_at = serializers.SerializerMethodField()
    price_source = serializers.SerializerMethodField()

    def get_price_at(self, obj) -> str | None:
        at = resolve_live_price(obj)["at"]
        return at.isoformat() if at else None

    def get_price_source(self, obj) -> str | None:
        return resolve_live_price(obj)["source"]


class SecurityListSerializer(PriceOriginMixin, DomainPropertySerializer):
    PROPERTY_FIELDS = ("computed_holding_quantity", "market_value")

    class Meta:
        model = Security
        fields = "__all__"


class SecurityParentSerializer(DomainSerializer):
    """계획·이행 응답에 종목이 붙어 나갈 때 쓰는 최소 형태."""

    class Meta:
        model = Security
        fields = ("id", "symbol", "name", "market", "currency", "sector", "current_price")


class SecurityDetailSelectSerializer(PriceOriginMixin, DomainPropertySerializer):
    PROPERTY_FIELDS = ("computed_holding_quantity", "market_value")
    account_detail = BrokerAccountParentSerializer(source="account", read_only=True)

    class Meta:
        model = Security
        fields = "__all__"
