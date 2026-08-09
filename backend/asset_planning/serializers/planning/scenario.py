from core.serializers.soft_exclusion import SoftDeleteSerializer
from asset_planning.models.planning.scenario import Scenario
from asset_planning.models.planning.plan import Plan


class PlanParentSerializer(SoftDeleteSerializer):
    class Meta:
        model = Plan
        fields = "__all__"


class ScenarioListSerializer(SoftDeleteSerializer):
    class Meta:
        model = Scenario
        fields = "__all__"


class ScenarioParentSerializer(SoftDeleteSerializer):
    class Meta:
        model = Scenario
        fields = "__all__"


class ScenarioDetailSelectSerializer(SoftDeleteSerializer):
    plan_detail = PlanParentSerializer(read_only=True, source="plan")

    class Meta:
        model = Scenario
        fields = "__all__"
