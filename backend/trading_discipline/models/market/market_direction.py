from django.db import models

from core.db import table
from core.models.common import BaseDomainModel
from trading_discipline.constants.choices import FactorType, MarketTrend


class MarketDirection(BaseDomainModel):
    """시장방향 — `market_directions`.

    "금리가 이래서 시장을 이렇게 본다" 를 한 행으로 남긴다.
    `factor_value` 에 수치(금리 %, 환율 등)를 같이 적어 두면, 나중에 그 수치가
    실제로 어떻게 움직였는지와 대조할 수 있다. 근거 없는 방향 전환을 막는 장치다.

    영향받는 종목은 두 갈래로 적을 수 있다.
      - `affected_targets` (JSONB)  : 종목이 아닌 대상까지 자유롭게 (섹터·지수·통화 등)
      - `affected_securities` (테이블): 실제 종목 행으로 정확히
    화면은 후자를 우선 쓰고, 전자는 보조로 보여 준다.
    """

    id = models.AutoField(primary_key=True, db_comment="id")
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
        db_table = table("market_directions")
        verbose_name = "시장방향"
        verbose_name_plural = "시장방향"
        indexes = [
            models.Index(fields=["factor_type", "direction"], name="mdir_factor_dir_idx"),
        ]

    def __str__(self):
        return f"{self.get_factor_type_display() or '요인'} → {self.get_direction_display() or '?'}"
