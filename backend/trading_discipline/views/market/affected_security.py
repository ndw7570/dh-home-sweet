from core.constants.filters import AFFECTED_SECURITY_FILTER_FIELDS
from core.views.common import BaseCommonViewSet
from trading_discipline.models import AffectedSecurity
from trading_discipline.serializers.market import (
    AffectedSecurityDetailSelectSerializer,
    AffectedSecurityListSerializer,
)


class AffectedSecurityViewSet(BaseCommonViewSet):
    """영향종목 CRUD — 시장방향 ↔ 종목 연결."""

    queryset = AffectedSecurity.objects.all()
    FILTER_FIELDS = AFFECTED_SECURITY_FILTER_FIELDS
    list_serializer_class = AffectedSecurityListSerializer
    detail_serializer_class = AffectedSecurityDetailSelectSerializer
    select_list = ("market_direction", "affected_security")
    select_detail = ("market_direction", "affected_security")
    default_ordering = ("-id",)
