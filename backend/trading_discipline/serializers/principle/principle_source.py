from rest_framework import serializers

from trading_discipline.models import PrincipleSource
from trading_discipline.serializers._base import DomainSerializer


class PrincipleSourceListSerializer(DomainSerializer):
    principle_count = serializers.SerializerMethodField()

    class Meta:
        model = PrincipleSource
        fields = "__all__"

    def get_principle_count(self, obj) -> int:
        return obj.principles.filter(is_deleted=False).count()


class PrincipleSourceParentSerializer(DomainSerializer):
    class Meta:
        model = PrincipleSource
        fields = ("id", "name", "source_type", "url")


class PrincipleSourceDetailSelectSerializer(PrincipleSourceListSerializer):
    principles = serializers.SerializerMethodField()

    class Meta:
        model = PrincipleSource
        fields = "__all__"

    def get_principles(self, obj):
        from trading_discipline.serializers.principle.investment_principle import (
            InvestmentPrincipleListSerializer,
        )

        qs = obj.principles.filter(is_deleted=False)
        return InvestmentPrincipleListSerializer(qs, many=True).data
