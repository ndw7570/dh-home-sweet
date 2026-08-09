from core.constants.filters import QUARTERLY_PLAN_FILTER_FIELDS
from core.views.common import BaseCommonViewSet
from trading_discipline.models import QuarterlyInvestmentPlan
from trading_discipline.serializers.planning import (
    QuarterlyPlanDetailSelectSerializer,
    QuarterlyPlanListSerializer,
)


class QuarterlyPlanViewSet(BaseCommonViewSet):
    """분기투자계획 CRUD. 매수/매도/횡보/손절 네 전략 문장을 붙들고 있는 계층."""

    queryset = QuarterlyInvestmentPlan.objects.all()
    FILTER_FIELDS = QUARTERLY_PLAN_FILTER_FIELDS
    list_serializer_class = QuarterlyPlanListSerializer
    detail_serializer_class = QuarterlyPlanDetailSelectSerializer
    select_list = ("annual_plan",)
    select_detail = ("annual_plan",)
    prefetch_list = ("monthly_plans",)
    prefetch_detail = ("monthly_plans", "principles__security")
    default_ordering = ("-valid_from",)
