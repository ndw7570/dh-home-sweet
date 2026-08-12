from django.db import models

from core.db import table
from core.models.common import BaseDomainModel
from trading_discipline.constants.choices import FactorType, MarketTrend


class News(BaseDomainModel):
    """뉴스 — `news`. 시장방향 아래에 매달리는 개별 기사·사건.

    계층이 한 단 늘었다: **시장방향 → 뉴스 → 종목**.

    시장방향은 "금리 때문에 시장을 이렇게 본다" 같은 **판단**이고, 뉴스는 그
    판단을 떠받치는 **개별 사실**이다. 예전에는 시장방향에 종목을 바로 걸었는데,
    그러면 "어느 기사를 보고 이 종목을 떠올렸나" 가 기록에서 사라진다. 판단이
    틀렸을 때 판단 자체가 틀렸는지 근거로 삼은 사실이 틀렸는지 갈라 볼 수 없다.

    컬럼 집합이 `market_directions` 와 같은 것은 의도된 것이다 — 같은 축
    (방향·요인·수치·영향대상)으로 적어야 상위 판단과 하위 사실을 나란히 놓고
    어긋난 자리를 찾을 수 있다.
    """

    id = models.AutoField(primary_key=True, db_comment="뉴스ID")
    market_direction = models.ForeignKey(
        "trading_discipline.MarketDirection",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        db_column="market_directions_id",
        related_name="news_items",
        db_comment="시장방향ID",
    )
    # DDL 의 컬럼 코멘트는 '소스' 지만 컬럼명·타입(direction VARCHAR(20)) 은
    # market_directions.direction 과 같다. 코멘트 쪽이 복사 과정에서 남은 것으로 보고
    # 방향(MarketTrend) 으로 다룬다. ERD 코멘트를 '방향' 으로 고쳐 두는 편이 좋다.
    direction = models.CharField(
        max_length=20, choices=MarketTrend.choices, null=True, blank=True, db_comment="방향"
    )
    factor_type = models.CharField(
        max_length=20, choices=FactorType.choices, null=True, blank=True, db_comment="요인종류"
    )
    content = models.TextField(null=True, blank=True, db_comment="내용")
    rationale = models.TextField(null=True, blank=True, db_comment="투자근거")
    factor_value = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True, db_comment="수치"
    )
    affected_targets = models.JSONField(null=True, blank=True, db_comment="영향대상")

    class Meta:
        db_table = table("news")
        verbose_name = "뉴스"
        verbose_name_plural = "뉴스"
        indexes = [
            models.Index(fields=["market_direction"], name="news_mdir_idx"),
            models.Index(fields=["factor_type", "direction"], name="news_factor_dir_idx"),
        ]

    def __str__(self):
        head = (self.content or "").strip().splitlines()[0] if self.content else ""
        return head[:40] or f"뉴스#{self.id}"
