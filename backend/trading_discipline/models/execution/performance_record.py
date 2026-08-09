from django.db import models

from core.db import table
from core.models.common import BaseDomainModel
from trading_discipline.constants.choices import PeriodType


class PerformanceRecord(BaseDomainModel):
    """성과 — `performance_records`. (종목 × 기간)

    비용을 항목별로 쪼개 놓은 것이 이 테이블의 성격이다.
    이자비용·수수료·세금·기타비용을 따로 세워 두면, 수익률이 낮은 이유가
    판단이 틀려서인지 비용이 갉아먹어서인지 갈라 볼 수 있다.

    `benchmark_return_rate` 와 `max_drawdown` 이 같이 있는 것도 같은 맥락이다.
    "벌었다" 가 아니라 "시장보다 잘했는가 / 그 과정에서 얼마나 깨졌는가" 를 묻는다.

    ⚠ `security_id` 에 FK 제약이 DDL 에 없다. 모델에서는 FK 로 걸었다.
    """

    id = models.AutoField(primary_key=True, db_comment="id")
    security = models.ForeignKey(
        "trading_discipline.Security",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        db_column="security_id",
        related_name="performance_records",
        db_comment="종목ID",
    )
    period_type = models.CharField(
        max_length=20, choices=PeriodType.choices, null=True, blank=True, db_comment="기간유형"
    )
    period_start = models.DateField(null=True, blank=True, db_comment="기간시작일")
    period_end = models.DateField(null=True, blank=True, db_comment="기간종료일")

    realized_profit = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True, db_comment="실현손익"
    )
    unrealized_profit = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True, db_comment="평가손익"
    )
    dividend_income = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True, db_comment="배당수익"
    )
    interest_cost = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True, db_comment="이자비용"
    )
    commission = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True, db_comment="수수료"
    )
    tax = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True, db_comment="세금"
    )
    etc_cost = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True, db_comment="기티비용"
    )
    net_profit = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True, db_comment="순손익"
    )
    return_rate = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True, db_comment="수익률"
    )
    benchmark_return_rate = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True, db_comment="벤치마크수익률"
    )
    max_drawdown = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True, db_comment="최대낙폭"
    )

    #: 화면의 비용 분해 막대가 쓰는 항목.
    COST_FIELDS = ("interest_cost", "commission", "tax", "etc_cost")
    INCOME_FIELDS = ("realized_profit", "unrealized_profit", "dividend_income")

    class Meta:
        db_table = table("performance_records")
        verbose_name = "성과"
        verbose_name_plural = "성과"
        indexes = [
            models.Index(fields=["security", "-period_end"], name="perf_sec_period_idx"),
            models.Index(fields=["period_type", "-period_end"], name="perf_type_period_idx"),
        ]

    def __str__(self):
        return f"성과#{self.id} ({self.period_start} ~ {self.period_end})"

    @property
    def total_cost(self):
        values = [getattr(self, f) for f in self.COST_FIELDS]
        values = [v for v in values if v is not None]
        return sum(values) if values else None

    @property
    def excess_return(self):
        """벤치마크 대비 초과수익률. 이게 음수면 시장을 이기지 못한 것이다."""
        if self.return_rate is None or self.benchmark_return_rate is None:
            return None
        return self.return_rate - self.benchmark_return_rate
