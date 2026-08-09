from django.db import models

from core.db import table
from core.models.common import BaseDomainModel
from trading_discipline.constants.choices import MarketTrend, ScenarioPlanning
from trading_discipline.models.planning._mixins import CONFIDENCE_VALIDATORS, PlanPeriodMixin


class DailyInvestmentPlan(PlanPeriodMixin, BaseDomainModel):
    """일투자계획 — `daily_investment_plan`. 계획 5계층의 끝.

    주계획을 하루 단위로 쪼갠 것이라, 종목은 주계획을 통해서만 안다(`security` 프로퍼티).
    실제 주문(`orders`)이 규율을 지켰는지 대조하는 기준선이 이 계층이다.
    """

    PERIOD_LEVEL = "DAY"

    id = models.AutoField(primary_key=True, db_comment="ID")
    weekly_plan = models.ForeignKey(
        "trading_discipline.WeeklyInvestmentPlan",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        db_column="weekly_plan_id",
        related_name="daily_plans",
        db_comment="주계획ID",
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
    predicted_price = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True, db_comment="예상가격"
    )
    stop_loss_price = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True, db_comment="손절가격"
    )

    class Meta:
        db_table = table("daily_investment_plan")
        verbose_name = "일투자계획"
        verbose_name_plural = "일투자계획"
        indexes = [
            models.Index(fields=["weekly_plan"], name="daily_weekly_idx"),
            models.Index(fields=["valid_from", "valid_until"], name="daily_valid_idx"),
        ]

    def __str__(self):
        return f"{self.title} [{self.get_scenario_planning_display()}]"

    @property
    def security(self):
        """일계획은 종목 FK 가 없다. 주계획을 통해서만 종목에 닿는다."""
        return self.weekly_plan.security if self.weekly_plan_id else None
