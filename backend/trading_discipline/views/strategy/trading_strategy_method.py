from core.constants.filters import TRADING_STRATEGY_METHOD_FILTER_FIELDS
from core.views.common import BaseCommonViewSet
from trading_discipline.models import TradingStrategyMethod
from trading_discipline.serializers.strategy import (
    TradingStrategyMethodDetailSelectSerializer,
    TradingStrategyMethodListSerializer,
)


class TradingStrategyMethodViewSet(BaseCommonViewSet):
    """매수매도방법 CRUD. 상세를 부르면 n차 분할표가 전략종류별로 묶여서 온다.

    분할 계획 한 벌의 머리다 — 어느 종목을 어느 가격 기준으로 나눠 살(팔) 것인가.
    실제 n차 줄은 `trading_strategies` 에 자식으로 매달린다.
    """

    queryset = TradingStrategyMethod.objects.all()
    FILTER_FIELDS = TRADING_STRATEGY_METHOD_FILTER_FIELDS
    list_serializer_class = TradingStrategyMethodListSerializer
    detail_serializer_class = TradingStrategyMethodDetailSelectSerializer
    select_list = ("price_data",)
    select_detail = ("price_data__security",)
    prefetch_list = ("strategies",)
    prefetch_detail = ("strategies",)
    default_ordering = ("-reference_at", "-id")
