from core.constants.filters import PERFORMANCE_RECORD_FILTER_FIELDS
from core.views.common import BaseCommonViewSet
from trading_discipline.models import PerformanceRecord
from trading_discipline.serializers.execution import (
    PerformanceRecordDetailSelectSerializer,
    PerformanceRecordListSerializer,
)


class PerformanceRecordViewSet(BaseCommonViewSet):
    """성과 CRUD. 비용 항목이 쪼개져 있어 수익률 하락의 원인을 갈라 볼 수 있다."""

    queryset = PerformanceRecord.objects.all()
    FILTER_FIELDS = PERFORMANCE_RECORD_FILTER_FIELDS
    list_serializer_class = PerformanceRecordListSerializer
    detail_serializer_class = PerformanceRecordDetailSelectSerializer
    select_list = ("security",)
    select_detail = ("security",)
    default_ordering = ("-period_end", "-id")
