from core.constants.filters import SECURITY_FILTER_FIELDS
from core.views.common import BaseCommonViewSet
from trading_discipline.models import Security
from trading_discipline.serializers.portfolio import (
    SecurityDetailSelectSerializer,
    SecurityListSerializer,
)


class SecurityViewSet(BaseCommonViewSet):
    """종목 CRUD. 계획 계층의 허리라서 거의 모든 화면이 이 목록을 먼저 부른다."""

    queryset = Security.objects.all()
    FILTER_FIELDS = SECURITY_FILTER_FIELDS
    list_serializer_class = SecurityListSerializer
    detail_serializer_class = SecurityDetailSelectSerializer
    select_list = ("account",)
    select_detail = ("account",)
    default_ordering = ("-is_active", "name")
