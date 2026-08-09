from core.views.common import BaseCommonViewSet

from asset_planning.models.portfolio.asset_snapshot import AssetSnapshot
from asset_planning.serializers.portfolio.asset_snapshot import (
    AssetSnapshotDetailSelectSerializer,
    AssetSnapshotListSerializer,
)

try:
    from core.constants.filters import ASSET_SNAPSHOT_FILTER_FIELDS
except ImportError:  # pragma: no cover
    ASSET_SNAPSHOT_FILTER_FIELDS = {}


class AssetSnapshotViewSet(BaseCommonViewSet):
    """자산 스냅샷 CRUD. 타임라인 좌측(실적선)의 원천.

    - GET    /asset-snapshot/          목록
    - GET    /asset-snapshot/{id}/     단건
    - POST   /asset-snapshot/          생성
    - PATCH  /asset-snapshot/{id}/     부분수정
    - DELETE /asset-snapshot/{id}/     소프트삭제
    - PATCH  /asset-snapshot/{id}/restore/  복구
    """

    queryset = AssetSnapshot.objects.all()
    FILTER_FIELDS = ASSET_SNAPSHOT_FILTER_FIELDS
    list_serializer_class = AssetSnapshotListSerializer
    detail_serializer_class = AssetSnapshotDetailSelectSerializer
    default_ordering = ('snapshot_date',)
