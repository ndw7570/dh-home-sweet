from rest_framework import serializers

from trading_discipline.models import InvestmentPrinciple
from trading_discipline.serializers._base import DomainSerializer
from trading_discipline.serializers.principle.principle_source import PrincipleSourceParentSerializer


class InvestmentPrincipleListSerializer(DomainSerializer):
    source_detail = PrincipleSourceParentSerializer(source="source", read_only=True)
    has_cautions = serializers.SerializerMethodField()

    class Meta:
        model = InvestmentPrinciple
        fields = "__all__"

    def get_has_cautions(self, obj) -> bool:
        """주의사항이 비어 있는 원칙은 화면에서 '조건 미기재' 로 표시한다."""
        return bool((obj.cautions or "").strip())


class InvestmentPrincipleDetailSelectSerializer(InvestmentPrincipleListSerializer):
    pass
