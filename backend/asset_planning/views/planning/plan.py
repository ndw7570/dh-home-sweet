from core.views.common import BaseCommonViewSet

from asset_planning.models.planning.plan import Plan
from asset_planning.serializers.planning.plan import (
    PlanDetailSelectSerializer,
    PlanListSerializer,
)

try:
    from core.constants.filters import PLAN_FILTER_FIELDS
except ImportError:  # pragma: no cover
    PLAN_FILTER_FIELDS = {}


class PlanViewSet(BaseCommonViewSet):
    """계획 CRUD.

    - GET    /plan/          목록
    - GET    /plan/{id}/     단건
    - POST   /plan/          생성
    - PATCH  /plan/{id}/     부분수정
    - DELETE /plan/{id}/     소프트삭제
    - PATCH  /plan/{id}/restore/  복구
    """

    queryset = Plan.objects.all()
    FILTER_FIELDS = PLAN_FILTER_FIELDS
    list_serializer_class = PlanListSerializer
    detail_serializer_class = PlanDetailSelectSerializer
    prefetch_detail = ('scenarios',)
    default_ordering = ('-start_date',)
