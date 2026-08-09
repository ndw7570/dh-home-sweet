from django.db import models

from core.db import table
from core.models.common import BaseDomainModel
from trading_discipline.constants.choices import InvestmentDirection


class MonthlyInvestmentPrinciple(BaseDomainModel):
    """월투자원칙 — `monthly_investment_principles`. (월계획 × 종목)

    월계획은 종목 FK 가 없고, 이 테이블이 월계획을 종목에 연결한다.
    주계획이 종목에 직접 붙기 때문에, '월계획 → 이 원칙 → 종목 → 주계획' 으로
    다섯 계층이 겨우 하나로 이어진다. 계획 캐스케이드 조립의 이음매다.
    """

    id = models.AutoField(primary_key=True, db_comment="ID")
    monthly_plan = models.ForeignKey(
        "trading_discipline.MonthlyInvestmentPlan",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        db_column="monthly_plan_id",
        related_name="principles",
        db_comment="월계획ID",
    )
    security = models.ForeignKey(
        "trading_discipline.Security",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        db_column="security_id",
        related_name="monthly_principles",
        db_comment="종목ID",
    )
    direction = models.CharField(
        max_length=20,
        choices=InvestmentDirection.choices,
        null=True,
        blank=True,
        db_comment="투자방향",
    )
    rationale = models.TextField(null=True, blank=True, db_comment="근거")
    predicted_price = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True, db_comment="예상가격"
    )
    stop_loss_price = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True, db_comment="손절가격"
    )

    class Meta:
        db_table = table("monthly_investment_principles")
        verbose_name = "월투자원칙"
        verbose_name_plural = "월투자원칙"
        indexes = [
            models.Index(fields=["monthly_plan", "security"], name="mprin_plan_sec_idx"),
        ]

    def __str__(self):
        return f"월원칙#{self.id}"
