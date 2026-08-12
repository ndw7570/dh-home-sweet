from django.db import models

from core.db import table
from core.models.common import BaseDomainModel


class AffectedSecurity(BaseDomainModel):
    """영향종목 — `affected_securities`. 뉴스 ↔ 종목 의 N:M 연결.

    부모가 시장방향에서 **뉴스**로 바뀌었다 (시장방향 → 뉴스 → 종목).
    시장방향에 종목을 바로 걸면 "어느 기사를 보고 이 종목을 떠올렸나" 가 남지
    않는다. 이제 종목은 언제나 특정 뉴스를 거쳐서만 시장방향에 닿는다.

    ⚠ DDL 과 어긋나는 점 — ERD 쪽도 같이 고쳐야 한다.
      1. DDL 은 뉴스 FK 의 컬럼명을 `id` 로 잡았다(PK 는 `affected_security_id`).
         따르지 않고 `news_id` 로 둔다. 한 테이블에서 `id` 가 기본키가 아닌 순간
         raw SQL·조인·덤프를 읽는 사람이 전부 한 번씩 틀린다. 이름 하나 아끼자고
         만들 위험이 아니다.
      2. `security_id` 에 FK 제약이 없다. 용도가 명백해서 모델에서는 FK 로 걸었다.
    """

    affected_security_id = models.AutoField(primary_key=True, db_comment="영향받는종목ID")
    news = models.ForeignKey(
        "trading_discipline.News",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        db_column="news_id",  # DDL 의 `id` 를 따르지 않는다 — 위 1번 참조.
        related_name="affected_securities",
        db_comment="뉴스ID",
    )
    security = models.ForeignKey(
        "trading_discipline.Security",
        on_delete=models.CASCADE,
        db_column="security_id",
        related_name="news_mentions",
        db_comment="종목ID",
    )

    class Meta:
        db_table = table("affected_securities")
        verbose_name = "영향종목"
        verbose_name_plural = "영향종목"
        constraints = [
            models.UniqueConstraint(
                fields=["news", "security"],
                condition=models.Q(is_deleted=False),
                name="affected_security_unique_alive",
            )
        ]
        indexes = [
            models.Index(fields=["security"], name="affected_sec_idx"),
        ]

    def __str__(self):
        return f"영향#{self.affected_security_id}"

    @property
    def market_direction(self):
        """종목이 어느 시장방향에 닿는지 — 뉴스를 거쳐 올라간다."""
        return self.news.market_direction if self.news_id else None
