from decimal import Decimal, InvalidOperation

from rest_framework import serializers

from trading_discipline.constants.choices import OrderType
from trading_discipline.constants.validation import (
    MAX_PLAUSIBLE_QUANTITY,
    PRICE_OUTLIER_RATIO,
    QUANTITY_LOOKS_LIKE_PRICE_TOLERANCE,
)
from trading_discipline.models import Order
from trading_discipline.serializers._base import DomainPropertySerializer
from trading_discipline.serializers.portfolio.security import SecurityParentSerializer


class OrderListSerializer(DomainPropertySerializer):
    PROPERTY_FIELDS = ("notional",)

    security_detail = SecurityParentSerializer(source="security", read_only=True)

    # 화면이 "이 값 정말 맞나" 를 사람에게 물은 뒤 다시 보내는 플래그. 모델 컬럼이 아니라
    # 저장 직전에 버린다. 이상값 검사를 통과시키는 유일한 열쇠다.
    confirm_outlier = serializers.BooleanField(write_only=True, required=False, default=False)

    class Meta:
        model = Order
        fields = "__all__"

    def validate(self, attrs):
        attrs = super().validate(attrs)
        confirmed = attrs.pop("confirm_outlier", False)

        order_type = attrs.get("order_type", getattr(self.instance, "order_type", None))
        limit_price = attrs.get("limit_price", getattr(self.instance, "limit_price", None))
        quantity = attrs.get("quantity", getattr(self.instance, "quantity", None))

        if order_type in (OrderType.LIMIT, OrderType.STOP_LIMIT) and limit_price is None:
            raise serializers.ValidationError(
                {"limit_price": "지정가 주문에는 지정가격이 있어야 한다."}
            )
        if quantity is not None and quantity <= 0:
            raise serializers.ValidationError({"quantity": "수량은 1 이상이어야 한다."})

        if not confirmed:
            self._check_outliers(attrs, quantity, limit_price)
        return attrs

    # ── 이상값 검사 ──────────────────────────────────────
    def _check_outliers(self, attrs, quantity, limit_price):
        """수량·가격이 종목 현재가에 비추어 말이 되는지 본다.

        판정 순서가 중요하다. 뒤바뀜(swap) 을 먼저 본다 — 수량과 가격이 서로 자리를 바꾼
        경우엔 두 필드가 동시에 이상해지는데, 그때 "가격이 이상하다" 고만 말하면 사람이
        가격만 고치고 수량은 그대로 두게 된다. 뒤바뀜으로 보이면 그렇다고 말해 준다.
        """
        security = attrs.get("security", getattr(self.instance, "security", None))
        current_price = self._as_decimal(getattr(security, "current_price", None))

        if quantity is None:
            return
        qty = self._as_decimal(quantity)

        if current_price is None or current_price <= 0:
            # 현재가를 모르면 비교 기준이 없다. 절대 상한만 본다.
            if quantity > MAX_PLAUSIBLE_QUANTITY:
                raise serializers.ValidationError(
                    {
                        "quantity": (
                            f"수량 {quantity:,} 은 한 건의 이행으로는 너무 크다. "
                            "가격을 수량 칸에 적지 않았는지 확인하라. "
                            "맞다면 confirm_outlier=true 로 다시 보내라."
                        )
                    }
                )
            return

        price = self._as_decimal(limit_price)
        qty_looks_like_price = (
            abs(qty - current_price) <= current_price * QUANTITY_LOOKS_LIKE_PRICE_TOLERANCE
        )
        price_is_outlier = price is not None and (
            price < current_price / PRICE_OUTLIER_RATIO
            or price > current_price * PRICE_OUTLIER_RATIO
        )

        if qty_looks_like_price and price_is_outlier:
            raise serializers.ValidationError(
                {
                    "quantity": (
                        f"수량과 지정가격이 뒤바뀐 것 같다. 수량 {quantity:,} 은 이 종목의 "
                        f"현재가({current_price:,.0f}) 에 가깝고, 지정가격 {price:,.0f} 은 "
                        "현재가와 너무 벌어져 있다. 두 칸을 바꿔 적지 않았는지 확인하라. "
                        "맞다면 confirm_outlier=true 로 다시 보내라."
                    )
                }
            )
        if qty_looks_like_price and quantity > MAX_PLAUSIBLE_QUANTITY:
            raise serializers.ValidationError(
                {
                    "quantity": (
                        f"수량 {quantity:,} 이 이 종목의 현재가({current_price:,.0f}) 와 "
                        "거의 같다. 가격을 수량 칸에 적지 않았는지 확인하라. "
                        "맞다면 confirm_outlier=true 로 다시 보내라."
                    )
                }
            )
        if price_is_outlier:
            raise serializers.ValidationError(
                {
                    "limit_price": (
                        f"지정가격 {price:,.0f} 이 이 종목의 현재가({current_price:,.0f}) 대비 "
                        f"{PRICE_OUTLIER_RATIO} 배 범위를 벗어난다. 자릿수를 확인하라. "
                        "맞다면 confirm_outlier=true 로 다시 보내라."
                    )
                }
            )
        if quantity > MAX_PLAUSIBLE_QUANTITY:
            raise serializers.ValidationError(
                {
                    "quantity": (
                        f"수량 {quantity:,} 은 한 건의 이행으로는 너무 크다. "
                        "맞다면 confirm_outlier=true 로 다시 보내라."
                    )
                }
            )

    @staticmethod
    def _as_decimal(value):
        if value is None:
            return None
        if isinstance(value, Decimal):
            return value
        try:
            return Decimal(str(value))
        except (InvalidOperation, ValueError, TypeError):
            return None


class OrderDetailSelectSerializer(OrderListSerializer):
    pass
