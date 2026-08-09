from django.db import models

from core.models.common import SoftDeleteModel

from .account import Account


class Holding(SoftDeleteModel):
    """보유 종목 — 계좌 안에 들고 있는 자산 한 줄."""

    holding_id = models.AutoField(primary_key=True, db_comment="보유ID")
    account = models.ForeignKey(
        Account,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column="account_id",
        related_name="holdings",
        db_comment="계좌ID",
    )
    symbol = models.CharField(max_length=40, null=True, blank=True, db_comment="종목코드/티커")
    name = models.CharField(max_length=100, null=True, blank=True, db_comment="종목명")
    asset_class = models.CharField(
        max_length=20, null=True, blank=True, db_comment="자산군 (STOCK/ETF/BOND/CASH/ETC)"
    )
    quantity = models.DecimalField(
        max_digits=20, decimal_places=6, null=True, blank=True, db_comment="보유수량"
    )
    avg_price = models.DecimalField(
        max_digits=20, decimal_places=4, null=True, blank=True, db_comment="평균단가"
    )
    currency = models.CharField(max_length=3, default="KRW", db_comment="통화")

    # DDL 확정 후 추가 컬럼은 이 아래에 붙인다.

    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True, db_comment="생성일")
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True, db_comment="수정일")
    remarks = models.TextField(null=True, blank=True, db_comment="비고")

    class Meta:
        db_table = '"planner"."holding"'
        indexes = [models.Index(fields=["account"], name="holding_account_idx")]

    def __str__(self):
        return self.name or self.symbol or f"Holding#{self.holding_id}"
