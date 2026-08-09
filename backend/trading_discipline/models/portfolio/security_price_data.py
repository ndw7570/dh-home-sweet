from django.db import models

from core.db import table
from core.models.common import BaseDomainModel


class SecurityPriceData(BaseDomainModel):
    """가격데이터 — `security_price_data`.

    고가·저가·호가만 있고 시가/종가/거래량은 없다. 매수매도전략(`trading_strategies`)이
    이 행을 가리키므로, '어느 시점의 가격을 보고 세운 전략인가'가 남는 구조다.
    """

    id = models.AutoField(primary_key=True, db_comment="ID")
    security = models.ForeignKey(
        "trading_discipline.Security",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        db_column="security_id",
        related_name="price_data",
        db_comment="종목ID",
    )
    price_at = models.DateTimeField(null=True, blank=True, db_comment="시각")
    high_price = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True, db_comment="고가"
    )
    low_price = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True, db_comment="저가"
    )
    quote_price = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True, db_comment="호가"
    )

    class Meta:
        db_table = table("security_price_data")
        verbose_name = "가격데이터"
        verbose_name_plural = "가격데이터"
        indexes = [models.Index(fields=["security", "-price_at"], name="price_sec_at_idx")]

    def __str__(self):
        return f"가격#{self.id}"
