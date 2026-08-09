from django.conf import settings
from django.db import models

from core.models.common import SoftDeleteModel

from ..planning.plan import Plan


class Review(SoftDeleteModel):
    """
    회고 — 주기가 끝나면 배치가 READY 상태로 미리 만들어 둔다.
    사용자는 원인(cause_note)과 다음 주기 조정(adjustment_note)만 채운다.
    """

    review_id = models.AutoField(primary_key=True, db_comment="회고ID")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column="user_id",
        related_name="reviews",
        db_comment="유저ID",
    )
    plan = models.ForeignKey(
        Plan,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column="plan_id",
        related_name="reviews",
        db_comment="대상 계획ID",
    )
    period_type = models.CharField(
        max_length=20, null=True, blank=True, db_comment="주기 (MONTH/QUARTER/YEAR)"
    )
    period_start = models.DateField(null=True, blank=True, db_comment="주기 시작일")
    period_end = models.DateField(null=True, blank=True, db_comment="주기 종료일")
    planned_value = models.DecimalField(
        max_digits=20, decimal_places=2, null=True, blank=True, db_comment="계획값"
    )
    actual_value = models.DecimalField(
        max_digits=20, decimal_places=2, null=True, blank=True, db_comment="실적값"
    )
    gap_amount = models.DecimalField(
        max_digits=20, decimal_places=2, null=True, blank=True, db_comment="차이 금액"
    )
    cause_note = models.TextField(null=True, blank=True, db_comment="차이 원인 (사용자 작성)")
    adjustment_note = models.TextField(
        null=True, blank=True, db_comment="다음 주기 조정 (사용자 작성)"
    )
    status = models.CharField(max_length=20, default="READY", db_comment="상태 (READY/DONE)")

    # DDL 확정 후 추가 컬럼은 이 아래에 붙인다.

    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True, db_comment="생성일")
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True, db_comment="수정일")
    remarks = models.TextField(null=True, blank=True, db_comment="비고")

    class Meta:
        db_table = '"planner"."review"'
        indexes = [
            models.Index(fields=["user", "period_end"], name="review_user_period_idx"),
            models.Index(fields=["status"], name="review_status_idx"),
        ]

    def __str__(self):
        return f"Review {self.period_start}~{self.period_end}"
