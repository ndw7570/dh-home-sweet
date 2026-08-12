from datetime import date

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
    # ⚠ DDL 의 컬럼 코멘트는 '소스' 지만 따르지 않는다. 컬럼명도 타입도
    # (direction VARCHAR(20)) market_directions.direction 과 같고, 이 테이블의 나머지
    # 컬럼도 전부 시장방향에서 복사돼 왔다. 코멘트만 손대다 만 자리로 본다.
    # 방향(MarketTrend) 으로 다룬다 — ERD 코멘트도 '방향' 으로 고쳐야 한다.
    # 소스(유튜브/책/뉴스)는 principle_sources 가 이미 맡고 있어 여기 겹칠 이유가 없다.
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

    # 기사가 난 날과 그 영향이 실제로 먹히는 구간은 다르다. 금리 결정은 몇 달을 끌고,
    # 실적 서프라이즈는 며칠이면 소화된다. 그 **추측**을 미리 적어 두면, 나중에
    # "이 영향이 이만큼 갈 거라고 봤는데 실제로는 어땠나" 를 대조할 수 있다.
    # 어디까지나 예측이라 비워 둘 수 있게 null 을 허용한다 — 모르면서 아는 척
    # 날짜를 채워 넣는 것이 빈칸보다 나쁘다.
    expected_impact_from = models.DateField(
        null=True, blank=True, db_comment="예상영향시작일"
    )
    expected_impact_until = models.DateField(
        null=True, blank=True, db_comment="예상영향종료일"
    )

    class Meta:
        db_table = table("news")
        verbose_name = "뉴스"
        verbose_name_plural = "뉴스"
        indexes = [
            models.Index(fields=["market_direction"], name="news_mdir_idx"),
            models.Index(fields=["factor_type", "direction"], name="news_factor_dir_idx"),
            models.Index(
                fields=["expected_impact_from", "expected_impact_until"],
                name="news_impact_idx",
            ),
        ]

    def __str__(self):
        head = (self.content or "").strip().splitlines()[0] if self.content else ""
        return head[:40] or f"뉴스#{self.id}"

    def is_impact_active_on(self, on: date | None = None) -> bool:
        """그날이 예상 영향 구간 안인가. 구간을 안 적었으면 판정하지 않는다(False)."""
        on = on or date.today()
        if not self.expected_impact_from or not self.expected_impact_until:
            return False
        return self.expected_impact_from <= on <= self.expected_impact_until

    @property
    def is_impact_current(self) -> bool:
        return self.is_impact_active_on()

    @property
    def impact_period_label(self) -> str:
        """화면이 그대로 찍는 문자열. 안 적은 것과 하루짜리를 눈으로 구분되게 둔다."""
        start, end = self.expected_impact_from, self.expected_impact_until
        if not start and not end:
            return "영향 기간 미정"
        if start and end:
            if start == end:
                return f"{start:%Y.%m.%d} 하루"
            return f"{start:%Y.%m.%d} ~ {end:%Y.%m.%d}"
        if start:
            return f"{start:%Y.%m.%d} ~ (종료 미정)"
        return f"(시작 미정) ~ {end:%Y.%m.%d}"

    @property
    def expected_impact_days(self) -> int | None:
        """예상 영향 일수(양끝 포함). 한쪽이라도 비면 None."""
        if not self.expected_impact_from or not self.expected_impact_until:
            return None
        return (self.expected_impact_until - self.expected_impact_from).days + 1
