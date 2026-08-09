from django.db import models

from core.db import table
from core.models.common import BaseDomainModel
from trading_discipline.constants.choices import InvestmentDirection
from trading_discipline.models.planning._mixins import PlanPeriodMixin


class QuarterlyInvestmentPlan(PlanPeriodMixin, BaseDomainModel):
    """분기투자계획 — `quarterly_investment_plan`.

    이 계층이 네 가지 전략 문장(매수/매도/횡보/손절)을 문자로 붙들고 있다.
    "올랐을 때 / 내렸을 때 / 안 움직일 때 / 무너졌을 때 각각 무엇을 할 것인가"를
    분기 시작 시점에 미리 써 두게 만드는 자리다. 나중에 상황이 오면 이 문장을 읽는다.

    `rebalancing_ratio` 는 JSONB — `{"005930": 30, "000660": 20, "CASH": 50}` 형태를
    상정한다(종목코드 또는 CASH → 비중 %).
    """

    PERIOD_LEVEL = "QUARTER"

    id = models.AutoField(primary_key=True, db_comment="ID")
    annual_plan = models.ForeignKey(
        "trading_discipline.AnnualInvestmentPlan",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        db_column="annual_plan_id",
        related_name="quarterly_plans",
        db_comment="연계획ID",
    )
    title = models.CharField(max_length=200, db_comment="계획명")
    rebalancing_ratio = models.JSONField(null=True, blank=True, db_comment="리벨런싱비율")
    rebalancing_start_date = models.DateField(null=True, blank=True, db_comment="리벨런싱시작일")
    rebalancing_end_date = models.DateField(null=True, blank=True, db_comment="리벨런싱종료일")
    buy_strategy = models.TextField(null=True, blank=True, db_comment="매수전략")
    sell_strategy = models.TextField(null=True, blank=True, db_comment="매도전략")
    sideways_strategy = models.TextField(null=True, blank=True, db_comment="횡보전략")
    stop_loss_strategy = models.TextField(null=True, blank=True, db_comment="손절전략")
    direction = models.CharField(
        max_length=20, choices=InvestmentDirection.choices, db_comment="투자방향"
    )
    thesis = models.TextField(db_comment="투자논리")
    valid_from = models.DateField(db_comment="유효시작일")
    valid_until = models.DateField(db_comment="유효종료일")
    target_return_ratio = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True, db_comment="목표수익비율"
    )
    stop_loss_ratio = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True, db_comment="손절비율"
    )

    class Meta:
        db_table = table("quarterly_investment_plan")
        verbose_name = "분기투자계획"
        verbose_name_plural = "분기투자계획"
        indexes = [
            models.Index(fields=["annual_plan"], name="quarterly_annual_idx"),
            models.Index(fields=["valid_from", "valid_until"], name="quarterly_valid_idx"),
        ]

    def __str__(self):
        return self.title

    @property
    def strategy_coverage(self) -> dict[str, bool]:
        """네 상황 중 어느 것을 아직 안 적어 뒀는가 — 화면이 이걸로 빈칸을 밀어준다."""
        return {
            "buy": bool(self.buy_strategy),
            "sell": bool(self.sell_strategy),
            "sideways": bool(self.sideways_strategy),
            "stop_loss": bool(self.stop_loss_strategy),
        }
