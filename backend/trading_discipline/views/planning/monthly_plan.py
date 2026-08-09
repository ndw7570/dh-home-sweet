from core.constants.filters import MONTHLY_PLAN_FILTER_FIELDS
from core.views.common import BaseCommonViewSet
from trading_discipline.models import MonthlyInvestmentPlan
from trading_discipline.serializers.planning import (
    MonthlyPlanDetailSelectSerializer,
    MonthlyPlanListSerializer,
)


class MonthlyPlanViewSet(BaseCommonViewSet):
    """월투자계획 CRUD. 같은 달에 BASE/BULL/BEAR 를 나란히 세워 두는 계층."""

    queryset = MonthlyInvestmentPlan.objects.all()
    FILTER_FIELDS = MONTHLY_PLAN_FILTER_FIELDS
    list_serializer_class = MonthlyPlanListSerializer
    detail_serializer_class = MonthlyPlanDetailSelectSerializer
    select_list = ("quarterly_plan",)
    select_detail = ("quarterly_plan",)
    prefetch_list = ("principles",)
    prefetch_detail = ("principles__security",)
    default_ordering = ("-valid_from", "scenario_planning")
