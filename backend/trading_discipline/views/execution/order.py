from core.constants.filters import ORDER_FILTER_FIELDS
from core.views.common import BaseCommonViewSet
from trading_discipline.models import Order
from trading_discipline.serializers.execution import (
    OrderDetailSelectSerializer,
    OrderListSerializer,
)


class OrderViewSet(BaseCommonViewSet):
    """이행 CRUD.

    `?action_type_in=PLAN,ORDER,FILL` 로 한 종목의 '하기로 함 → 냄 → 체결됨' 을
    한 번에 뽑아 이행 화면의 타임라인을 만든다.
    """

    queryset = Order.objects.all()
    FILTER_FIELDS = ORDER_FILTER_FIELDS
    list_serializer_class = OrderListSerializer
    detail_serializer_class = OrderDetailSelectSerializer
    select_list = ("security",)
    select_detail = ("security",)
    # 원칙 점검을 함께 내보낸다. prefetch 없이 두면 이행 수만큼 쿼리가 나간다.
    prefetch_list = ("principle_checks__principle",)
    prefetch_detail = ("principle_checks__principle",)
    default_ordering = ("-executed_at", "-id")
