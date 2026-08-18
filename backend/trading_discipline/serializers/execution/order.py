from decimal import Decimal, InvalidOperation

from django.db import transaction
from rest_framework import serializers

from trading_discipline.constants.choices import OrderType, PeriodType
from trading_discipline.constants.validation import (
    MAX_PLAUSIBLE_QUANTITY,
    PRICE_OUTLIER_RATIO,
    QUANTITY_LOOKS_LIKE_PRICE_TOLERANCE,
)
from trading_discipline.models import MandatoryPrinciple, Order, OrderPrincipleCheck
from trading_discipline.serializers._base import DomainPropertySerializer
from trading_discipline.serializers.portfolio.security import SecurityParentSerializer
from trading_discipline.serializers.principle import MandatoryPrincipleParentSerializer


class OrderPrincipleCheckSerializer(serializers.ModelSerializer):
    """이행 하나에 달린 원칙 점검 한 줄."""

    principle_detail = MandatoryPrincipleParentSerializer(source="principle", read_only=True)

    class Meta:
        model = OrderPrincipleCheck
        fields = ("id", "principle", "principle_detail", "is_done", "note")


class OrderListSerializer(DomainPropertySerializer):
    PROPERTY_FIELDS = ("notional",)

    security_detail = SecurityParentSerializer(source="security", read_only=True)

    # 화면이 "이 값 정말 맞나" 를 사람에게 물은 뒤 다시 보내는 플래그. 모델 컬럼이 아니라
    # 저장 직전에 버린다. 이상값 검사를 통과시키는 유일한 열쇠다.
    confirm_outlier = serializers.BooleanField(write_only=True, required=False, default=False)

    # DAY 로 지정된 필수원칙의 준수 여부. 이행을 **새로 만들 때는 빠짐없이** 보내야 한다.
    #   "principle_checks": [{"principle": 3, "is_done": true, "note": "..."}]
    principle_checks = OrderPrincipleCheckSerializer(many=True, required=False)

    class Meta:
        model = Order
        fields = "__all__"

    def validate(self, attrs):
        attrs = super().validate(attrs)
        confirmed = attrs.pop("confirm_outlier", False)
        self._validate_principle_checks(attrs)

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

    # ── 원칙 점검 ────────────────────────────────────────
    def _validate_principle_checks(self, attrs):
        """DAY 로 지정된 필수원칙이 빠짐없이 들어왔는지 본다.

        **새로 만들 때만 필수다.** 수정에는 강제하지 않는다 — 이 규칙이 생기기 전에 쌓인
        이행이 이미 있고, 그것들을 고치려 할 때마다 지금 와서 원칙 체크를 요구하면
        과거 기록을 손댈 수 없게 된다.

        `is_done=False` 를 막지 않는다. "안 지켰다" 는 실패가 아니라 이 앱이 가장 알고 싶은
        기록이다. 막는 것은 **답하지 않고 넘어가는 것** 하나뿐이다.
        """
        checks = attrs.get("principle_checks")

        required = set(
            MandatoryPrinciple.objects.filter(scopes__period_type=PeriodType.DAY).values_list(
                "id", flat=True
            )
        )
        given = {c["principle"].id for c in (checks or [])}

        duplicated = len(checks or []) - len(given)
        if duplicated:
            raise serializers.ValidationError(
                {"principle_checks": "같은 원칙이 두 번 들어왔다. 원칙당 한 줄만 보내라."}
            )

        unknown = given - required
        if unknown:
            raise serializers.ValidationError(
                {
                    "principle_checks": (
                        f"이행 점검 대상이 아닌 원칙이 들어왔다: {sorted(unknown)}. "
                        "필수원칙의 적용기간에 '일'(DAY) 을 켜야 이행에서 점검한다."
                    )
                }
            )

        if self.instance is not None:
            return  # 수정은 강제하지 않는다

        missing = required - given
        if missing:
            contents = {
                p.id: (p.content or "").strip().splitlines()[0][:30] if p.content else f"#{p.id}"
                for p in MandatoryPrinciple.objects.filter(id__in=missing)
            }
            raise serializers.ValidationError(
                {
                    "principle_checks": (
                        "점검하지 않은 필수원칙이 있다: "
                        + ", ".join(f"[{pid}] {contents.get(pid, '')}" for pid in sorted(missing))
                        + ". 지켰는지 아닌지를 반드시 답해야 한다 (아니라고 답해도 저장된다)."
                    )
                }
            )

    @transaction.atomic
    def create(self, validated_data):
        checks = validated_data.pop("principle_checks", [])
        instance = super().create(validated_data)
        self._save_checks(instance, checks)
        return instance

    @transaction.atomic
    def update(self, instance, validated_data):
        # 키가 안 왔으면 기존 점검을 그대로 둔다. 빈 배열([])은 "전부 지운다" 가 아니라
        # 여기서도 그대로 둔다 — 이행의 점검 기록을 통째로 비우는 경로는 열지 않는다.
        checks = validated_data.pop("principle_checks", None)
        instance = super().update(instance, validated_data)
        if checks:
            self._save_checks(instance, checks)
        return instance

    @staticmethod
    def _save_checks(instance, checks):
        """원칙당 한 줄로 upsert. 같은 이행을 다시 저장해도 줄이 늘지 않는다."""
        for check in checks:
            OrderPrincipleCheck.all_objects.update_or_create(
                order=instance,
                principle=check["principle"],
                defaults={
                    "is_done": check["is_done"],
                    "note": check.get("note"),
                    "is_deleted": False,
                },
            )

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
