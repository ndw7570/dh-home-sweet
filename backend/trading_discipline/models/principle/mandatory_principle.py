from django.db import models

from core.db import table
from core.models.common import BaseDomainModel


class MandatoryPrinciple(BaseDomainModel):
    """나의필수원칙 — `mandatory_principles`.

    남의 원칙(`investment_principles`)과 갈라 놓은 이유가 있다. 이건 협상 대상이 아니다.
    `priority` 가 낮을수록 먼저 읽힌다. 홈 화면 맨 위에 이게 걸리는 이유이기도 하다.
    """

    id = models.AutoField(primary_key=True, db_comment="id")
    priority = models.IntegerField(null=True, blank=True, db_comment="중요순위")
    content = models.TextField(null=True, blank=True, db_comment="내용")

    class Meta:
        db_table = table("mandatory_principles")
        verbose_name = "나의필수원칙"
        verbose_name_plural = "나의필수원칙"
        ordering = ("priority", "id")

    def __str__(self):
        head = (self.content or "").strip().splitlines()[0] if self.content else ""
        return head[:40] or f"필수원칙#{self.id}"
