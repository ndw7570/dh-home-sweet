from django.db import models

from core.db import table
from core.models.common import SoftDeleteModel
from trading_discipline.constants.choices import ActionType, OrderSide, OrderType


class Order(SoftDeleteModel):
    """이행 — `orders`. 계획이 실제 행동으로 내려온 자리.

    테이블 코멘트가 '주문' 이 아니라 **'이행'** 인 게 핵심이다.
    `action_type` 이 PLAN/ORDER/FILL/CANCEL/REJECT 로 갈리므로, 같은 종목에 대해
    "이렇게 하기로 했다(PLAN) → 실제로 냈다(ORDER) → 체결됐다(FILL)" 가 한 테이블에 쌓인다.
    계획한 것과 실제로 한 것의 간극이 이 테이블 안에서 그대로 드러난다.

    DDL 에 `updated_at` 이 없다 — 한 번 남긴 이행 기록은 고치는 것이 아니라는 뜻으로 읽힌다.
    """

    id = models.AutoField(primary_key=True, db_comment="ID")
    security = models.ForeignKey(
        "trading_discipline.Security",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        db_column="security_id",
        related_name="orders",
        db_comment="종목ID",
    )
    action_type = models.CharField(
        max_length=20, choices=ActionType.choices, null=True, blank=True, db_comment="행위종류"
    )
    order_type = models.CharField(
        max_length=20, choices=OrderType.choices, null=True, blank=True, db_comment="주문유형"
    )
    side = models.CharField(
        max_length=20, choices=OrderSide.choices, null=True, blank=True, db_comment="매수매도구분"
    )
    quantity = models.IntegerField(null=True, blank=True, db_comment="수량")
    limit_price = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True, db_comment="지정가격"
    )
    executed_at = models.DateTimeField(null=True, blank=True, db_comment="이행시각")

    created_at = models.DateField(auto_now_add=True, null=True, blank=True, db_comment="생성일")
    remarks = models.TextField(null=True, blank=True, db_comment="비고")

    class Meta:
        db_table = table("orders")
        verbose_name = "이행"
        verbose_name_plural = "이행"
        indexes = [
            models.Index(fields=["security", "-executed_at"], name="order_sec_executed_idx"),
            models.Index(fields=["action_type"], name="order_action_idx"),
        ]

    def __str__(self):
        return f"{self.get_side_display() or '?'} {self.quantity or 0} ({self.get_action_type_display() or '?'})"

    @property
    def notional(self):
        """지정가 × 수량. 시장가 주문이면 limit_price 가 비어서 None 이 된다."""
        if self.quantity is None or self.limit_price is None:
            return None
        return self.quantity * self.limit_price
