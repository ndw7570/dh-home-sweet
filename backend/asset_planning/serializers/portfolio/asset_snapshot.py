from core.serializers.soft_exclusion import SoftDeleteSerializer
from asset_planning.models.portfolio.asset_snapshot import AssetSnapshot


class AssetSnapshotListSerializer(SoftDeleteSerializer):
    class Meta:
        model = AssetSnapshot
        fields = "__all__"


class AssetSnapshotParentSerializer(SoftDeleteSerializer):
    class Meta:
        model = AssetSnapshot
        fields = "__all__"


class AssetSnapshotDetailSelectSerializer(SoftDeleteSerializer):
    class Meta:
        model = AssetSnapshot
        fields = "__all__"
