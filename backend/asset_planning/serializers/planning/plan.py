from core.serializers.soft_exclusion import SoftDeleteSerializer
from asset_planning.models.planning.plan import Plan


class PlanListSerializer(SoftDeleteSerializer):
    class Meta:
        model = Plan
        fields = "__all__"


class PlanParentSerializer(SoftDeleteSerializer):
    class Meta:
        model = Plan
        fields = "__all__"


class PlanDetailSelectSerializer(SoftDeleteSerializer):
    class Meta:
        model = Plan
        fields = "__all__"
