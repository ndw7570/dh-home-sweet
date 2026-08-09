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
    prefetch_list = ("affected_securities",)
    prefetch_detail = ("affected_securities__affected_security",)
    default_ordering = ("-created_at", "-id")
