from core.serializers.soft_exclusion import SoftDeleteSerializer
from asset_planning.models.planning.projection_snapshot import ProjectionSnapshot
from asset_planning.models.planning.scenario import Scenario


class ScenarioParentSerializer(SoftDeleteSerializer):
    class Meta:
        model = Scenario
        fields = "__all__"


class ProjectionSnapshotListSerializer(SoftDeleteSerializer):
    class Meta:
        model = ProjectionSnapshot
        fields = "__all__"


class ProjectionSnapshotParentSerializer(SoftDeleteSerializer):
    class Meta:
        model = ProjectionSnapshot
        fields = "__all__"


class ProjectionSnapshotDetailSelectSerializer(SoftDeleteSerializer):
    scenario_detail = ScenarioParentSerializer(read_only=True, source="scenario")

    class Meta:
        model = ProjectionSnapshot
        fields = "__all__"
