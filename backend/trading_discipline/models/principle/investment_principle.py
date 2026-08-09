from django.db import models

from core.db import table
from core.models.common import BaseDomainModel
from trading_discipline.constants.choices import PrincipleType


class InvestmentPrinciple(BaseDomainModel):
    """투자원칙 — `investment_principles`. 대가에게서 가져온 원칙.

    `cautions`(주의사항)가 따로 있는 게 이 테이블의 핵심이다.
    원칙은 늘 조건부라서, 어떤 상황에서 이 원칙이 오히려 해가 되는지를
    같은 행에 적어 두지 않으면 나중에 그대로 갖다 쓰다 다친다.
    """

    id = models.AutoField(primary_key=True, db_comment="투자원칙ID")
    source = models.ForeignKey(
        "trading_discipline.PrincipleSource",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column="source_id",
        related_name="principles",
        db_comment="원칙소스ID",
    )
    teacher_name = models.CharField(
        max_length=200, null=True, blank=True, db_comment="원칙가르치는사람"
    )
    principle_type = models.CharField(
        max_length=20, choices=PrincipleType.choices, null=True, blank=True, db_comment="원칙종류"
    )
    content = models.TextField(null=True, blank=True, db_comment="내용")
    rationale = models.TextField(null=True, blank=True, db_comment="투자근거")
    cautions = models.TextField(null=True, blank=True, db_comment="주의사항")

    class Meta:
        db_table = table("investment_principles")
        verbose_name = "투자원칙"
        verbose_name_plural = "투자원칙"
        indexes = [models.Index(fields=["principle_type"], name="principle_type_idx")]

    def __str__(self):
        head = (self.content or "").strip().splitlines()[0] if self.content else ""
        return f"{self.teacher_name or '?'} — {head[:30]}" if head else f"원칙#{self.id}"
