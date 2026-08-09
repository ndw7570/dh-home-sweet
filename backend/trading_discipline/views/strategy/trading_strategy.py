from core.constants.filters import TRADING_STRATEGY_FILTER_FIELDS
from core.views.common import BaseCommonViewSet
from trading_discipline.models import TradingStrategy
from trading_discipline.serializers.strategy import (
    TradingStrategyDetailSelectSerializer,
    TradingStrategyListSerializer,
)


class TradingStrategyViewSet(BaseCommonViewSet):
    """매수매도전략 CRUD. 상세를 부르면 n차 분할표가 전략종류별로 묶여서 온다."""

    queryset = TradingStrategy.objects.all()
    FILTER_FIELDS = TRADING_STRATEGY_FILTER_FIELDS
    list_serializer_class = TradingStrategyListSerializer
    detail_serializer_class = TradingStrategyDetailSelectSerializer
    select_list = ("price_data",)
    select_detail = ("price_data__security",)
    prefetch_list = ("methods",)
    prefetch_detail = ("methods",)
    default_ordering = ("-reference_at", "-id")
