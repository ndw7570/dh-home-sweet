from rest_framework import serializers

from trading_discipline.models import MarketDirection
from trading_discipline.serializers._base import DomainSerializer


class MarketDirectionListSerializer(DomainSerializer):
    news_count = serializers.SerializerMethodField()
    affected_count = serializers.SerializerMethodField()

    class Meta:
        model = MarketDirection
        fields = "__all__"

    def get_news_count(self, obj) -> int:
        return obj.news_items.filter(is_deleted=False).count()

    def get_affected_count(self, obj) -> int:
        """이 시장방향에 걸린 종목 수 — 뉴스를 거쳐 센다. 같은 종목이 여러 뉴스에
        걸려도 한 번만 센다(사람이 세는 방식과 맞춘다)."""
        ids = set()
        for news in obj.news_items.all():
            if news.is_deleted:
                continue
            for link in news.affected_securities.all():
                if not link.is_deleted and link.security_id:
                    ids.add(link.security_id)
        return len(ids)

    def validate(self, attrs):
        attrs = super().validate(attrs)
        rationale = attrs.get("rationale", getattr(self.instance, "rationale", None))
        if not (rationale or "").strip():
            raise serializers.ValidationError(
                {"rationale": "근거 없이 시장 방향만 바꿀 수 없다."}
            )
        return attrs


class MarketDirectionParentSerializer(DomainSerializer):
    class Meta:
        model = MarketDirection
        fields = ("id", "direction", "factor_type", "factor_value", "content")


class MarketDirectionDetailSelectSerializer(MarketDirectionListSerializer):
    news_items = serializers.SerializerMethodField()

    class Meta:
        model = MarketDirection
        fields = "__all__"

    def get_news_items(self, obj):
        """이 방향을 떠받치는 뉴스들, 각 뉴스에 걸린 종목까지 함께.

        화면이 시장방향 → 뉴스 → 종목 세 단을 한 번에 그리므로 여기서 통째로 내린다.
        뉴스마다 따로 조회하면 방향 하나에 N+1 이 난다.
        """
        from trading_discipline.serializers.portfolio.security import SecurityParentSerializer

        out = []
        for news in obj.news_items.all():
            if news.is_deleted:
                continue
            securities = [
                SecurityParentSerializer(link.security).data
                for link in news.affected_securities.all()
                if not link.is_deleted and link.security_id
            ]
            out.append(
                {
                    "id": news.id,
                    "direction": news.direction,
                    "direction_label": news.get_direction_display(),
                    "factor_type": news.factor_type,
                    "factor_type_label": news.get_factor_type_display(),
                    "factor_value": news.factor_value,
                    "content": news.content,
                    "rationale": news.rationale,
                    "affected_targets": news.affected_targets,
                    "created_at": news.created_at,
                    "affected_securities": securities,
                }
            )
        return out
