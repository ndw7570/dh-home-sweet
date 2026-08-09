from django.db import models

from core.db import table
from core.models.common import BaseDomainModel


class AffectedSecurity(BaseDomainModel):
    """영향종목 — `affected_securities`. 시장방향 ↔ 종목 의 N:M 연결.

    ⚠ DDL 과 다른 점 두 가지.
      1. 이 테이블에는 기본키가 선언돼 있지 않다. Django 는 PK 없는 모델을 못 만들어서
         `id` AutoField 를 추가했다. DDL 쪽에도 PK 를 넣어 주는 편이 좋다.
         (market_directions_id + affected_security_id 복합키로 잡아도 된다)
      2. `affected_security_id` 에 FK 제약이 없다. 용도가 명백해서 모델에서는 FK 로 걸었다.
    """

    id = models.AutoField(primary_key=True, db_comment="영향종목ID (DDL 에 없어 추가)")
    market_direction = models.ForeignKey(
        "trading_discipline.MarketDirection",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        db_column="market_directions_id",
        related_name="affected_securities",
        db_comment="시장방향ID",
    )
    affected_security = models.ForeignKey(
        "trading_discipline.Security",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        db_column="affected_security_id",
        related_name="market_directions",
        db_comment="영향받는종목ID",
    )

    class Meta:
        db_table = table("affected_securities")
        verbose_name = "영향종목"
        verbose_name_plural = "영향종목"
        constraints = [
            models.UniqueConstraint(
                fields=["market_direction", "affected_security"],
                condition=models.Q(is_deleted=False),
                name="affected_security_unique_alive",
            )
        ]

    def __str__(self):
        return f"영향#{self.id}"
