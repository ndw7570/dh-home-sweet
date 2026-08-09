from core.constants.filters import PRINCIPLE_SOURCE_FILTER_FIELDS
from core.views.common import BaseCommonViewSet
from trading_discipline.models import PrincipleSource
from trading_discipline.serializers.principle import (
    PrincipleSourceDetailSelectSerializer,
    PrincipleSourceListSerializer,
)


class PrincipleSourceViewSet(BaseCommonViewSet):
    """투자원칙소스 CRUD."""

    queryset = PrincipleSource.objects.all()
    FILTER_FIELDS = PRINCIPLE_SOURCE_FILTER_FIELDS
    list_serializer_class = PrincipleSourceListSerializer
    detail_serializer_class = PrincipleSourceDetailSelectSerializer
    prefetch_list = ("principles",)
    prefetch_detail = ("principles",)
    default_ordering = ("name",)
