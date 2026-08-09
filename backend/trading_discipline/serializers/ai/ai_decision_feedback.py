from rest_framework import serializers

from trading_discipline.models import AiDecisionFeedback
from trading_discipline.serializers._base import DomainPropertySerializer
from trading_discipline.serializers.ai.ai_model_run import AiModelRunParentSerializer


class AiDecisionFeedbackListSerializer(DomainPropertySerializer):
    PROPERTY_FIELDS = ("is_expired",)

    model_detail = AiModelRunParentSerializer(source="model", read_only=True)

    class Meta:
        model = AiDecisionFeedback
        fields = "__all__"

    def validate_table_name(self, value):
        """`table_name` 은 FK 가 아니라서 DB 가 막아 주지 않는다. 여기서 좁힌다."""
        if value and value not in AiDecisionFeedback.TARGET_TABLES:
            allowed = ", ".join(AiDecisionFeedback.TARGET_TABLES)
            raise serializers.ValidationError(
                f"의견을 붙일 수 없는 테이블이다: {value}. 가능한 값: {allowed}"
            )
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)
        table_name = attrs.get("table_name", getattr(self.instance, "table_name", None))
        object_id = attrs.get("object_id", getattr(self.instance, "object_id", None))
        # 한쪽만 있으면 어디에도 안 붙은 유령 의견이 된다.
        if bool(table_name) != bool(object_id):
            raise serializers.ValidationError(
                {"object_id": "table_name 과 object_id 는 둘 다 있거나 둘 다 없어야 한다."}
            )
        return attrs


class AiDecisionFeedbackDetailSelectSerializer(AiDecisionFeedbackListSerializer):
    pass
