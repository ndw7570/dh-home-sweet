from core.constants.filters import WEEKLY_SECURITY_PLAN_FILTER_FIELDS
from core.views.common import BaseCommonViewSet
from trading_discipline.models import WeeklySecurityInvestmentPlan
from trading_discipline.serializers.planning import (
    WeeklySecurityPlanDetailSelectSerializer,
    WeeklySecurityPlanListSerializer,
)


class WeeklySecurityPlanViewSet(BaseCommonViewSet):
    """주투자종목별계획 CRUD — (주계획 × 종목)."""

    queryset = WeeklySecurityInvestmentPlan.objects.all()
    FILTER_FIELDS = WEEKLY_SECURITY_PLAN_FILTER_FIELDS
    list_serializer_class = WeeklySecurityPlanListSerializer
    detail_serializer_class = WeeklySecurityPlanDetailSelectSerializer
    select_list = ("security", "weekly_plan")
    select_detail = ("security", "weekly_plan")
    prefetch_list = ("daily_plans",)
    prefetch_detail = ("daily_plans",)
    default_ordering = ("-id",)
