from django.db import models

from core.db import table
from core.models.common import BaseDomainModel
from trading_discipline.constants.choices import MarketTrend, ScenarioPlanning
from trading_discipline.models.planning._mixins import CONFIDENCE_VALIDATORS, PlanPeriodMixin


class MonthlyInvestmentPlan(PlanPeriodMixin, BaseDomainModel):
    """월투자계획 — `monthly_investment_plan`.

    여기서부터 `scenario_planning` / `predicted_trend` / `confidence_score` 가 등장한다.
    같은 달에 대해 BASE/BULL/BEAR 를 각각 세워 두고, 각각에 확신도를 매기는 구조다.
    확신도를 남겨야 나중에 "확신했던 것과 틀렸던 것" 을 갈라서 볼 수 있다.

    종목별 예상가·손절가는 이 테이블이 아니라 `monthly_investment_principles` 에 있다.
    """

    PERIOD_LEVEL = "MONTH"

    id = models.AutoField(primary_key=True, db_comment="ID")
    quarterly_plan = models.ForeignKey(
        "trading_discipline.QuarterlyInvestmentPlan",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        db_column="quarterly_plan_id",
        related_name="monthly_plans",
        db_comment="분기계획ID",
    )
    title = models.CharField(max_length=200, db_comment="계획명")
    scenario_planning = models.CharField(
        max_length=20,
        choices=ScenarioPlanning.choices,
        default=ScenarioPlanning.BASE,
        db_comment="시나리오계획",
    )
    predicted_trend = models.CharField(
        max_length=20, choices=MarketTrend.choices, db_comment="예상추세"
    )
    thesis = models.TextField(db_comment="투자논리")
    confidence_score = models.IntegerField(
        null=True, blank=True, validators=CONFIDENCE_VALIDATORS, db_comment="계획확신도"
    )
    allocation_ratio = models.JSONField(null=True, blank=True, db_comment="벨런싱비율")
    valid_from = models.DateField(db_comment="유효시작일")
    valid_until = models.DateField(db_comment="유효종료일")

    class Meta:
        db_table = table("monthly_investment_plan")
        verbose_name = "월투자계획"
        verbose_name_plural = "월투자계획"
        indexes = [
            models.Index(fields=["quarterly_plan"], name="monthly_quarterly_idx"),
            models.Index(fields=["valid_from", "valid_until"], name="monthly_valid_idx"),
        ]

    def __str__(self):
        return f"{self.title} [{self.get_scenario_planning_display()}]"
