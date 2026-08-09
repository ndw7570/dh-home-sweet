from rest_framework import serializers

from trading_discipline.models import QuarterlyInvestmentPrinciple
from trading_discipline.serializers._base import DomainPropertySerializer
from trading_discipline.serializers.portfolio.security import SecurityParentSerializer


class QuarterlyPrincipleListSerializer(DomainPropertySerializer):
    PROPERTY_FIELDS = ("filled_ratio",)

    security_detail = SecurityParentSerializer(source="security", read_only=True)
    metric_groups = serializers.SerializerMethodField()

    class Meta:
        model = QuarterlyInvestmentPrinciple
        fields = "__all__"

    def get_metric_groups(self, obj):
        """화면이 지표 18개를 네 묶음으로 그릴 수 있게 그룹 정의를 같이 내려 준다."""
        return {
            group: [
                {
                    "field": name,
                    "label": obj._meta.get_field(name).db_comment or name,
                    "value": float(v) if (v := getattr(obj, name)) is not None else None,
                }
                for name in fields
            ]
            for group, fields in QuarterlyInvestmentPrinciple.METRIC_GROUPS.items()
        }


class QuarterlyPrincipleDetailSelectSerializer(QuarterlyPrincipleListSerializer):
    pass
