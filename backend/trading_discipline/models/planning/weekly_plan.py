from django.db import models

from core.db import table
from core.models.common import BaseDomainModel
from trading_discipline.constants.choices import MarketTrend, ScenarioPlanning
from trading_discipline.models.planning._mixins import CONFIDENCE_VALIDATORS, PlanPeriodMixin


class WeeklyInvestmentPlan(PlanPeriodMixin, BaseDomainModel):
    """주투자계획 — `weekly_investment_plan`.

    ⚠ 계층이 여기서 한 번 꺾인다.
    연→분기→월 은 계획끼리 FK 로 이어지는데, 주계획은 월계획이 아니라 **종목**에 붙는다
    (FK_securities_TO_weekly_investment_plan). DDL 그대로다.

    그래서 '이 주계획이 어느 월계획 밑인가'는 FK 로 못 읽고, 종목과 기간이 겹치는
    월계획을 찾아 맞춰야 한다. 그 조립은 `services/cascade_service.py` 가 한다.

    `available_amount`(가용금액)가 이 계층에만 있다 — 실제로 돈을 쓰는 단위가 주 단위라는 뜻.
    """

    PERIOD_LEVEL = "WEEK"

    id = models.AutoField(primary_key=True, db_comment="ID")
    security = models.ForeignKey(
        "trading_discipline.Security",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
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
