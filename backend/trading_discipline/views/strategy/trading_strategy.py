from core.constants.filters import TRADING_STRATEGY_FILTER_FIELDS
from core.views.common import BaseCommonViewSet
from trading_discipline.models import TradingStrategy
from trading_discipline.serializers.strategy import (
    TradingStrategyDetailSelectSerializer,
    TradingStrategyListSerializer,
)


class TradingStrategyViewSet(BaseCommonViewSet):
    """매수매도전략 CRUD. n차 분할 한 줄씩.

    `?method_id=` 로 한 방법의 분할표를 뽑는다. 머리(가격데이터·정책명)는
    `trading_strategy_methods` 가 갖는다.
    """

    queryset = TradingStrategy.objects.all()
    FILTER_FIELDS = TRADING_STRATEGY_FILTER_FIELDS
    list_serializer_class = TradingStrategyListSerializer
    detail_serializer_class = TradingStrategyDetailSelectSerializer
    select_list = ("method",)
    select_detail = ("method",)
    default_ordering = ("method_id", "strategy_type", "step_no")
