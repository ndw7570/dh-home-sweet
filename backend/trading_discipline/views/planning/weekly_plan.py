from core.constants.filters import WEEKLY_PLAN_FILTER_FIELDS
from core.views.common import BaseCommonViewSet
from trading_discipline.models import WeeklyInvestmentPlan
from trading_discipline.serializers.planning import (
    WeeklyPlanDetailSelectSerializer,
    WeeklyPlanListSerializer,
)


class WeeklyPlanViewSet(BaseCommonViewSet):
    """주투자계획 CRUD.

    v0.0.2 부터 주계획은 `monthly_plan_id` FK 로 월계획에 직접 매달린다.
    (그 전에는 종목+기간 겹침으로 조립해야 했다.) 계획 트리는 `/cascade/` 에서
    이 FK 만 따라가면 통째로 만들 수 있다.
    """

    queryset = WeeklyInvestmentPlan.objects.all()
    FILTER_FIELDS = WEEKLY_PLAN_FILTER_FIELDS
    list_serializer_class = WeeklyPlanListSerializer
    detail_serializer_class = WeeklyPlanDetailSelectSerializer
    select_list = ("security", "monthly_plan")
    select_detail = ("security", "monthly_plan")
    prefetch_list = ("daily_plans",)
    prefetch_detail = ("daily_plans",)
    default_ordering = ("-valid_from",)
