from core.constants.filters import ANNUAL_PLAN_FILTER_FIELDS
from core.views.common import BaseCommonViewSet
from trading_discipline.models import AnnualInvestmentPlan
from trading_discipline.serializers.planning import (
    AnnualPlanDetailSelectSerializer,
    AnnualPlanListSerializer,
)


class AnnualPlanViewSet(BaseCommonViewSet):
    """연투자계획 CRUD. 계획 5계층의 뿌리."""

    queryset = AnnualInvestmentPlan.objects.all()
    FILTER_FIELDS = ANNUAL_PLAN_FILTER_FIELDS
    list_serializer_class = AnnualPlanListSerializer
    detail_serializer_class = AnnualPlanDetailSelectSerializer
    select_list = ("account",)
    select_detail = ("account",)
    prefetch_list = ("quarterly_plans",)
    prefetch_detail = ("quarterly_plans",)
    default_ordering = ("-valid_from",)
