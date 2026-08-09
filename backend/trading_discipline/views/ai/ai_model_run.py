from core.constants.filters import AI_MODEL_RUN_FILTER_FIELDS
from core.views.common import BaseCommonViewSet
from trading_discipline.models import AiModelRun
from trading_discipline.serializers.ai import (
    AiModelRunDetailSelectSerializer,
    AiModelRunListSerializer,
)


class AiModelRunViewSet(BaseCommonViewSet):
    """AI모델 실행 CRUD. 목록에서는 입력 스냅샷을 빼고, 상세에서만 통째로 준다."""

    queryset = AiModelRun.objects.all()
    FILTER_FIELDS = AI_MODEL_RUN_FILTER_FIELDS
    list_serializer_class = AiModelRunListSerializer
    detail_serializer_class = AiModelRunDetailSelectSerializer
    prefetch_list = ("feedbacks",)
    default_ordering = ("-started_at", "-id")
