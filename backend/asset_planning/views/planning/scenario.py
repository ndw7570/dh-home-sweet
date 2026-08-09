from core.views.common import BaseCommonViewSet

from asset_planning.models.planning.scenario import Scenario
from asset_planning.serializers.planning.scenario import (
    ScenarioDetailSelectSerializer,
    ScenarioListSerializer,
)

try:
    from core.constants.filters import SCENARIO_FILTER_FIELDS
except ImportError:  # pragma: no cover
    SCENARIO_FILTER_FIELDS = {}


class ScenarioViewSet(BaseCommonViewSet):
    """시나리오 CRUD. 가정값을 바꾸면 새 ProjectionSnapshot 을 쌓는다(기존 행은 갱신하지 않는다).

    - GET    /scenario/          목록
    - GET    /scenario/{id}/     단건
    - POST   /scenario/          생성
    - PATCH  /scenario/{id}/     부분수정
    - DELETE /scenario/{id}/     소프트삭제
    - PATCH  /scenario/{id}/restore/  복구
    """

    queryset = Scenario.objects.all()
    FILTER_FIELDS = SCENARIO_FILTER_FIELDS
    list_serializer_class = ScenarioListSerializer
    detail_serializer_class = ScenarioDetailSelectSerializer
    select_detail = ('plan',)
    default_ordering = ('scenario_type',)
