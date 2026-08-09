from rest_framework import serializers

from trading_discipline.constants.choices import OrderType
from trading_discipline.models import Order
from trading_discipline.serializers._base import DomainPropertySerializer
from trading_discipline.serializers.portfolio.security import SecurityParentSerializer


class OrderListSerializer(DomainPropertySerializer):
    PROPERTY_FIELDS = ("notional",)

    security_detail = SecurityParentSerializer(source="security", read_only=True)

    class Meta:
        model = Order
        fields = "__all__"

    def validate(self, attrs):
        attrs = super().validate(attrs)
        order_type = attrs.get("order_type", getattr(self.instance, "order_type", None))
        limit_price = attrs.get("limit_price", getattr(self.instance, "limit_price", None))
        quantity = attrs.get("quantity", getattr(self.instance, "quantity", None))

        if order_type in (OrderType.LIMIT, OrderType.STOP_LIMIT) and limit_price is None:
            raise serializers.ValidationError(
                {"limit_price": "지정가 주문에는 지정가격이 있어야 한다."}
            )
        if quantity is not None and quantity <= 0:
            raise serializers.ValidationError({"quantity": "수량은 1 이상이어야 한다."})
        return attrs


class OrderDetailSelectSerializer(OrderListSerializer):
    pass
