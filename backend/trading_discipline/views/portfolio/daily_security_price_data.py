from datetime import datetime
from decimal import Decimal, InvalidOperation

from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError

from core.constants.filters import DAILY_SECURITY_PRICE_DATA_FILTER_FIELDS
from core.views.common import BaseCommonViewSet
from core.views.response import success_response
from market_data.services.pricing import KRX_CLOSE_TIME, KST, price_snapshot
from trading_discipline.models import DailySecurityPriceData, Security
from trading_discipline.serializers.portfolio import (
    DailySecurityPriceDataDetailSelectSerializer,
    DailySecurityPriceDataListSerializer,
)


class DailySecurityPriceDataViewSet(BaseCommonViewSet):
    """일별 가격데이터 CRUD. 전략이 이 행을 가리키므로 함부로 지우면 전략의 근거가 사라진다.

    행은 **전략을 세울 때 하나씩** 생긴다. 수집분을 상시로 미러링하지 않는다 —
    자세한 이유는 시리얼라이저 docstring 참조.
    """

    queryset = DailySecurityPriceData.objects.all()
    FILTER_FIELDS = DAILY_SECURITY_PRICE_DATA_FILTER_FIELDS
    list_serializer_class = DailySecurityPriceDataListSerializer
    detail_serializer_class = DailySecurityPriceDataDetailSelectSerializer
    select_list = ("security",)
    select_detail = ("security",)
    default_ordering = ("-price_at",)

    @action(detail=False, methods=["get"], url_path="preview")
    def preview(self, request, *args, **kwargs):
        """저장 전에 스냅샷 값을 미리 본다. **아무것도 저장하지 않는다.**

            GET /security-price-data/preview/?security_id=3
            GET /security-price-data/preview/?security_id=3&date=2026-08-14
            GET /security-price-data/preview/?security_id=3&price_at=2026-08-18T13:00:00Z

        전략 화면이 종목·기준일을 고른 직후 이걸 불러 "이 값으로 뜹니다" 를 보여 주면,
        사람이 확인하고 저장하게 된다. 저장 버튼을 누르고 나서야 값을 알게 되면
        틀린 기준일로 만든 스냅샷을 지우고 다시 만드는 일이 반복된다.

        `date` 는 일자 목록에서 하루를 고르는 흐름을 위한 것이다. 과거 날짜면 그날 장
        마감(15:30 KST) 기준으로, 오늘이면 지금 시각 기준으로 계산한다.
        시각까지 지정하려면 `price_at` 을 쓴다. 둘을 함께 보내면 `price_at` 이 이긴다.
        """
        allowed = {"security_id", "price_at", "date", "base_price"}
        unknown = set(request.query_params) - allowed
        if unknown:
            raise ValidationError(
                {
                    "query_params": (
                        f"허용되지 않은 검색 파라미터: {', '.join(sorted(unknown))}. "
                        f"이 엔드포인트가 받는 값: {', '.join(sorted(allowed))}"
                    )
                }
            )

        security_id = request.query_params.get("security_id")
        if not security_id:
            raise ValidationError({"security_id": "종목을 지정해야 한다."})

        security = Security.objects.filter(pk=security_id).first()
        if security is None:
            raise ValidationError({"security_id": f"종목을 찾지 못했다: {security_id}"})

        at = self._resolve_at(request)
        snapshot = price_snapshot(security, at)

        # 저장하지 않는 인스턴스로 변동률을 낸다. 계산식을 모델과 뷰 두 곳에 두면
        # 한쪽만 고쳐졌을 때 미리보기와 저장 결과가 달라진다.
        draft = DailySecurityPriceData(
            high_price=snapshot["high"],
            low_price=snapshot["low"],
            current_price=snapshot["current"],
        )

        def num(value):
            """가격은 문자열로. 모델의 DecimalField 가 나가는 형식과 맞춘다."""
            return str(value) if value is not None else None

        def rate(value):
            """변동률은 숫자로. 저장 응답의 프로퍼티 필드와 형식을 맞춘다 —
            같은 값이 미리보기에서는 문자열, 저장 뒤에는 숫자로 오면 화면이 둘을
            따로 다뤄야 하고 그 자리에서 버그가 난다."""
            return float(value) if value is not None else None

        body = {
            "security": security.id,
            "security_name": security.name,
            "symbol": security.symbol,
            "price_at": snapshot["at"].isoformat(),
            "high_price": num(snapshot["high"]),
            "low_price": num(snapshot["low"]),
            "current_price": num(snapshot["current"]),
            # MINUTE(당일 분봉 집계) | DAILY(과거 일봉) | null(수집분 없음)
            "price_source": snapshot["source"],
            # 현재가 대비 변동폭. 전략은 가격이 아니라 이 비율로 짠다.
            "high_rate": rate(draft.high_rate),
            "low_rate": rate(draft.low_rate),
            "band_width": rate(draft.band_width),
        }

        base_price = self._resolve_base_price(request)
        if base_price is not None:
            projected = draft.project(base_price)
            # 같은 변동폭을 다른 기준가에 적용하면 얼마가 되는가.
            # 200만 기준 +20%/-20% 를 100만에 적용하면 120만 ~ 80만.
            body["projection"] = {
                "base_price": num(base_price),
                "high": num(projected["high"]),
                "low": num(projected["low"]),
            }

        return success_response(body)

    @staticmethod
    def _resolve_base_price(request):
        raw = request.query_params.get("base_price")
        if raw in (None, ""):
            return None
        try:
            value = Decimal(str(raw))
        except (InvalidOperation, ValueError) as exc:
            raise ValidationError({"base_price": f"숫자여야 한다: {raw!r}"}) from exc
        if value <= 0:
            raise ValidationError({"base_price": "0 보다 커야 한다."})
        return value

    @staticmethod
    def _resolve_at(request):
        """`price_at` 우선, 없으면 `date`, 둘 다 없으면 지금."""
        raw_at = request.query_params.get("price_at")
        if raw_at:
            at = parse_datetime(raw_at)
            if at is None:
                raise ValidationError(
                    {"price_at": f"ISO 8601 형식이어야 한다 (예: 2026-08-18T13:00:00Z): {raw_at!r}"}
                )
            return at

        raw_date = request.query_params.get("date")
        if not raw_date:
            return None

        day = parse_date(raw_date)
        if day is None:
            raise ValidationError({"date": f"YYYY-MM-DD 형식이어야 한다: {raw_date!r}"})
        if day > timezone.localdate():
            raise ValidationError(
                {"date": f"아직 오지 않은 날짜다: {day}. 시세는 지난 시간에만 존재한다."}
            )
        if day == timezone.localdate():
            return timezone.now()
        # 지난 날짜는 그날 장 마감 시각으로 본다. 그 시점이 종가가 확정되는 자리다.
        return datetime.combine(day, KRX_CLOSE_TIME, tzinfo=KST)
