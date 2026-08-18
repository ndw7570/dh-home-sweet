from rest_framework import serializers

from trading_discipline.models import TradingStrategyMethod
from trading_discipline.serializers._base import DomainSerializer
from trading_discipline.serializers.portfolio.daily_security_price_data import (
    DailySecurityPriceDataParentSerializer,
)


class TradingStrategyMethodListSerializer(DomainSerializer):
    """매수매도방법 = 분할 계획 한 벌의 머리.

    가격데이터를 함께 내보낸다. 분할을 몇 %에 걸지는 그때 본 가격대에서 나오므로,
    방법을 읽는 사람은 그 근거를 같이 봐야 한다.
    """

    price_data_detail = DailySecurityPriceDataParentSerializer(source="price_data", read_only=True)
    strategy_count = serializers.SerializerMethodField()

    class Meta:
        model = TradingStrategyMethod
        fields = "__all__"

    def get_strategy_count(self, obj) -> int:
        return obj.strategies.filter(is_deleted=False).count()


class TradingStrategyMethodParentSerializer(DomainSerializer):
    """n차 줄에 방법이 딸려 나갈 때 쓰는 최소 형태."""

    class Meta:
        model = TradingStrategyMethod
        fields = ("id", "policy_name", "sector", "reference_at")


class TradingStrategyMethodDetailSelectSerializer(TradingStrategyMethodListSerializer):
    strategies = serializers.SerializerMethodField()

    class Meta:
        model = TradingStrategyMethod
        fields = "__all__"

    def get_strategies(self, obj):
        """n차 분할표를 전략종류별로 묶어서 내려 준다 — 화면이 그대로 표로 그린다.

        매수 분할과 매도 분할은 다른 표다. 한 줄로 섞어 내보내면 화면이 매번
        나눠 담아야 하고, 그 과정에서 순서가 흐트러진다.
        """
        from trading_discipline.serializers.strategy.trading_strategy import (
            TradingStrategyListSerializer,
        )

        rows = obj.strategies.filter(is_deleted=False).order_by("strategy_type", "step_no")
        grouped: dict[str, list] = {}
        for row in rows:
            key = row.strategy_type or "UNKNOWN"
            grouped.setdefault(key, []).append(TradingStrategyListSerializer(row).data)
        return grouped
