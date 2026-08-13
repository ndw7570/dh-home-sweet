from django.db.models import Case, F, IntegerField, Q, Sum, Value, When

from core.constants.filters import SECURITY_FILTER_FIELDS
from core.views.common import BaseCommonViewSet
from trading_discipline.constants.choices import ActionType, OrderSide
from trading_discipline.models import Security
from trading_discipline.serializers.portfolio import (
    SecurityDetailSelectSerializer,
    SecurityListSerializer,
)


def _fill_qty_annotation():
    """FILL 매수합 - 매도합. Security 인스턴스에 `_fill_qty` 로 붙여 N+1 을 막는다.

    `orders__is_deleted=False` 를 필터에 반드시 포함한다 — Django 는 관련 매니저의
    소프트딜리트 필터를 JOIN annotation 에는 자동 적용하지 않는다. 이걸 빼면 취소된
    체결까지 합계에 섞여, 보유수량이 늘 실제보다 부풀어 보인다.
    """
    return Sum(
        Case(
            When(orders__side=OrderSide.BUY, then=F("orders__quantity")),
            When(orders__side=OrderSide.SELL, then=-1 * F("orders__quantity")),
            default=Value(0),
            output_field=IntegerField(),
        ),
        filter=Q(orders__action_type=ActionType.FILL, orders__is_deleted=False),
    )


class SecurityViewSet(BaseCommonViewSet):
    """종목 CRUD. 계획 계층의 허리라서 거의 모든 화면이 이 목록을 먼저 부른다."""

    queryset = Security.objects.all()
    FILTER_FIELDS = SECURITY_FILTER_FIELDS
    list_serializer_class = SecurityListSerializer
    detail_serializer_class = SecurityDetailSelectSerializer
    select_list = ("account",)
    select_detail = ("account",)
    default_ordering = ("-is_active", "name")

    def get_queryset(self):
        qs = super().get_queryset()
        # 리스트 응답에서 보유수량을 종목별로 aggregate 하면 N+1 이 된다.
        # annotate 한 번으로 뽑고, 모델 프로퍼티가 이 값을 우선 참조한다.
        if self.action == "list":
            qs = qs.annotate(_fill_qty=_fill_qty_annotation())
        return qs
