from core.constants.filters import MARKET_DIRECTION_FILTER_FIELDS
from core.views.common import BaseCommonViewSet
from trading_discipline.models import MarketDirection
from trading_discipline.serializers.market import (
    MarketDirectionDetailSelectSerializer,
    MarketDirectionListSerializer,
)


class MarketDirectionViewSet(BaseCommonViewSet):
    """시장방향 CRUD. 요인별로 시장을 어떻게 보는지와 그 근거."""

    queryset = MarketDirection.objects.all()
    FILTER_FIELDS = MARKET_DIRECTION_FILTER_FIELDS
    list_serializer_class = MarketDirectionListSerializer
    detail_serializer_class = MarketDirectionDetailSelectSerializer
    # 목록도 뉴스·종목까지 통째로 내리므로 두 단을 다 끌어와야 N+1 이 안 난다.
    prefetch_list = ("news_items__affected_securities__security",)
    prefetch_detail = ("news_items__affected_securities__security",)
    default_ordering = ("-created_at", "-id")
