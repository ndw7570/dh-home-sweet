from core.constants.filters import BROKER_ACCOUNT_FILTER_FIELDS
from core.views.common import BaseCommonViewSet
from trading_discipline.models import BrokerAccount
from trading_discipline.serializers.portfolio import (
    BrokerAccountDetailSelectSerializer,
    BrokerAccountListSerializer,
)


class BrokerAccountViewSet(BaseCommonViewSet):
    """증권사계좌 CRUD.

    GET /broker-account/          목록
    GET /broker-account/{id}/     단건
    POST / PATCH / DELETE / PATCH {id}/restore/
    """

    queryset = BrokerAccount.objects.all()
    FILTER_FIELDS = BROKER_ACCOUNT_FILTER_FIELDS
    list_serializer_class = BrokerAccountListSerializer
    detail_serializer_class = BrokerAccountDetailSelectSerializer
    prefetch_list = ("securities",)
    prefetch_detail = ("securities",)
    default_ordering = ("id",)
