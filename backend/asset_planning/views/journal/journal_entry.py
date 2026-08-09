from core.views.common import BaseCommonViewSet

from asset_planning.models.journal.journal_entry import JournalEntry
from asset_planning.serializers.journal.journal_entry import (
    JournalEntryDetailSelectSerializer,
    JournalEntryListSerializer,
)

try:
    from core.constants.filters import JOURNAL_ENTRY_FILTER_FIELDS
except ImportError:  # pragma: no cover
    JOURNAL_ENTRY_FILTER_FIELDS = {}


class JournalEntryViewSet(BaseCommonViewSet):
    """일지 CRUD.

    - GET    /journal-entry/          목록
    - GET    /journal-entry/{id}/     단건
    - POST   /journal-entry/          생성
    - PATCH  /journal-entry/{id}/     부분수정
    - DELETE /journal-entry/{id}/     소프트삭제
    - PATCH  /journal-entry/{id}/restore/  복구
    """

    queryset = JournalEntry.objects.all()
    FILTER_FIELDS = JOURNAL_ENTRY_FILTER_FIELDS
    list_serializer_class = JournalEntryListSerializer
    detail_serializer_class = JournalEntryDetailSelectSerializer
    prefetch_detail = ('tags',)
    default_ordering = ('-entry_date', '-entry_id')
