from core.serializers.soft_exclusion import SoftDeleteSerializer
from asset_planning.models.journal.review import Review
from asset_planning.models.planning.plan import Plan


class PlanParentSerializer(SoftDeleteSerializer):
    class Meta:
        model = Plan
        fields = "__all__"


class ReviewListSerializer(SoftDeleteSerializer):
    class Meta:
        model = Review
        fields = "__all__"


class ReviewParentSerializer(SoftDeleteSerializer):
    class Meta:
        model = Review
        fields = "__all__"


class ReviewDetailSelectSerializer(SoftDeleteSerializer):
    plan_detail = PlanParentSerializer(read_only=True, source="plan")

    class Meta:
        model = Review
        fields = "__all__"
