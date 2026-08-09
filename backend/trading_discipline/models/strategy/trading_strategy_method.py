from django.db import models

from core.db import table
from core.models.common import BaseDomainModel
from trading_discipline.constants.choices import StrategyType


class TradingStrategyMethod(BaseDomainModel):
    """매수매도방법 — `trading_strategy_methods`. n차 분할 한 줄.

    `step_no` 가 n차, `price_ratio` 가 기준가 대비 몇 %, `quantity_ratio` 가 총량 대비 몇 %.
    예: 분할매수 1차 -3% 30%, 2차 -7% 30%, 3차 -12% 40%.

    이 표를 미리 채워 두는 것이 규율의 실체다. 물타기를 즉흥으로 하지 않으려면
    떨어지기 전에 몇 %에 얼마를 살지 적혀 있어야 한다.
    """

    id = models.AutoField(primary_key=True, db_comment="ID")
    strategy = models.ForeignKey(
        "trading_discipline.TradingStrategy",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        db_column="strategy_id",
        related_name="methods",
        db_comment="전략ID",
    )
    strategy_type = models.CharField(
        max_length=20, choices=StrategyType.choices, null=True, blank=True, db_comment="전략종류"
    )
    step_no = models.IntegerField(null=True, blank=True, db_comment="n차")
    price_ratio = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True, db_comment="전략가격비율"
    )
    quantity_ratio = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True, db_comment="전략수량비율"
    )
    sector = models.CharField(max_length=100, null=True, blank=True, db_comment="업종")

    class Meta:
        db_table = table("trading_strategy_methods")
        verbose_name = "매수매도방법"
        verbose_name_plural = "매수매도방법"
        ordering = ("strategy_id", "strategy_type", "step_no")
        indexes = [
            models.Index(fields=["strategy", "strategy_type"], name="method_strategy_type_idx"),
        ]

    def __str__(self):
        return f"{self.get_strategy_type_display() or '방법'} {self.step_no or '?'}차"
