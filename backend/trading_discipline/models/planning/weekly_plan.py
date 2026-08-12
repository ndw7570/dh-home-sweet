from django.db import models

from core.db import table
from core.models.common import BaseDomainModel
from trading_discipline.constants.choices import MarketTrend, ScenarioPlanning
from trading_discipline.models.planning._mixins import CONFIDENCE_VALIDATORS, PlanPeriodMixin


class WeeklyInvestmentPlan(PlanPeriodMixin, BaseDomainModel):
    """주투자계획 — `weekly_investment_plan`. 기간만 잡는 그룹(종목 없음).

    v0.0.3 부터 종목별 필드(security / available_amount / predicted_price / stop_loss_price)는
    빠지고, 대신 `WeeklySecurityInvestmentPlan` 이 (주계획 × 종목) 조합으로 그 자리를 가진다.
    화면에서 "이번 주에 어떤 종목들을 다루기로 했는가" 를 한눈에 묶어 보이기 위한 구조.
    """

    PERIOD_LEVEL = "WEEK"

    id = models.AutoField(primary_key=True, db_comment="ID")
    monthly_plan = models.ForeignKey(
        "trading_discipline.MonthlyInvestmentPlan",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        db_column="monthly_plan_id",
        related_name="weekly_plans",
        db_comment="월투자계획ID",
    )
    title = models.CharField(max_length=200, db_comment="계획명")
    scenario_planning = models.CharField(
        max_length=20,
        choices=ScenarioPlanning.choices,
        default=ScenarioPlanning.BASE,
        db_comment="시나리오계획",
    )
    predicted_trend = models.CharField(
        max_length=20, choices=MarketTrend.choices, db_comment="예측추세"
    )
    thesis = models.TextField(db_comment="투자논리")
    confidence_score = models.IntegerField(
        null=True, blank=True, validators=CONFIDENCE_VALIDATORS, db_comment="계획확신도"
    )
    allocation_ratio = models.JSONField(null=True, blank=True, db_comment="벨런싱비율계획")
    valid_from = models.DateField(db_comment="유효시작일")
    valid_until = models.DateField(db_comment="유효종료일")

    class Meta:
        db_table = table("weekly_investment_plan")
        verbose_name = "주투자계획"
        verbose_name_plural = "주투자계획"
        indexes = [
            models.Index(fields=["valid_from", "valid_until"], name="weekly_valid_idx"),
            models.Index(fields=["monthly_plan", "valid_from"], name="weekly_mplan_valid_idx"),
        ]

    def __str__(self):
        return f"{self.title} [{self.get_scenario_planning_display()}]"
