from core.views.common import BaseCommonViewSet

from asset_planning.models.portfolio.account import Account
from asset_planning.serializers.portfolio.account import (
    AccountDetailSelectSerializer,
    AccountListSerializer,
)

try:
    from core.constants.filters import ACCOUNT_FILTER_FIELDS
except ImportError:  # pragma: no cover
    ACCOUNT_FILTER_FIELDS = {}


class AccountViewSet(BaseCommonViewSet):
    """계좌 CRUD.

    - GET    /account/          목록
    - GET    /account/{id}/     단건
    - POST   /account/          생성
    - PATCH  /account/{id}/     부분수정
    - DELETE /account/{id}/     소프트삭제
    - PATCH  /account/{id}/restore/  복구
    """

    queryset = Account.objects.all()
    FILTER_FIELDS = ACCOUNT_FILTER_FIELDS
    list_serializer_class = AccountListSerializer
    detail_serializer_class = AccountDetailSelectSerializer
    default_ordering = ('-created_at',)
