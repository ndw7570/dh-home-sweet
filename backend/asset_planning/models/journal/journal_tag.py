from django.conf import settings
from django.db import models

from core.models.common import SoftDeleteModel


class JournalTag(SoftDeleteModel):
    """근거 태그 — 일지를 나중에 집계 가능하게 만드는 유일한 장치."""

    tag_id = models.AutoField(primary_key=True, db_comment="태그ID")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column="user_id",
        related_name="journal_tags",
        db_comment="유저ID",
    )
    name = models.CharField(max_length=50, null=True, blank=True, db_comment="태그명")
    category = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        db_comment="분류 (VALUATION/MOMENTUM/MACRO/NEWS/PLAN/EMOTION)",
    )
    color = models.CharField(max_length=20, null=True, blank=True, db_comment="표시 색상 키")
    sort_order = models.IntegerField(null=True, blank=True, db_comment="노출순서")

    # DDL 확정 후 추가 컬럼은 이 아래에 붙인다.

    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True, db_comment="생성일")
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True, db_comment="수정일")
    remarks = models.TextField(null=True, blank=True, db_comment="비고")

    class Meta:
        db_table = '"planner"."journal_tag"'
        indexes = [models.Index(fields=["user"], name="tag_user_idx")]

    def __str__(self):
        return self.name or f"Tag#{self.tag_id}"
