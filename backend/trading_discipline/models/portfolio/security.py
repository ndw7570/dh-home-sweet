from django.db import models

from core.db import table
from core.models.common import BaseDomainModel
from trading_discipline.constants.choices import AssetType, Currency, Market


class Security(BaseDomainModel):
    """종목 — `securities`.

    계획 계층의 허리다. 월계획은 `monthly_investment_principles` 를 거쳐 종목에 닿고,
    주계획은 종목에 **직접** 매달린다(FK_securities_TO_weekly_investment_plan).
    즉 '월 → 주' 를 잇는 것은 계획끼리의 FK 가 아니라 종목이다.

    보유수량·현재가가 이 테이블에 같이 있어서, 평가금액은 조인 없이 나온다.
    """

    id = models.AutoField(primary_key=True, db_comment="ID")
    account = models.ForeignKey(
        "trading_discipline.BrokerAccount",
        on_delete=models.PROTECT,
        db_column="account_id",
        related_name="securities",
        db_comment="계좌ID",
    )
    market = models.CharField(max_length=20, choices=Market.choices, db_comment="시장")
    symbol = models.CharField(max_length=30, db_comment="종목코드")
    name = models.CharField(max_length=200, db_comment="종목명")
    asset_type = models.CharField(max_length=20, choices=AssetType.choices, db_comment="자산유형")
    currency = models.CharField(
        max_length=3, choices=Currency.choices, default=Currency.KRW, db_comment="통화"
    )
    holding_quantity = models.IntegerField(null=True, blank=True, db_comment="보유개수")
    current_price = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True, db_comment="현재주가"
    )
    sector = models.CharField(max_length=100, null=True, blank=True, db_comment="업종")
    is_active = models.BooleanField(default=True, db_comment="관리대상여부")

    class Meta:
        db_table = table("securities")
        verbose_name = "종목"
        verbose_name_plural = "종목"
        indexes = [
            models.Index(fields=["account", "is_active"], name="sec_account_active_idx"),
            models.Index(fields=["symbol"], name="sec_symbol_idx"),
        ]

    def __str__(self):
        return f"{self.name}({self.symbol})"

    @property
    def market_value(self):
        """평가금액 = 보유개수 × 현재주가. 둘 중 하나라도 비면 None."""
        if self.holding_quantity is None or self.current_price is None:
            return None
        return self.holding_quantity * self.current_price
