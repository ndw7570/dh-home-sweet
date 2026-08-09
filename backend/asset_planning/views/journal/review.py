from core.views.common import BaseCommonViewSet

from asset_planning.models.journal.review import Review
from asset_planning.serializers.journal.review import (
    ReviewDetailSelectSerializer,
    ReviewListSerializer,
)

try:
    from core.constants.filters import REVIEW_FILTER_FIELDS
except ImportError:  # pragma: no cover
    REVIEW_FILTER_FIELDS = {}


class ReviewViewSet(BaseCommonViewSet):
    """회고 CRUD. 생성은 배치가, 원인/조정 작성은 사용자가 한다.

    - GET    /review/          목록
    - GET    /review/{id}/     단건
    - POST   /review/          생성
    - PATCH  /review/{id}/     부분수정
    - DELETE /review/{id}/     소프트삭제
    - PATCH  /review/{id}/restore/  복구
    """

    queryset = Review.objects.all()
    FILTER_FIELDS = REVIEW_FILTER_FIELDS
    list_serializer_class = ReviewListSerializer
    detail_serializer_class = ReviewDetailSelectSerializer
    select_detail = ('plan',)
    default_ordering = ('-period_end',)
