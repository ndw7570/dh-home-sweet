from django.db import models

from core.db import table
from core.models.common import BaseDomainModel


class TradingStrategyMethod(BaseDomainModel):
    """매수매도방법 — `trading_strategy_methods`. **분할 계획 한 벌.**

    "어느 종목을 어느 가격 기준으로 어떻게 나눠 살(팔) 것인가" 의 머리에 해당한다.
    실제 n차 분할표는 `trading_strategies` 에 자식 행으로 들어간다.

        매수매도방법 #1
          가격데이터: 현대차 8/14 (고 456,000 / 저 421,500 / 현재 453,000)
          정책명: 현대차 8월 분할매수
           ├ 전략 BUY_SPLIT 1차  -3%  30%
           ├ 전략 BUY_SPLIT 2차  -7%  30%
           └ 전략 BUY_SPLIT 3차 -12%  40%

    ## 가격데이터를 여기가 갖는 이유

    분할을 몇 %에 걸지는 그때 본 가격대에서 나온다. 고가·저가가 현재가 대비 얼마나
    벌어져 있었는지(`daily_security_price_data` 의 `high_rate`/`low_rate`)가 분할 폭의
    근거이고, 그 근거는 분할표 전체에 한 번만 붙으면 된다. n차 줄마다 따로 붙일 것이
    아니다.

    가격데이터는 스냅샷이라 나중에 바뀌지 않는다. 그래서 "왜 이 가격대에 걸었나" 를
    몇 달 뒤에도 되짚을 수 있다.

    ## 2026-08-18 계층을 뒤집었다

    원래는 `TradingStrategy` 가 상위였고 이 테이블이 n차 줄이었다. 이름과 실제 역할이
    어긋나 있었다 — n차 한 줄은 '방법' 이 아니라 그 방법을 이루는 한 단계다.
    바꾸면서 가격데이터·정책명·업종·기준시각이 이쪽으로 올라왔다.
    """

    id = models.AutoField(primary_key=True, db_comment="ID")
    price_data = models.ForeignKey(
        "trading_discipline.DailySecurityPriceData",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column="price_data_id",
        related_name="methods",
        db_comment="가격데이터ID",
    )
    policy_name = models.CharField(max_length=200, null=True, blank=True, db_comment="정책명")
    sector = models.CharField(max_length=100, null=True, blank=True, db_comment="업종")
    reference_at = models.DateTimeField(null=True, blank=True, db_comment="기준시각")

    class Meta:
        db_table = table("trading_strategy_methods")
        verbose_name = "매수매도방법"
        verbose_name_plural = "매수매도방법"
        indexes = [
            models.Index(fields=["sector", "-reference_at"], name="method_sector_at_idx"),
        ]

    def __str__(self):
        return self.policy_name or f"방법#{self.id}"
