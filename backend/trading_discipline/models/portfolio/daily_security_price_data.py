from decimal import Decimal

from django.db import models

from core.db import table
from core.models.common import BaseDomainModel

# 변동률은 소수 둘째 자리까지. 화면이 "+20.00%" 로 읽히는 단위다.
_TWO_PLACES = Decimal("0.01")


class DailySecurityPriceData(BaseDomainModel):
    """일별 가격데이터 — `daily_security_price_data`. **전략을 짜기 위한 시점 스냅샷.**

    매수매도전략(`trading_strategies`)이 이 행을 가리키므로, '어느 시점의 가격을 보고
    세운 전략인가' 가 남는 구조다. 그래서 값은 한 번 뜨면 고정이다 — 수집이 무엇을
    갱신하든 이 행은 따라 움직이지 않는다.

    기준 일자는 자유다. 한 달 전일 수도, 어제일 수도, 오늘일 수도 있다.

        과거 일자   그날 일봉의 고가·저가·종가
        당일        장 시작부터 기준 시각까지의 분봉 집계 (고가=최댓값, 저가=최솟값)

    ## `current_price` 는 `securities.current_price` 와 다르다

    같은 이름이지만 뜻이 다르니 주의한다.

        securities.current_price               지금 이 종목의 시세. 수집기가 5분마다 덮어쓴다.
        daily_security_price_data.current_price 스냅샷을 뜬 그 시점의 가격. 다시 바뀌지 않는다.

    (이 컬럼은 원래 `quote_price`(호가) 였다. 호가가 아니라 현재가를 담으려던 자리라
    이름을 바로잡았다 — 컬럼 이름과 값의 뜻이 어긋나면 나중에 읽는 사람이 틀린 판단을 한다.)
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
    current_price = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True, db_comment="현재가"
    )

    class Meta:
        db_table = table("daily_security_price_data")
        verbose_name = "일별 가격데이터"
        verbose_name_plural = "일별 가격데이터"
        indexes = [models.Index(fields=["security", "-price_at"], name="price_sec_at_idx")]

    def __str__(self):
        return f"일가격#{self.id}"

    # ── 변동률 ──────────────────────────────────────
    # 전략이 쓰는 것은 가격 자체가 아니라 **현재가 대비 몇 %까지 벌어졌는가** 다.
    # 고 240만 / 저 160만 / 현재 200만 이면 +20% ~ -20% 이고, 이 비율은 가격이
    # 100만이 되어도 그대로 쓸 수 있다(120만 ~ 80만). 절대 가격은 시간이 지나면
    # 쓸모가 없어지지만 변동폭 비율은 남는다.
    #
    # 컬럼으로 저장하지 않는다. high/low/current 에서 언제든 나오는 파생값이고,
    # 스냅샷이라 원본이 바뀌지도 않아 값이 어긋날 여지가 없다.

    def _rate(self, price):
        if price is None or not self.current_price:
            return None
        return ((price - self.current_price) / self.current_price * 100).quantize(_TWO_PLACES)

    @property
    def high_rate(self):
        """현재가 대비 고가 변동률(%). 고 240만 / 현재 200만 → 20.00"""
        return self._rate(self.high_price)

    @property
    def low_rate(self):
        """현재가 대비 저가 변동률(%). 저 160만 / 현재 200만 → -20.00"""
        return self._rate(self.low_price)

    @property
    def band_width(self):
        """고가~저가 전체 폭이 현재가의 몇 %인가. 위 예에서 40.00"""
        high, low = self.high_rate, self.low_rate
        if high is None or low is None:
            return None
        return high - low

    def project(self, base_price):
        """이 변동폭을 다른 기준가에 적용하면 얼마가 되는가.

        1년 뒤 주가가 100만이 됐을 때 같은 폭으로 움직인다면 120만~80만이다.
        전략의 n차 분할(`trading_strategy_methods.price_ratio`) 을 어디에 걸지
        정할 때 이 밴드가 기준이 된다.
        """
        if base_price is None:
            return {"high": None, "low": None}
        high, low = self.high_rate, self.low_rate
        return {
            "high": (base_price * (100 + high) / 100).quantize(_TWO_PLACES)
            if high is not None
            else None,
            "low": (base_price * (100 + low) / 100).quantize(_TWO_PLACES)
            if low is not None
            else None,
        }
