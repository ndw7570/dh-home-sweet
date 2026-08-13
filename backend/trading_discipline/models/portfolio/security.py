from django.db import models
from django.db.models import Case, IntegerField, Sum, Value, When

from core.db import table
from core.models.common import BaseDomainModel
from trading_discipline.constants.choices import ActionType, AssetType, Currency, Market, OrderSide


class Security(BaseDomainModel):
    """종목 — `securities`.

    계획 계층의 허리다. 월계획은 `monthly_investment_principles` 를 거쳐 종목에 닿고,
    주계획은 종목에 **직접** 매달린다(FK_securities_TO_weekly_investment_plan).
    즉 '월 → 주' 를 잇는 것은 계획끼리의 FK 가 아니라 종목이다.

    보유수량은 두 조각의 합이다: 시스템 도입 시점의 **기초 보유수량** (`holding_quantity` 컬럼,
    사람이 입력) + 이후 **체결(FILL) 이행 순증감** (BUY - SELL). 최종 값은
    `computed_holding_quantity` 프로퍼티가 이 둘을 더해서 낸다.

    이렇게 두 조각으로 나눈 이유가 있다. 앱 도입 전에 이미 갖고 있던 물량은 이행 기록이
    없어 FILL 만으론 복원되지 않는다. 그렇다고 과거 매매를 전부 소급 입력하게 하면
    앱이 짐이 된다. 그래서 시작 잔고만 한 번 넣고, 이후 매매만 이행에 남기게 한다.

    현재가도 이 테이블에 남아 사람이 입력한다. 평가금액은 (기초+FILL) × 현재가로 나간다.
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
    # 시스템 도입 시점의 기초 보유수량. 이후 매매는 FILL 이행에서 자동 집계되고,
    # 최종 보유수량은 (이 값 + FILL 순증감) 으로 `computed_holding_quantity` 가 낸다.
    holding_quantity = models.IntegerField(null=True, blank=True, db_comment="기초 보유수량")
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
    def computed_holding_quantity(self):
        """기초 보유수량 + FILL 이행의 매수합 - 매도합.

        FILL 순증감은 리스트 응답의 경우 뷰셋이 `annotate(_fill_qty=...)` 로 미리 계산해
        인스턴스에 실어 준다(N+1 회피). annotation 이 있으면 그 값을 쓰고, 없으면
        여기서 직접 aggregate 를 돈다.

        기초 보유수량이 비어 있고 FILL 도 없으면 0. `None` 은 "미지" 라는 뜻이 되는데,
        보유가 0 인 게 사실이라 0 을 반환하는 게 정확하다.
        """
        opening = self.holding_quantity or 0
        cached = self.__dict__.get("_fill_qty")
        if cached is not None:
            return opening + cached
        agg = self.orders.filter(action_type=ActionType.FILL).aggregate(
            qty=Sum(
                Case(
                    When(side=OrderSide.BUY, then="quantity"),
                    When(side=OrderSide.SELL, then=-1 * models.F("quantity")),
                    default=Value(0),
                    output_field=IntegerField(),
                )
            )
        )
        return opening + (agg["qty"] or 0)

    @property
    def market_value(self):
        """평가금액 = (기초 + FILL 순증감) × 현재주가. 현재주가가 비면 None."""
        if self.current_price is None:
            return None
        qty = self.computed_holding_quantity
        if qty is None:
            return None
        return qty * self.current_price
