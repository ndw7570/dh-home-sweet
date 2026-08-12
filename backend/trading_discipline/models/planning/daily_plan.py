from django.db import models

from core.db import table
from core.models.common import BaseDomainModel
from trading_discipline.constants.choices import MarketTrend, ScenarioPlanning
from trading_discipline.models.planning._mixins import CONFIDENCE_VALIDATORS, PlanPeriodMixin


class DailyInvestmentPlan(PlanPeriodMixin, BaseDomainModel):
    """일투자계획 — `daily_investment_plan`. 계획 계층의 끝.

    v0.0.3 부터 부모가 `WeeklyInvestmentPlan` 이 아니라
    `WeeklySecurityInvestmentPlan` 이다 — 일계획은 이제 특정 종목의 이번 주 계획
    아래에 매달린다. 종목은 `weekly_security_plan.security` 를 통해 안다.
    실제 주문(`orders`)이 규율을 지켰는지 대조하는 기준선이 이 계층이다.
    """

    PERIOD_LEVEL = "DAY"

    id = models.AutoField(primary_key=True, db_comment="ID")
    weekly_security_plan = models.ForeignKey(
        "trading_discipline.WeeklySecurityInvestmentPlan",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        db_column="weekly_security_plan_id",
        related_name="daily_plans",
        db_comment="주투자종목별계획ID",
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
    # 예상가격과 다른 숫자다. 예상가격은 "이 종목이 여기까지 갈 것 같다"는 전망이고,
    # 목표체결가는 "나는 여기에 걸겠다"는 내 주문 가격이다. 전망이 맞았는지와
    # 내가 원하는 자리에서 체결시켰는지는 따로 재야 고칠 곳이 갈린다.
    target_fill_price = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True, db_comment="목표체결가"
    )
    stop_loss_price = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True, db_comment="손절가격"
    )

    class Meta:
        db_table = table("daily_investment_plan")
        verbose_name = "일투자계획"
        verbose_name_plural = "일투자계획"
        indexes = [
            models.Index(fields=["weekly_security_plan"], name="daily_wsec_idx"),
            models.Index(fields=["valid_from", "valid_until"], name="daily_valid_idx"),
        ]

    def __str__(self):
        return f"{self.title} [{self.get_scenario_planning_display()}]"

    @property
    def security(self):
        """일계획은 종목 FK 가 없다 — 주투자종목별계획을 거쳐 종목에 닿는다."""
        return (
            self.weekly_security_plan.security
            if self.weekly_security_plan_id
            else None
        )
