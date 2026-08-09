from core.constants.filters import DAILY_PLAN_FILTER_FIELDS
from core.views.common import BaseCommonViewSet
from trading_discipline.models import DailyInvestmentPlan
from trading_discipline.serializers.planning import (
    DailyPlanDetailSelectSerializer,
    DailyPlanListSerializer,
)


class DailyPlanViewSet(BaseCommonViewSet):
    """일투자계획 CRUD. 실제 주문이 규율을 지켰는지 대조하는 기준선."""

    queryset = DailyInvestmentPlan.objects.all()
    FILTER_FIELDS = DAILY_PLAN_FILTER_FIELDS
    list_serializer_class = DailyPlanListSerializer
    detail_serializer_class = DailyPlanDetailSelectSerializer
    select_list = ("weekly_plan__security",)
    select_detail = ("weekly_plan__security",)
    default_ordering = ("-valid_from",)
