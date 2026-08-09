from core.constants.filters import QUARTERLY_PRINCIPLE_FILTER_FIELDS
from core.views.common import BaseCommonViewSet
from trading_discipline.models import QuarterlyInvestmentPrinciple
from trading_discipline.serializers.principle import (
    QuarterlyPrincipleDetailSelectSerializer,
    QuarterlyPrincipleListSerializer,
)


class QuarterlyPrincipleViewSet(BaseCommonViewSet):
    """분기투자원칙 CRUD. 종목별 분기 실적 카드(지표 18개)."""

    queryset = QuarterlyInvestmentPrinciple.objects.all()
    FILTER_FIELDS = QUARTERLY_PRINCIPLE_FILTER_FIELDS
    list_serializer_class = QuarterlyPrincipleListSerializer
    detail_serializer_class = QuarterlyPrincipleDetailSelectSerializer
    select_list = ("security", "quarterly_plan")
    select_detail = ("security", "quarterly_plan")
    default_ordering = ("-id",)
