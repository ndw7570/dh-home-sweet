from core.constants.filters import SECURITY_PRICE_DATA_FILTER_FIELDS
from core.views.common import BaseCommonViewSet
from trading_discipline.models import SecurityPriceData
from trading_discipline.serializers.portfolio import (
    SecurityPriceDataDetailSelectSerializer,
    SecurityPriceDataListSerializer,
)


class SecurityPriceDataViewSet(BaseCommonViewSet):
    """가격데이터 CRUD. 전략이 이 행을 가리키므로 함부로 지우면 전략의 근거가 사라진다."""

    queryset = SecurityPriceData.objects.all()
    FILTER_FIELDS = SECURITY_PRICE_DATA_FILTER_FIELDS
    list_serializer_class = SecurityPriceDataListSerializer
    detail_serializer_class = SecurityPriceDataDetailSelectSerializer
    select_list = ("security",)
    select_detail = ("security",)
    default_ordering = ("-price_at",)
