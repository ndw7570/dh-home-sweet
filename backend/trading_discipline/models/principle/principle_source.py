from django.db import models

from core.db import table
from core.models.common import BaseDomainModel
from trading_discipline.constants.choices import SourceType


class PrincipleSource(BaseDomainModel):
    """투자원칙소스 — `principle_sources`. 원칙을 어디서 가져왔는가(책·영상·리포트)."""

    id = models.AutoField(primary_key=True, db_comment="원칙소스ID")
    name = models.CharField(max_length=200, null=True, blank=True, db_comment="소스명")
    source_type = models.CharField(
        max_length=20, choices=SourceType.choices, null=True, blank=True, db_comment="소스유형"
    )
    url = models.TextField(null=True, blank=True, db_comment="소스URL")
    content = models.TextField(null=True, blank=True, db_comment="내용")

    class Meta:
        db_table = table("principle_sources")
        verbose_name = "투자원칙소스"
        verbose_name_plural = "투자원칙소스"

    def __str__(self):
        return self.name or f"소스#{self.id}"
