from django.db import models

from core.db import table
from core.models.common import BaseDomainModel


class TradingStrategy(BaseDomainModel):
    """매수매도전략 — `trading_strategies`.

    가격데이터(`security_price_data`)를 가리킨다는 점이 중요하다.
    전략을 '지금 가격 기준' 이 아니라 '그때 그 가격 기준' 으로 못박아 두는 구조라,
    나중에 왜 이 가격대에 분할을 걸었는지 되짚을 수 있다.
    실제 n차 분할표는 `trading_strategy_methods` 에 자식 행으로 들어간다.
    """

    id = models.AutoField(primary_key=True, db_comment="ID")
    price_data = models.ForeignKey(
        "trading_discipline.SecurityPriceData",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column="price_data_id",
        related_name="strategies",
        db_comment="가격데이터ID",
    )
    policy_name = models.CharField(max_length=200, null=True, blank=True, db_comment="정책명")
    sector = models.CharField(max_length=100, null=True, blank=True, db_comment="업종")
    reference_at = models.DateTimeField(null=True, blank=True, db_comment="기준시각")

    class Meta:
        db_table = table("trading_strategies")
        verbose_name = "매수매도전략"
        verbose_name_plural = "매수매도전략"
        indexes = [models.Index(fields=["sector", "-reference_at"], name="strategy_sector_at_idx")]

    def __str__(self):
        return self.policy_name or f"전략#{self.id}"
