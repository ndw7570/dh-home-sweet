from core.views.common import BaseCommonViewSet

from asset_planning.models.planning.projection_snapshot import ProjectionSnapshot
from asset_planning.serializers.planning.projection_snapshot import (
    ProjectionSnapshotDetailSelectSerializer,
    ProjectionSnapshotListSerializer,
)

try:
    from core.constants.filters import PROJECTION_SNAPSHOT_FILTER_FIELDS
except ImportError:  # pragma: no cover
    PROJECTION_SNAPSHOT_FILTER_FIELDS = {}


class ProjectionSnapshotViewSet(BaseCommonViewSet):
    """예상 스냅샷 조회. 원칙적으로 append-only — update/destroy 는 열어 두되 화면에서는 쓰지 않는다.

    - GET    /projection-snapshot/          목록
    - GET    /projection-snapshot/{id}/     단건
    - POST   /projection-snapshot/          생성
    - PATCH  /projection-snapshot/{id}/     부분수정
    - DELETE /projection-snapshot/{id}/     소프트삭제
    - PATCH  /projection-snapshot/{id}/restore/  복구
    """

    queryset = ProjectionSnapshot.objects.all()
    FILTER_FIELDS = PROJECTION_SNAPSHOT_FILTER_FIELDS
    list_serializer_class = ProjectionSnapshotListSerializer
    detail_serializer_class = ProjectionSnapshotDetailSelectSerializer
    select_detail = ('scenario',)
    default_ordering = ('target_date',)
