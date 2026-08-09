from core.constants.filters import WEEKLY_PLAN_FILTER_FIELDS
from core.views.common import BaseCommonViewSet
from trading_discipline.models import WeeklyInvestmentPlan
from trading_discipline.serializers.planning import (
    WeeklyPlanDetailSelectSerializer,
    WeeklyPlanListSerializer,
)


class WeeklyPlanViewSet(BaseCommonViewSet):
    """주투자계획 CRUD.

    이 계층만 종목에 직접 붙는다. 월계획과의 연결은 FK 가 아니라 종목+기간으로
    맞춰야 해서, 조립이 필요한 화면은 `/cascade/` 를 쓴다.
    """

    queryset = WeeklyInvestmentPlan.objects.all()
    FILTER_FIELDS = WEEKLY_PLAN_FILTER_FIELDS
    list_serializer_class = WeeklyPlanListSerializer
    detail_serializer_class = WeeklyPlanDetailSelectSerializer
    select_list = ("security",)
    select_detail = ("security",)
    prefetch_list = ("daily_plans",)
    prefetch_detail = ("daily_plans",)
    default_ordering = ("-valid_from",)
