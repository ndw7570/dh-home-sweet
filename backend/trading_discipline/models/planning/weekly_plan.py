from django.db import models

from core.db import table
from core.models.common import BaseDomainModel
from trading_discipline.constants.choices import MarketTrend, ScenarioPlanning
from trading_discipline.models.planning._mixins import CONFIDENCE_VALIDATORS, PlanPeriodMixin


class WeeklyInvestmentPlan(PlanPeriodMixin, BaseDomainModel):
    """주투자계획 — `weekly_investment_plan`.

    계획 5계층은 이제 연 → 분기 → 월 → **주** → 일 로 FK 로 곧게 이어진다.
    (v0.0.1 은 주계획이 월계획과 FK 로 이어지지 않고 종목+기간 겹침으로 추정하는
    구조였다. v0.0.2 에서 `monthly_plan_id` FK 가 붙으면서 그 '꺾이는 계층'이 사라졌다.)

    `security` 도 필수로 조인다 — 주계획은 반드시 한 종목에 대한 것이어야 한다.
    `available_amount`(가용금액)가 이 계층에만 있는 것도 같은 이유다: 실제로 돈을
    쓰는 단위가 주 단위라는 뜻.
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
    security = models.ForeignKey(
        "trading_discipline.Security",
        on_delete=models.CASCADE,
        db_column="security_id",
        related_name="weekly_plans",
        db_comment="종목ID",
    )
    title = models.CharField(max_length=200, db_comment="계획명")
    scenario_planning = models.CharField(
        max_length=20,
        choices=ScenarioPlanning.choices,
        default=ScenarioPlanning.BASE,
        db_comment="시나리오계획",
    )
    available_amount = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True, db_comment="가용금액"
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
        db_table = table("weekly_investment_plan")
        verbose_name = "주투자계획"
        verbose_name_plural = "주투자계획"
        indexes = [
            models.Index(fields=["security", "valid_from"], name="weekly_sec_valid_idx"),
            models.Index(fields=["valid_from", "valid_until"], name="weekly_valid_idx"),
            models.Index(fields=["monthly_plan", "valid_from"], name="weekly_mplan_valid_idx"),
        ]

    def __str__(self):
        return f"{self.title} [{self.get_scenario_planning_display()}]"

    @property
    def risk_reward(self):
        """예상가/손절가가 둘 다 있으면 손익비를 계산해 둔다. 현재가는 종목에서 가져온다."""
        base = self.security.current_price if self.security_id else None
        if base is None or not self.predicted_price or not self.stop_loss_price:
            return None
        upside = self.predicted_price - base
        downside = base - self.stop_loss_price
        if downside <= 0:
            return None
        return round(float(upside / downside), 2)
