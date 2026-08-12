from django.db import models

from core.db import table
from core.models.common import BaseDomainModel
from trading_discipline.constants.choices import MarketTrend, ScenarioPlanning
from trading_discipline.models.planning._mixins import CONFIDENCE_VALIDATORS


class WeeklySecurityInvestmentPlan(BaseDomainModel):
    """주투자종목별계획 — `weekly_security_investment_plan`. (주계획 × 종목)

    v0.0.3 에서 새로 생긴 계층. 주계획(WEEK)은 이제 기간 그룹만 하고,
    종목별 예상가·손절가·가용금액은 이 테이블이 가진다. 일계획(DAY)의 부모도
    주계획이 아니라 이쪽으로 바뀌었다. 화면 트리로 보면:
      MONTH → WEEK(기간) → WEEKLY_SECURITY(종목) → DAY
    """

    id = models.AutoField(primary_key=True, db_comment="ID")
    weekly_plan = models.ForeignKey(
        "trading_discipline.WeeklyInvestmentPlan",
        on_delete=models.CASCADE,
        db_column="weekly_plan_id",
        related_name="security_plans",
        db_comment="주계획ID",
    )
    security = models.ForeignKey(
        "trading_discipline.Security",
        on_delete=models.CASCADE,
        db_column="security_id",
        related_name="weekly_security_plans",
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
    predicted_price = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True, db_comment="예상가격"
    )
    stop_loss_price = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True, db_comment="손절가격"
    )

    class Meta:
        db_table = table("weekly_security_investment_plan")
        verbose_name = "주투자종목별계획"
        verbose_name_plural = "주투자종목별계획"
        indexes = [
            models.Index(fields=["weekly_plan", "security"], name="wsec_plan_sec_idx"),
            models.Index(fields=["security"], name="wsec_sec_idx"),
        ]

    def __str__(self):
        return f"{self.title} [{self.get_scenario_planning_display()}]"

    @property
    def risk_reward(self):
        """예상가/손절가/현재가 다 있을 때만 손익비를 계산한다."""
        base = self.security.current_price if self.security_id else None
        if base is None or not self.predicted_price or not self.stop_loss_price:
            return None
        upside = self.predicted_price - base
        downside = base - self.stop_loss_price
        if downside <= 0:
            return None
        return round(float(upside / downside), 2)
