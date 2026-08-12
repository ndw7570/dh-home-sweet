from core.constants.filters import WEEKLY_PLAN_FILTER_FIELDS
from core.views.common import BaseCommonViewSet
from trading_discipline.models import WeeklyInvestmentPlan
from trading_discipline.serializers.planning import (
    WeeklyPlanDetailSelectSerializer,
    WeeklyPlanListSerializer,
)


class WeeklyPlanViewSet(BaseCommonViewSet):
    """주투자계획 CRUD.

    v0.0.3 부터 주계획은 기간 그룹만이다. 종목별 필드는 `WeeklySecurityInvestmentPlan`
    으로 옮겨졌다. `/cascade/` 트리에서 이 노드 아래에 종목별 계획들이 매달린다.
    """

    queryset = WeeklyInvestmentPlan.objects.all()
    FILTER_FIELDS = WEEKLY_PLAN_FILTER_FIELDS
    list_serializer_class = WeeklyPlanListSerializer
    detail_serializer_class = WeeklyPlanDetailSelectSerializer
    select_list = ("monthly_plan",)
    select_detail = ("monthly_plan",)
    prefetch_list = ("security_plans__security",)
    prefetch_detail = ("security_plans__security",)
    default_ordering = ("-valid_from",)
