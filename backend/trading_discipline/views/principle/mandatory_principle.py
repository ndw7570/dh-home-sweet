from core.constants.filters import MANDATORY_PRINCIPLE_FILTER_FIELDS
from core.views.common import BaseCommonViewSet
from trading_discipline.models import MandatoryPrinciple
from trading_discipline.serializers.principle import (
    MandatoryPrincipleDetailSelectSerializer,
    MandatoryPrincipleListSerializer,
)


class MandatoryPrincipleViewSet(BaseCommonViewSet):
    """나의필수원칙 CRUD. 홈 화면 맨 위에 걸리는 목록.

    `?period_type=` 으로 계층별 원칙을 뽑는다. 이 하나로 두 화면이 굴러간다:

        ?period_type=DAY     이행 화면이 체크리스트에 띄울 원칙 (Y/N 입력 필수)
        ?period_type=MONTH   월계획 작성 화면이 보여 줄 원칙 (읽기만)
    """

    queryset = MandatoryPrinciple.objects.all()
    FILTER_FIELDS = MANDATORY_PRINCIPLE_FILTER_FIELDS
    list_serializer_class = MandatoryPrincipleListSerializer
    detail_serializer_class = MandatoryPrincipleDetailSelectSerializer
    # 응답의 period_types 를 채우려면 적용기간이 필요하다. prefetch 없이 두면
    # 원칙 수만큼 쿼리가 나간다.
    prefetch_list = ("scopes",)
    prefetch_detail = ("scopes",)
    default_ordering = ("priority", "id")
