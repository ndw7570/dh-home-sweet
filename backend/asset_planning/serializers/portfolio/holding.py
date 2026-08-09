from core.serializers.soft_exclusion import SoftDeleteSerializer
from asset_planning.models.portfolio.holding import Holding
from asset_planning.models.portfolio.account import Account


class AccountParentSerializer(SoftDeleteSerializer):
    class Meta:
        model = Account
        fields = "__all__"


class HoldingListSerializer(SoftDeleteSerializer):
    class Meta:
        model = Holding
        fields = "__all__"


class HoldingParentSerializer(SoftDeleteSerializer):
    class Meta:
        model = Holding
        fields = "__all__"


class HoldingDetailSelectSerializer(SoftDeleteSerializer):
    account_detail = AccountParentSerializer(read_only=True, source="account")

    class Meta:
        model = Holding
        fields = "__all__"
