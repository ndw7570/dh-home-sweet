from core.constants.filters import MONTHLY_PRINCIPLE_FILTER_FIELDS
from core.views.common import BaseCommonViewSet
from trading_discipline.models import MonthlyInvestmentPrinciple
from trading_discipline.serializers.principle import (
    MonthlyPrincipleDetailSelectSerializer,
    MonthlyPrincipleListSerializer,
)


class MonthlyPrincipleViewSet(BaseCommonViewSet):
    """월투자원칙 CRUD. 월계획을 종목에 잇는 이음매라, 이게 비면 계층이 끊긴다."""

    queryset = MonthlyInvestmentPrinciple.objects.all()
    FILTER_FIELDS = MONTHLY_PRINCIPLE_FILTER_FIELDS
    list_serializer_class = MonthlyPrincipleListSerializer
    detail_serializer_class = MonthlyPrincipleDetailSelectSerializer
    select_list = ("security", "monthly_plan")
    select_detail = ("security", "monthly_plan")
    default_ordering = ("-id",)
