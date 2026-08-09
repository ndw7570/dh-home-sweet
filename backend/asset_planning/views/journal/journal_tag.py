from core.views.common import BaseCommonViewSet

from asset_planning.models.journal.journal_tag import JournalTag
from asset_planning.serializers.journal.journal_tag import (
    JournalTagDetailSelectSerializer,
    JournalTagListSerializer,
)

try:
    from core.constants.filters import JOURNAL_TAG_FILTER_FIELDS
except ImportError:  # pragma: no cover
    JOURNAL_TAG_FILTER_FIELDS = {}


class JournalTagViewSet(BaseCommonViewSet):
    """근거 태그 CRUD.

    - GET    /journal-tag/          목록
    - GET    /journal-tag/{id}/     단건
    - POST   /journal-tag/          생성
    - PATCH  /journal-tag/{id}/     부분수정
    - DELETE /journal-tag/{id}/     소프트삭제
    - PATCH  /journal-tag/{id}/restore/  복구
    """

    queryset = JournalTag.objects.all()
    FILTER_FIELDS = JOURNAL_TAG_FILTER_FIELDS
    list_serializer_class = JournalTagListSerializer
    detail_serializer_class = JournalTagDetailSelectSerializer
    default_ordering = ('sort_order', 'name')
