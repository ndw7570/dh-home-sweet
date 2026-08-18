"""시세 조회 API — 읽기 전용.

세 엔드포인트 모두 **GET 만 받는다.** 봉과 종목은 사람이 만드는 것이 아니라 수집기가
KIS 에서 받아 쌓는 것이다. 쓰기를 열어 두면 손으로 고친 값과 수집한 값이 섞이는데,
그러면 "이 봉이 실제 시세인가" 를 더 이상 보장할 수 없다.

수집 대상을 바꾸려면 **화면에서 종목의 '관리대상'(securities.is_active) 을 켜고 끈다.**
여기에는 그 스위치가 없다 — 기준이 둘이 되면 어긋나기 때문이다.
"""

from django.db.models import Exists, OuterRef
from rest_framework.exceptions import ValidationError

from core.constants.filters import (
    DAILY_CANDLE_FILTER_FIELDS,
    MARKET_SYMBOL_FILTER_FIELDS,
    MINUTE_CANDLE_FILTER_FIELDS,
)
from core.views.common import BaseCommonViewSet
from market_data.models import DailyCandle, MinuteCandle, Symbol
from market_data.serializers import (
    DailyCandleSerializer,
    MinuteCandleSerializer,
    SymbolSerializer,
)
from trading_discipline.models import Security

READ_ONLY_METHODS = ["get", "head", "options"]


class SymbolViewSet(BaseCommonViewSet):
    """수집 종목 목록. `is_target` 으로 지금 수집 중인지 구분한다."""

    queryset = Symbol.objects.all()
    FILTER_FIELDS = MARKET_SYMBOL_FILTER_FIELDS
    list_serializer_class = SymbolSerializer
    detail_serializer_class = SymbolSerializer
    default_ordering = ("symbol",)
    http_method_names = READ_ONLY_METHODS

    def get_queryset(self):
        # 수집 대상 여부는 securities 가 정한다. 서브쿼리 한 번으로 붙여 N+1 을 피한다.
        return super().get_queryset().annotate(
            is_target=Exists(
                Security.objects.filter(symbol=OuterRef("symbol"), is_active=True)
            )
        )


class _CandleViewSet(BaseCommonViewSet):
    """봉 조회 공통.

    봉 테이블에는 소프트딜리트가 없다. `?soft_delete_mode=` 는 받아도 의미가 없어
    무시된다(strict 검사에서 제외된 공통 파라미터라 400 이 되지도 않는다).

    **종목을 지정하지 않은 목록 조회는 막는다.** 종목 없이 전체 봉을 긁는 질의는 화면에
    쓸 일이 없는데 양은 수백만 행까지 간다. 실수로 한 번 나가면 DB 와 화면이 함께 멈춘다.
    """

    http_method_names = READ_ONLY_METHODS
    symbol_params = ("symbol_id", "symbol")

    def _base_queryset(self):
        return self.queryset.model.objects.all()

    def list(self, request, *args, **kwargs):
        if not any(request.query_params.get(p) for p in self.symbol_params):
            raise ValidationError(
                {
                    "symbol": (
                        "종목을 지정해야 한다. `?symbol=005930` 또는 `?symbol_id=1` 을 붙여라. "
                        "종목 없이 전체 봉을 조회하는 것은 허용하지 않는다."
                    )
                }
            )
        return super().list(request, *args, **kwargs)


class DailyCandleViewSet(_CandleViewSet):
    """일봉. `?symbol=005930&date_from=2026-01-01&date_to=2026-08-18`"""

    queryset = DailyCandle.objects.all()
    FILTER_FIELDS = DAILY_CANDLE_FILTER_FIELDS
    list_serializer_class = DailyCandleSerializer
    detail_serializer_class = DailyCandleSerializer
    select_list = ("symbol",)
    select_detail = ("symbol",)
    default_ordering = ("-date",)


class MinuteCandleViewSet(_CandleViewSet):
    """분봉. `?symbol=005930&date=2026-08-18`

    `date` 는 KST 기준이다(저장은 UTC). 화면이 "8월 18일 분봉" 을 물으면 그날 09:00~15:30
    KST 구간이 나온다.
    """

    queryset = MinuteCandle.objects.all()
    FILTER_FIELDS = MINUTE_CANDLE_FILTER_FIELDS
    list_serializer_class = MinuteCandleSerializer
    detail_serializer_class = MinuteCandleSerializer
    select_list = ("symbol",)
    select_detail = ("symbol",)
    default_ordering = ("-ts",)
