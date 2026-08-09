from core.serializers.soft_exclusion import SoftDeleteSerializer
from asset_planning.models.portfolio.account import Account


class AccountListSerializer(SoftDeleteSerializer):
    class Meta:
        model = Account
        fields = "__all__"


class AccountParentSerializer(SoftDeleteSerializer):
    class Meta:
        model = Account
        fields = "__all__"


class AccountDetailSelectSerializer(SoftDeleteSerializer):
    class Meta:
        model = Account
        fields = "__all__"
