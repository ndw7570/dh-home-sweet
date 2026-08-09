from rest_framework import serializers

from trading_discipline.models import PerformanceRecord
from trading_discipline.serializers._base import DomainPropertySerializer
from trading_discipline.serializers.portfolio.security import SecurityParentSerializer


class PerformanceRecordListSerializer(DomainPropertySerializer):
    PROPERTY_FIELDS = ("total_cost", "excess_return")

    security_detail = SecurityParentSerializer(source="security", read_only=True)
    cost_breakdown = serializers.SerializerMethodField()

    class Meta:
        model = PerformanceRecord
        fields = "__all__"

    def get_cost_breakdown(self, obj):
        """비용을 항목별로 눕혀서 내려 준다 — 화면의 누적 막대가 이걸 그대로 쓴다."""
        return [
            {
                "field": name,
                "label": obj._meta.get_field(name).db_comment or name,
                "value": float(v) if (v := getattr(obj, name)) is not None else 0.0,
            }
            for name in PerformanceRecord.COST_FIELDS
        ]

    def validate(self, attrs):
        attrs = super().validate(attrs)
        start = attrs.get("period_start", getattr(self.instance, "period_start", None))
        end = attrs.get("period_end", getattr(self.instance, "period_end", None))
        if start and end and start > end:
            raise serializers.ValidationError(
                {"period_end": "기간종료일이 기간시작일보다 앞설 수 없다."}
            )
        return attrs


class PerformanceRecordDetailSelectSerializer(PerformanceRecordListSerializer):
    pass
