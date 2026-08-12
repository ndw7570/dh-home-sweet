from datetime import date

from rest_framework import serializers

from trading_discipline.models import MarketDirection
from trading_discipline.serializers._base import DomainSerializer


class MarketDirectionListSerializer(DomainSerializer):
    """시장방향 — 아래 뉴스와 그 뉴스에 걸린 종목까지 **목록에서도** 통째로 내린다.

    화면(MarketPage)이 시장방향 → 뉴스 → 종목 세 단을 한 번에 그린다. 하위를 상세
    응답에만 담으면 목록 화면에서는 늘 비어 보이고, 사용자는 "저장이 안 됐다"고 읽는다.
    N+1 은 뷰의 prefetch 로 막는다(news_items__affected_securities__security).
    """

    news_count = serializers.SerializerMethodField()
    affected_count = serializers.SerializerMethodField()
    news_items = serializers.SerializerMethodField()

    class Meta:
        model = MarketDirection
        fields = "__all__"

    def get_news_count(self, obj) -> int:
        # .filter().count() 를 쓰면 시장방향 한 건마다 COUNT 쿼리가 따로 나간다
        # (prefetch 를 걸어 놔도 filter 는 새 쿼리다). 올라온 것을 그대로 센다.
        return sum(1 for n in obj.news_items.all() if not n.is_deleted)

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

    def get_news_items(self, obj):
        """이 방향을 떠받치는 뉴스들, 각 뉴스에 걸린 종목까지 함께.

        정렬은 파이썬에서 한다 — prefetch 로 이미 메모리에 올라온 것을 다시 order_by
        하면 쿼리가 새로 나가 prefetch 가 통째로 헛돈다.
        """
        from trading_discipline.serializers.portfolio.security import SecurityParentSerializer

        out = []
        items = sorted(
            obj.news_items.all(),
            key=lambda n: (n.created_at or date.min, n.id),
            reverse=True,
        )
        for news in items:
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
                    # 예상 영향 구간 — 화면이 기간으로 걸러 볼 수 있어야 해서 같이 내린다.
                    "expected_impact_from": news.expected_impact_from,
                    "expected_impact_until": news.expected_impact_until,
                    "impact_period_label": news.impact_period_label,
                    "expected_impact_days": news.expected_impact_days,
                    "is_impact_current": news.is_impact_current,
                    "affected_securities": securities,
                }
            )
        return out


class MarketDirectionParentSerializer(DomainSerializer):
    class Meta:
        model = MarketDirection
        fields = ("id", "direction", "factor_type", "factor_value", "content")


class MarketDirectionDetailSelectSerializer(MarketDirectionListSerializer):
    """상세도 목록과 같은 모양이다 — 목록이 이미 세 단을 다 담고 있다."""

    pass
