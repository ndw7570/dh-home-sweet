from core.constants.filters import TRADING_STRATEGY_METHOD_FILTER_FIELDS
from core.views.common import BaseCommonViewSet
from trading_discipline.models import TradingStrategyMethod
from trading_discipline.serializers.strategy import (
    TradingStrategyMethodDetailSelectSerializer,
    TradingStrategyMethodListSerializer,
)


class TradingStrategyMethodViewSet(BaseCommonViewSet):
    """매수매도방법 CRUD. n차 분할 한 줄씩."""

    queryset = TradingStrategyMethod.objects.all()
    FILTER_FIELDS = TRADING_STRATEGY_METHOD_FILTER_FIELDS
    list_serializer_class = TradingStrategyMethodListSerializer
    detail_serializer_class = TradingStrategyMethodDetailSelectSerializer
    select_list = ("strategy",)
    select_detail = ("strategy",)
    default_ordering = ("strategy_id", "strategy_type", "step_no")
