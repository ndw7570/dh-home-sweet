from django.db import models

from core.db import table
from core.models.common import BaseDomainModel
from trading_discipline.constants.choices import StrategyType


class TradingStrategy(BaseDomainModel):
    """매수매도전략 — `trading_strategies`. **n차 분할 한 줄.**

    `step_no` 가 n차, `price_ratio` 가 기준가 대비 몇 %, `quantity_ratio` 가 총량 대비 몇 %.
    예: 분할매수 1차 -3% 30%, 2차 -7% 30%, 3차 -12% 40%.

    이 표를 미리 채워 두는 것이 규율의 실체다. 물타기를 즉흥으로 하지 않으려면
    떨어지기 전에 몇 %에 얼마를 살지 적혀 있어야 한다.

    머리(어느 종목·어느 가격 기준)는 `trading_strategy_methods` 가 갖는다.
    여기는 그 아래에 매달린 실행 단계다.

    ## 2026-08-18 계층을 뒤집었다

    원래는 이 테이블이 상위(가격데이터·정책명 보유)였고 `trading_strategy_methods` 가
    n차 줄이었다. 실제 역할과 이름이 어긋나 있어 뒤집었다.
    """

    id = models.AutoField(primary_key=True, db_comment="ID")
    method = models.ForeignKey(
        "trading_discipline.TradingStrategyMethod",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        db_column="method_id",
        related_name="strategies",
        db_comment="매수매도방법ID",
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
        db_table = table("trading_strategies")
        verbose_name = "매수매도전략"
        verbose_name_plural = "매수매도전략"
        ordering = ("method_id", "strategy_type", "step_no")
        indexes = [
            models.Index(fields=["method", "strategy_type"], name="strategy_method_type_idx"),
        ]

    def __str__(self):
        return f"{self.get_strategy_type_display() or '전략'} {self.step_no or '?'}차"
