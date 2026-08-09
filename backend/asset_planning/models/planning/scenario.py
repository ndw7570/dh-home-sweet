from django.db import models

from core.models.common import SoftDeleteModel

from .plan import Plan


class Scenario(SoftDeleteModel):
    """시나리오 — 낙관/기준/보수. 타임라인 우측 부채꼴의 각 갈래 하나."""

    scenario_id = models.AutoField(primary_key=True, db_comment="시나리오ID")
    plan = models.ForeignKey(
        Plan,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column="plan_id",
        related_name="scenarios",
        db_comment="계획ID",
    )
    scenario_type = models.CharField(
        max_length=20, null=True, blank=True, db_comment="유형 (OPTIMISTIC/BASE/CONSERVATIVE)"
    )
    label = models.CharField(max_length=50, null=True, blank=True, db_comment="표시명")
    expected_return_rate = models.DecimalField(
        max_digits=7, decimal_places=4, null=True, blank=True, db_comment="연 기대수익률"
    )
    contribution_amount = models.DecimalField(
        max_digits=20, decimal_places=2, null=True, blank=True, db_comment="월 적립 가정액"
    )
    assumptions = models.JSONField(
        null=True, blank=True, db_comment="추가 가정값 (인플레이션/환율 등)"
    )
    is_primary = models.BooleanField(default=False, db_comment="기본 시나리오 여부")

    # DDL 확정 후 추가 컬럼은 이 아래에 붙인다.

    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True, db_comment="생성일")
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True, db_comment="수정일")
    remarks = models.TextField(null=True, blank=True, db_comment="비고")

    class Meta:
        db_table = '"planner"."scenario"'
        indexes = [models.Index(fields=["plan"], name="scenario_plan_idx")]

    def __str__(self):
        return self.label or self.scenario_type or f"Scenario#{self.scenario_id}"
