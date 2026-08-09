from core.constants.filters import AI_DECISION_FEEDBACK_FILTER_FIELDS
from core.views.common import BaseCommonViewSet
from trading_discipline.models import AiDecisionFeedback
from trading_discipline.serializers.ai import (
    AiDecisionFeedbackDetailSelectSerializer,
    AiDecisionFeedbackListSerializer,
)


class AiDecisionFeedbackViewSet(BaseCommonViewSet):
    """AI피드백의견 CRUD.

    `?table_name=weekly_investment_plan&object_id=12` 로 특정 대상에 붙은 의견만 뽑는다.
    `?valid_after=2026-08-09` 를 같이 주면 아직 유효한 의견만 남는다.
    """

    queryset = AiDecisionFeedback.objects.all()
    FILTER_FIELDS = AI_DECISION_FEEDBACK_FILTER_FIELDS
    list_serializer_class = AiDecisionFeedbackListSerializer
    detail_serializer_class = AiDecisionFeedbackDetailSelectSerializer
    select_list = ("model",)
    select_detail = ("model",)
    default_ordering = ("-created_at", "-id")
