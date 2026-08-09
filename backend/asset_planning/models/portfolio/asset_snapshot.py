from django.conf import settings
from django.db import models

from core.models.common import SoftDeleteModel


class AssetSnapshot(SoftDeleteModel):
    """자산 스냅샷 — 타임라인 좌측(과거 실적선)을 그리는 원천 데이터."""

    snapshot_id = models.AutoField(primary_key=True, db_comment="스냅샷ID")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column="user_id",
        related_name="asset_snapshots",
        db_comment="유저ID",
    )
    snapshot_date = models.DateField(null=True, blank=True, db_comment="기준일")
    net_worth = models.DecimalField(
        max_digits=20, decimal_places=2, null=True, blank=True, db_comment="순자산"
    )
    cash_amount = models.DecimalField(
        max_digits=20, decimal_places=2, null=True, blank=True, db_comment="현금"
    )
    invested_amount = models.DecimalField(
        max_digits=20, decimal_places=2, null=True, blank=True, db_comment="투자원금"
    )
    evaluation_amount = models.DecimalField(
        max_digits=20, decimal_places=2, null=True, blank=True, db_comment="평가금액"
    )
    source = models.CharField(
        max_length=20, default="MANUAL", db_comment="집계출처 (MANUAL/SYNC/BATCH)"
    )

    # DDL 확정 후 추가 컬럼은 이 아래에 붙인다.

    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True, db_comment="생성일")
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True, db_comment="수정일")
    remarks = models.TextField(null=True, blank=True, db_comment="비고")

    class Meta:
        db_table = '"planner"."asset_snapshot"'
        indexes = [
            models.Index(fields=["user", "snapshot_date"], name="snapshot_user_date_idx"),
        ]

    def __str__(self):
        return f"{self.snapshot_date} / {self.net_worth}"
