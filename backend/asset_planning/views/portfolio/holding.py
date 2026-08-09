from core.views.common import BaseCommonViewSet

from asset_planning.models.portfolio.holding import Holding
from asset_planning.serializers.portfolio.holding import (
    HoldingDetailSelectSerializer,
    HoldingListSerializer,
)

try:
    from core.constants.filters import HOLDING_FILTER_FIELDS
except ImportError:  # pragma: no cover
    HOLDING_FILTER_FIELDS = {}


class HoldingViewSet(BaseCommonViewSet):
    """보유 종목 CRUD.

    - GET    /holding/          목록
    - GET    /holding/{id}/     단건
    - POST   /holding/          생성
    - PATCH  /holding/{id}/     부분수정
    - DELETE /holding/{id}/     소프트삭제
    - PATCH  /holding/{id}/restore/  복구
    """

    queryset = Holding.objects.all()
    FILTER_FIELDS = HOLDING_FILTER_FIELDS
    list_serializer_class = HoldingListSerializer
    detail_serializer_class = HoldingDetailSelectSerializer
    select_detail = ('account',)
    default_ordering = ('account_id', 'symbol')
