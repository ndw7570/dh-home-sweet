from django.db import models

from core.models.common import SoftDeleteModel

from .account import Account
from .holding import Holding


class Transaction(SoftDeleteModel):
    """거래 — 매수/매도/입출금/배당. 일지(JournalEntry)와 1:1로 연결될 수 있다."""

    transaction_id = models.AutoField(primary_key=True, db_comment="거래ID")
    account = models.ForeignKey(
        Account,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column="account_id",
        related_name="transactions",
        db_comment="계좌ID",
    )
    holding = models.ForeignKey(
        Holding,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column="holding_id",
        related_name="transactions",
        db_comment="보유ID",
    )
    journal_entry = models.ForeignKey(
        "asset_planning.JournalEntry",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column="entry_id",
        related_name="transactions",
        db_comment="연결된 일지ID (없으면 '이유 미기재')",
    )
    traded_at = models.DateTimeField(null=True, blank=True, db_comment="체결일시")
    trade_type = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        db_comment="거래유형 (BUY/SELL/DEPOSIT/WITHDRAW/DIVIDEND)",
    )
    quantity = models.DecimalField(
        max_digits=20, decimal_places=6, null=True, blank=True, db_comment="수량"
    )
    price = models.DecimalField(
        max_digits=20, decimal_places=4, null=True, blank=True, db_comment="단가"
    )
    amount = models.DecimalField(
        max_digits=20, decimal_places=2, null=True, blank=True, db_comment="거래금액"
    )
    fee = models.DecimalField(
        max_digits=20, decimal_places=2, null=True, blank=True, db_comment="수수료/세금"
    )

    # DDL 확정 후 추가 컬럼은 이 아래에 붙인다.

    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True, db_comment="생성일")
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True, db_comment="수정일")
    remarks = models.TextField(null=True, blank=True, db_comment="비고")

    class Meta:
        db_table = '"planner"."transaction"'
        indexes = [
            models.Index(fields=["account", "traded_at"], name="tx_account_traded_idx"),
            models.Index(fields=["journal_entry"], name="tx_journal_idx"),
        ]

    def __str__(self):
        return f"{self.trade_type or 'TX'}#{self.transaction_id}"
