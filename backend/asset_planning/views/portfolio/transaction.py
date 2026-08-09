from core.views.common import BaseCommonViewSet

from asset_planning.models.portfolio.transaction import Transaction
from asset_planning.serializers.portfolio.transaction import (
    TransactionDetailSelectSerializer,
    TransactionListSerializer,
)

try:
    from core.constants.filters import TRANSACTION_FILTER_FIELDS
except ImportError:  # pragma: no cover
    TRANSACTION_FILTER_FIELDS = {}


class TransactionViewSet(BaseCommonViewSet):
    """거래 CRUD. journal_entry 가 비어 있으면 화면에서 '이유 미기재'로 표시된다.

    - GET    /transaction/          목록
    - GET    /transaction/{id}/     단건
    - POST   /transaction/          생성
    - PATCH  /transaction/{id}/     부분수정
    - DELETE /transaction/{id}/     소프트삭제
    - PATCH  /transaction/{id}/restore/  복구
    """

    queryset = Transaction.objects.all()
    FILTER_FIELDS = TRANSACTION_FILTER_FIELDS
    list_serializer_class = TransactionListSerializer
    detail_serializer_class = TransactionDetailSelectSerializer
    select_detail = ('account', 'holding', 'journal_entry')
    default_ordering = ('-traded_at',)
