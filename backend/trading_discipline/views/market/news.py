from core.constants.filters import NEWS_FILTER_FIELDS
from core.views.common import BaseCommonViewSet
from trading_discipline.models import News
from trading_discipline.serializers.market import (
    NewsDetailSelectSerializer,
    NewsListSerializer,
)


class NewsViewSet(BaseCommonViewSet):
    """뉴스 CRUD — 시장방향과 종목 사이의 한 단."""

    queryset = News.objects.all()
    FILTER_FIELDS = NEWS_FILTER_FIELDS
    list_serializer_class = NewsListSerializer
    detail_serializer_class = NewsDetailSelectSerializer
    select_list = ("market_direction",)
    select_detail = ("market_direction",)
    prefetch_list = ("affected_securities",)
    prefetch_detail = ("affected_securities__security",)
    default_ordering = ("-created_at", "-id")
