"""계획 5계층이 공통으로 내보내는 것.

`period_label` / `is_current` 는 모델 프로퍼티고, `valid_until >= valid_from` 검증은
5계층 모두에 필요해서 여기 한 번만 쓴다.
"""

from rest_framework import serializers

from trading_discipline.serializers._base import DomainPropertySerializer


class PlanSerializerBase(DomainPropertySerializer):
    PROPERTY_FIELDS = ("period_label", "is_current")

    def validate(self, attrs):
        attrs = super().validate(attrs)
        start = attrs.get("valid_from") or getattr(self.instance, "valid_from", None)
        end = attrs.get("valid_until") or getattr(self.instance, "valid_until", None)
        if start and end and start > end:
            raise serializers.ValidationError(
                {"valid_until": "유효종료일이 유효시작일보다 앞설 수 없다."}
            )
        return attrs
