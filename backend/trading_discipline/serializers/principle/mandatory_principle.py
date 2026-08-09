from rest_framework import serializers

from trading_discipline.models import MandatoryPrinciple
from trading_discipline.serializers._base import DomainSerializer


class MandatoryPrincipleListSerializer(DomainSerializer):
    class Meta:
        model = MandatoryPrinciple
        fields = "__all__"

    def validate_content(self, value):
        if not (value or "").strip():
            raise serializers.ValidationError("필수원칙에 내용이 비어 있으면 지킬 수가 없다.")
        return value


class MandatoryPrincipleDetailSelectSerializer(MandatoryPrincipleListSerializer):
    pass
