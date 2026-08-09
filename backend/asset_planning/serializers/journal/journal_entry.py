from core.serializers.soft_exclusion import SoftDeleteSerializer

from asset_planning.models.journal.journal_entry import JournalEntry
from asset_planning.models.journal.journal_tag import JournalTag


class JournalTagParentSerializer(SoftDeleteSerializer):
    class Meta:
        model = JournalTag
        fields = "__all__"


class JournalEntryListSerializer(SoftDeleteSerializer):
    """목록은 태그 id만 — 피드 렌더링에 필요한 최소 페이로드."""

    class Meta:
        model = JournalEntry
        fields = "__all__"


class JournalEntryParentSerializer(SoftDeleteSerializer):
    class Meta:
        model = JournalEntry
        fields = "__all__"


class JournalEntryDetailSelectSerializer(SoftDeleteSerializer):
    tag_detail = JournalTagParentSerializer(many=True, read_only=True, source="tags")

    class Meta:
        model = JournalEntry
        fields = "__all__"
