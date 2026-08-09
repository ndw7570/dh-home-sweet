from django.db import models

from core.models.common import SoftDeleteModel

from .scenario import Scenario


class ProjectionSnapshot(SoftDeleteModel):
    """
    예상 스냅샷 — 이 프로그램의 시그니처.

    "언제(projected_on) 세운 예상이, 어느 시점(target_date)을 얼마로 봤는가"를
    한 줄로 남긴다. 새 예상이 생겨도 이전 행은 절대 갱신하지 않는다.
    타임라인의 회색 파선과 '예상 적중률'이 전부 이 테이블에서 나온다.
    """

    projection_id = models.AutoField(primary_key=True, db_comment="예상ID")
    scenario = models.ForeignKey(
        Scenario,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column="scenario_id",
        related_name="projections",
        db_comment="시나리오ID",
    )
    projected_on = models.DateField(null=True, blank=True, db_comment="예상을 세운 날")
    target_date = models.DateField(null=True, blank=True, db_comment="예상 대상 시점")
    projected_value = models.DecimalField(
        max_digits=20, decimal_places=2, null=True, blank=True, db_comment="예상 순자산"
    )
    actual_value = models.DecimalField(
        max_digits=20,
        decimal_places=2,
        null=True,
        blank=True,
        db_comment="실제 순자산 (target_date 도달 후 배치가 채움)",
    )
    gap_amount = models.DecimalField(
        max_digits=20, decimal_places=2, null=True, blank=True, db_comment="차이 금액"
    )
    gap_rate = models.DecimalField(
        max_digits=7, decimal_places=4, null=True, blank=True, db_comment="차이 비율"
    )
    is_settled = models.BooleanField(default=False, db_comment="실적 대조 완료 여부")

    # DDL 확정 후 추가 컬럼은 이 아래에 붙인다.

    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True, db_comment="생성일")
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True, db_comment="수정일")
    remarks = models.TextField(null=True, blank=True, db_comment="비고")

    class Meta:
        db_table = '"planner"."projection_snapshot"'
        indexes = [
            models.Index(fields=["scenario", "projected_on"], name="proj_scenario_on_idx"),
            models.Index(fields=["target_date", "is_settled"], name="proj_target_settled_idx"),
        ]

    def __str__(self):
        return f"{self.projected_on} -> {self.target_date}"
