from django.db import models

from core.db import table
from core.models.common import BaseDomainModel


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
