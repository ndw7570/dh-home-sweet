from rest_framework import serializers

from trading_discipline.models import AnnualInvestmentPlan
from trading_discipline.serializers._base import DomainSerializer
from trading_discipline.serializers.planning._common import PlanSerializerBase
from trading_discipline.serializers.portfolio.broker_account import BrokerAccountParentSerializer


class AnnualPlanListSerializer(PlanSerializerBase):
    account_detail = BrokerAccountParentSerializer(source="account", read_only=True)
    quarterly_count = serializers.SerializerMethodField()

    class Meta:
        model = AnnualInvestmentPlan
        fields = "__all__"

    def get_quarterly_count(self, obj) -> int:
        return obj.quarterly_plans.filter(is_deleted=False).count()


class AnnualPlanParentSerializer(DomainSerializer):
    class Meta:
        model = AnnualInvestmentPlan
        fields = ("id", "title", "market", "direction", "status", "valid_from", "valid_until")


class AnnualPlanDetailSelectSerializer(PlanSerializerBase):
    account_detail = BrokerAccountParentSerializer(source="account", read_only=True)
    quarterly_plans = serializers.SerializerMethodField()

    class Meta:
        model = AnnualInvestmentPlan
        fields = "__all__"

    def get_quarterly_plans(self, obj):
        from trading_discipline.serializers.planning.quarterly_plan import (
            QuarterlyPlanParentSerializer,
        )

        qs = obj.quarterly_plans.filter(is_deleted=False).order_by("valid_from")
        return QuarterlyPlanParentSerializer(qs, many=True).data
