from rest_framework import serializers

from trading_discipline.models import AiModelRun
from trading_discipline.serializers._base import DomainPropertySerializer, DomainSerializer


class AiModelRunListSerializer(DomainPropertySerializer):
    PROPERTY_FIELDS = ("duration_seconds",)

    feedback_count = serializers.SerializerMethodField()

    class Meta:
        model = AiModelRun
        # 입력 스냅샷은 통째로 크다. 목록에서는 빼고 상세에서만 준다.
        exclude = ("input_snapshot_json",)

    def get_feedback_count(self, obj) -> int:
        return obj.feedbacks.filter(is_deleted=False).count()


class AiModelRunParentSerializer(DomainSerializer):
    class Meta:
        model = AiModelRun
        fields = ("id", "model_name", "model_version", "prompt_version", "status", "started_at")


class AiModelRunDetailSelectSerializer(DomainPropertySerializer):
    PROPERTY_FIELDS = ("duration_seconds",)

    class Meta:
        model = AiModelRun
        fields = "__all__"
