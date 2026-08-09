from core.serializers.soft_exclusion import SoftDeleteSerializer
from asset_planning.models.journal.journal_tag import JournalTag


class JournalTagListSerializer(SoftDeleteSerializer):
    class Meta:
        model = JournalTag
        fields = "__all__"


class JournalTagParentSerializer(SoftDeleteSerializer):
    class Meta:
        model = JournalTag
        fields = "__all__"


class JournalTagDetailSelectSerializer(SoftDeleteSerializer):
    class Meta:
        model = JournalTag
        fields = "__all__"
