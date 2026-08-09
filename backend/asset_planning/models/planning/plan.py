from django.conf import settings
from django.db import models

from core.models.common import SoftDeleteModel


class Plan(SoftDeleteModel):
    """계획 — 이 프로그램의 1급 객체. 실적과 회고는 항상 계획에 매달린다."""

    plan_id = models.AutoField(primary_key=True, db_comment="계획ID")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column="user_id",
        related_name="plans",
        db_comment="유저ID",
    )
    title = models.CharField(max_length=200, null=True, blank=True, db_comment="계획명")
    period_type = models.CharField(
        max_length=20, null=True, blank=True, db_comment="주기 (MONTH/QUARTER/YEAR)"
    )
    start_date = models.DateField(null=True, blank=True, db_comment="시작일")
    end_date = models.DateField(null=True, blank=True, db_comment="종료일")
    target_net_worth = models.DecimalField(
        max_digits=20, decimal_places=2, null=True, blank=True, db_comment="목표 순자산"
    )
    monthly_contribution = models.DecimalField(
        max_digits=20, decimal_places=2, null=True, blank=True, db_comment="월 적립액"
    )
    status = models.CharField(
        max_length=20, default="DRAFT", db_comment="상태 (DRAFT/ACTIVE/CLOSED)"
    )

    # DDL 확정 후 추가 컬럼은 이 아래에 붙인다.

    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True, db_comment="생성일")
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True, db_comment="수정일")
    remarks = models.TextField(null=True, blank=True, db_comment="비고")

    class Meta:
        db_table = '"planner"."plan"'
        indexes = [models.Index(fields=["user", "status"], name="plan_user_status_idx")]

    def __str__(self):
        return self.title or f"Plan#{self.plan_id}"
