from django.conf import settings
from django.db import models

from core.models.common import SoftDeleteModel

from .journal_tag import JournalTag


class JournalEntry(SoftDeleteModel):
    """
    일지 — "왜 그렇게 했는가"를 남기는 곳.

    content(자유서술)만으로는 회고를 만들 수 없어서
    decision_type / conviction_level / 태그를 필수 구조 필드로 둔다.
    """

    entry_id = models.AutoField(primary_key=True, db_comment="일지ID")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column="user_id",
        related_name="journal_entries",
        db_comment="유저ID",
    )
    entry_date = models.DateField(null=True, blank=True, db_comment="기록 대상일")
    title = models.CharField(max_length=200, null=True, blank=True, db_comment="한 줄 요약")
    decision_type = models.CharField(
        max_length=20,
        null=True,
        blank=True,
        db_comment="판단유형 (BUY/SELL/HOLD/REBALANCE/CASH)",
    )
    symbol = models.CharField(max_length=40, null=True, blank=True, db_comment="대상 종목코드")
    content = models.TextField(null=True, blank=True, db_comment="판단 근거 본문")
    conviction_level = models.IntegerField(null=True, blank=True, db_comment="확신도 1~5")
    expected_outcome = models.TextField(null=True, blank=True, db_comment="기대했던 결과")
    tags = models.ManyToManyField(
        JournalTag,
        through="asset_planning.JournalEntryTag",
        related_name="entries",
        blank=True,
    )
    is_reviewed = models.BooleanField(default=False, db_comment="회고 반영 여부")

    # DDL 확정 후 추가 컬럼은 이 아래에 붙인다.

    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True, db_comment="생성일")
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True, db_comment="수정일")
    remarks = models.TextField(null=True, blank=True, db_comment="비고")

    class Meta:
        db_table = '"planner"."journal_entry"'
        indexes = [
            models.Index(fields=["user", "entry_date"], name="entry_user_date_idx"),
            models.Index(fields=["decision_type"], name="entry_decision_idx"),
        ]

    def __str__(self):
        return self.title or f"Entry#{self.entry_id}"


class JournalEntryTag(SoftDeleteModel):
    """일지 ↔ 태그 연결 (through). 소프트딜리트 정책을 태그 연결에도 그대로 적용."""

    entry_tag_id = models.AutoField(primary_key=True, db_comment="연결ID")
    entry = models.ForeignKey(
        JournalEntry,
        on_delete=models.CASCADE,
        db_column="entry_id",
        related_name="entry_tags",
        db_comment="일지ID",
    )
    tag = models.ForeignKey(
        JournalTag,
        on_delete=models.CASCADE,
        db_column="tag_id",
        related_name="entry_tags",
        db_comment="태그ID",
    )
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True, db_comment="생성일")

    class Meta:
        db_table = '"planner"."journal_entry_tag"'
        constraints = [
            models.UniqueConstraint(
                fields=["entry", "tag"],
                condition=models.Q(is_deleted=False),
                name="uniq_active_entry_tag",
            ),
        ]

    def __str__(self):
        return f"{self.entry_id}-{self.tag_id}"
