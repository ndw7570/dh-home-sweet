from core.serializers.soft_exclusion import SoftDeleteSerializer
from asset_planning.models.portfolio.transaction import Transaction
from asset_planning.models.portfolio.account import Account
from asset_planning.models.portfolio.holding import Holding
from asset_planning.models.journal.journal_entry import JournalEntry


class AccountParentSerializer(SoftDeleteSerializer):
    class Meta:
        model = Account
        fields = "__all__"


class HoldingParentSerializer(SoftDeleteSerializer):
    class Meta:
        model = Holding
        fields = "__all__"


class JournalEntryParentSerializer(SoftDeleteSerializer):
    class Meta:
        model = JournalEntry
        fields = "__all__"


class TransactionListSerializer(SoftDeleteSerializer):
    class Meta:
        model = Transaction
        fields = "__all__"


class TransactionParentSerializer(SoftDeleteSerializer):
    class Meta:
        model = Transaction
        fields = "__all__"


class TransactionDetailSelectSerializer(SoftDeleteSerializer):
    account_detail = AccountParentSerializer(read_only=True, source="account")
    holding_detail = HoldingParentSerializer(read_only=True, source="holding")
    journal_entry_detail = JournalEntryParentSerializer(read_only=True, source="journal_entry")

    class Meta:
        model = Transaction
        fields = "__all__"
