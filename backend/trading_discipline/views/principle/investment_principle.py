from core.constants.filters import INVESTMENT_PRINCIPLE_FILTER_FIELDS
from core.views.common import BaseCommonViewSet
from trading_discipline.models import InvestmentPrinciple
from trading_discipline.serializers.principle import (
    InvestmentPrincipleDetailSelectSerializer,
    InvestmentPrincipleListSerializer,
)


class InvestmentPrincipleViewSet(BaseCommonViewSet):
    """투자원칙(대가의 원칙) CRUD."""

    queryset = InvestmentPrinciple.objects.all()
    FILTER_FIELDS = INVESTMENT_PRINCIPLE_FILTER_FIELDS
    list_serializer_class = InvestmentPrincipleListSerializer
    detail_serializer_class = InvestmentPrincipleDetailSelectSerializer
    select_list = ("source",)
    select_detail = ("source",)
    default_ordering = ("principle_type", "id")
