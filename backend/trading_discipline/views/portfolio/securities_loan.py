from core.constants.filters import SECURITIES_LOAN_FILTER_FIELDS
from core.views.common import BaseCommonViewSet
from trading_discipline.models import SecuritiesLoan
from trading_discipline.serializers.portfolio import (
    SecuritiesLoanDetailSelectSerializer,
    SecuritiesLoanListSerializer,
)


class SecuritiesLoanViewSet(BaseCommonViewSet):
    """종목담보대출 CRUD.

    `?ratio_below=140` 처럼 담보비율 경고선 아래만 뽑아 홈 경고 카드를 만든다.
    """

    queryset = SecuritiesLoan.objects.all()
    FILTER_FIELDS = SECURITIES_LOAN_FILTER_FIELDS
    list_serializer_class = SecuritiesLoanListSerializer
    detail_serializer_class = SecuritiesLoanDetailSelectSerializer
    select_list = ("security",)
    select_detail = ("security",)
    default_ordering = ("maturity_at",)
