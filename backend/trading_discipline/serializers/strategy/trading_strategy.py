from rest_framework import serializers

from trading_discipline.models import TradingStrategy
from trading_discipline.serializers._base import DomainSerializer
from trading_discipline.serializers.portfolio.security_price_data import (
    SecurityPriceDataParentSerializer,
)


class TradingStrategyListSerializer(DomainSerializer):
    price_data_detail = SecurityPriceDataParentSerializer(source="price_data", read_only=True)
    method_count = serializers.SerializerMethodField()

    class Meta:
        model = TradingStrategy
        fields = "__all__"

    def get_method_count(self, obj) -> int:
        return obj.methods.filter(is_deleted=False).count()


class TradingStrategyParentSerializer(DomainSerializer):
    class Meta:
        model = TradingStrategy
        fields = ("id", "policy_name", "sector", "reference_at")


class TradingStrategyDetailSelectSerializer(TradingStrategyListSerializer):
    methods = serializers.SerializerMethodField()

    class Meta:
        model = TradingStrategy
        fields = "__all__"

    def get_methods(self, obj):
        """n차 분할표를 전략종류별로 묶어서 내려 준다 — 화면이 그대로 표로 그린다."""
        from trading_discipline.serializers.strategy.trading_strategy_method import (
            TradingStrategyMethodListSerializer,
        )

        rows = obj.methods.filter(is_deleted=False).order_by("strategy_type", "step_no")
        grouped: dict[str, list] = {}
        for row in rows:
            grouped.setdefault(row.strategy_type or "UNKNOWN", []).append(
                TradingStrategyMethodListSerializer(row).data
            )
        return grouped
