from django.db import models

from core.db import table
from core.models.common import BaseDomainModel
from trading_discipline.constants.choices import InvestmentDirection, Market, PlanStatus
from trading_discipline.models.planning._mixins import PlanPeriodMixin


class AnnualInvestmentPlan(PlanPeriodMixin, BaseDomainModel):
    """연투자계획 — `annual_investment_plan`. 계획 5계층의 뿌리.

    계좌 × 시장 단위로 1년치 논리(thesis)와 방향(direction), 목표수익·손절 비율을 잡는다.
    아래 네 계층은 전부 이 논리의 분해다. 그래서 연계획의 `status` 가 CLOSED 로 가면
    하위 분기/월 계획은 근거를 잃는다.
    """

    PERIOD_LEVEL = "YEAR"

    id = models.AutoField(primary_key=True, db_comment="ID")
    account = models.ForeignKey(
        "trading_discipline.BrokerAccount",
        on_delete=models.PROTECT,
        db_column="account_id",
        related_name="annual_plans",
        db_comment="증권사계좌ID",
    )
    market = models.CharField(max_length=20, choices=Market.choices, db_comment="시장")
    title = models.CharField(max_length=200, db_comment="계획명")
    thesis = models.TextField(db_comment="투자논리")
    direction = models.CharField(
        max_length=20, choices=InvestmentDirection.choices, db_comment="투자방향"
    )
    status = models.CharField(
        max_length=20, choices=PlanStatus.choices, default=PlanStatus.DRAFT, db_comment="계획상태"
    )
    valid_from = models.DateField(db_comment="유효시작일")
    valid_until = models.DateField(db_comment="유효종료일")
    target_return_ratio = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True, db_comment="목표수익비율"
    )
    stop_loss_ratio = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True, db_comment="손절비율"
    )

    class Meta:
        db_table = table("annual_investment_plan")
        verbose_name = "연투자계획"
        verbose_name_plural = "연투자계획"
        indexes = [
            models.Index(fields=["account", "status"], name="annual_account_status_idx"),
            models.Index(fields=["valid_from", "valid_until"], name="annual_valid_idx"),
        ]

    def __str__(self):
        return self.title
