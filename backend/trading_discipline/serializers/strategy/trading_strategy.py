from rest_framework import serializers

from trading_discipline.constants.choices import StrategyType
from trading_discipline.models import TradingStrategy
from trading_discipline.serializers._base import DomainSerializer
from trading_discipline.serializers.strategy.trading_strategy_method import (
    TradingStrategyMethodParentSerializer,
)


class TradingStrategyListSerializer(DomainSerializer):
    """매수매도전략 = n차 분할 한 줄.

    `price_ratio` 는 **기준가 대비 몇 %** 다. 분할매수면 음수(-3 = 3% 하락 시 산다),
    분할매도면 양수. 이 값의 근거는 방법에 달린 가격데이터의 변동폭(`high_rate`/`low_rate`)
    이다 — 그 종목이 실제로 얼마나 벌어졌는지를 보고 정하는 숫자다.
    """

    method_detail = TradingStrategyMethodParentSerializer(source="method", read_only=True)

    class Meta:
        model = TradingStrategy
        fields = "__all__"

    def validate(self, attrs):
        attrs = super().validate(attrs)
        strategy_type = attrs.get("strategy_type", getattr(self.instance, "strategy_type", None))
        price_ratio = attrs.get("price_ratio", getattr(self.instance, "price_ratio", None))

        # 부호가 방향과 어긋나면 표를 읽는 사람이 정반대로 이해한다.
        # 분할매수 +3% 는 "3% 오르면 산다" 가 되어 물타기 계획이 불타기 계획이 된다.
        if price_ratio is not None and strategy_type:
            if strategy_type == StrategyType.BUY_SPLIT and price_ratio > 0:
                raise serializers.ValidationError(
                    {
                        "price_ratio": (
                            f"분할매수는 하락 시 사는 계획이라 음수여야 한다 (입력: {price_ratio}). "
                            "오를 때 사는 계획이라면 전략종류를 다시 보라."
                        )
                    }
                )
            if strategy_type == StrategyType.SELL_SPLIT and price_ratio < 0:
                raise serializers.ValidationError(
                    {
                        "price_ratio": (
                            f"분할매도는 상승 시 파는 계획이라 양수여야 한다 (입력: {price_ratio})."
                        )
                    }
                )
        return attrs


class TradingStrategyParentSerializer(DomainSerializer):
    class Meta:
        model = TradingStrategy
        fields = ("id", "strategy_type", "step_no", "price_ratio", "quantity_ratio")


class TradingStrategyDetailSelectSerializer(TradingStrategyListSerializer):
    pass
