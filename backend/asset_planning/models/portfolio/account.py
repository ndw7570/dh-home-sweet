from django.conf import settings
from django.db import models

from core.models.common import SoftDeleteModel


class Account(SoftDeleteModel):
    """계좌 — 자산이 담기는 그릇 (증권/은행/현금/연금)."""

    account_id = models.AutoField(primary_key=True, db_comment="계좌ID")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column="user_id",
        related_name="accounts",
        db_comment="소유 유저ID",
    )
    name = models.CharField(max_length=100, null=True, blank=True, db_comment="계좌 별칭")
    account_type = models.CharField(
        max_length=20, null=True, blank=True, db_comment="계좌유형 (SECURITIES/BANK/CASH/PENSION)"
    )
    institution = models.CharField(max_length=100, null=True, blank=True, db_comment="금융기관")
    currency = models.CharField(max_length=3, default="KRW", db_comment="통화")
    is_active = models.BooleanField(default=True, db_comment="사용여부")
    opened_at = models.DateField(null=True, blank=True, db_comment="개설일")

    # DDL 확정 후 추가 컬럼은 이 아래에 붙인다.

    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True, db_comment="생성일")
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True, db_comment="수정일")
    remarks = models.TextField(null=True, blank=True, db_comment="비고")

    class Meta:
        db_table = '"planner"."account"'
        indexes = [models.Index(fields=["user"], name="account_user_idx")]

    def __str__(self):
        return self.name or f"Account#{self.account_id}"
