from core.constants.filters import MANDATORY_PRINCIPLE_FILTER_FIELDS
from core.views.common import BaseCommonViewSet
from trading_discipline.models import MandatoryPrinciple
from trading_discipline.serializers.principle import (
    MandatoryPrincipleDetailSelectSerializer,
    MandatoryPrincipleListSerializer,
)


class MandatoryPrincipleViewSet(BaseCommonViewSet):
    """나의필수원칙 CRUD. 홈 화면 맨 위에 걸리는 목록."""

    queryset = MandatoryPrinciple.objects.all()
    FILTER_FIELDS = MANDATORY_PRINCIPLE_FILTER_FIELDS
    list_serializer_class = MandatoryPrincipleListSerializer
    detail_serializer_class = MandatoryPrincipleDetailSelectSerializer
    default_ordering = ("priority", "id")
