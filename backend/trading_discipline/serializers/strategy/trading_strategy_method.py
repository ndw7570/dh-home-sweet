from rest_framework import serializers

from trading_discipline.models import TradingStrategyMethod
from trading_discipline.serializers._base import DomainSerializer


class TradingStrategyMethodListSerializer(DomainSerializer):
    class Meta:
        model = TradingStrategyMethod
        fields = "__all__"

    def validate_step_no(self, value):
        if value is not None and value < 1:
            raise serializers.ValidationError("n차는 1 이상이어야 한다.")
        return value

    def validate_quantity_ratio(self, value):
        if value is not None and not (0 < value <= 100):
            raise serializers.ValidationError("수량비율은 0 초과 100 이하여야 한다.")
        return value


class TradingStrategyMethodDetailSelectSerializer(TradingStrategyMethodListSerializer):
    pass
