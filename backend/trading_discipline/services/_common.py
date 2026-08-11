"""서비스 계층 공통 헬퍼."""

from datetime import date
from decimal import Decimal

from django.db.models import Q


def today() -> date:
    return date.today()


def active_on(field_from: str = "valid_from", field_until: str = "valid_until", on: date = None) -> Q:
    """`on` 날짜에 유효한 행만 고르는 Q. 기간이 비어 있는 행은 제외한다."""
    on = on or today()
    return Q(**{f"{field_from}__lte": on, f"{field_until}__gte": on})


def labels(instance, *fields) -> dict:
    """`{"direction_label": "매수", ...}` — 코드값의 한글 라벨을 뽑는다.

    ViewSet 응답은 ChoiceLabelMixin 이 라벨을 자동으로 붙여 주지만, 서비스 계층이
    직접 조립한 dict 에는 그게 안 걸린다. 그러면 화면에 `LONG`, `BASE` 같은 코드가
    그대로 노출된다. 조립한 dict 에도 같은 규칙을 지키기 위한 헬퍼다.
    """
    out = {}
    for field in fields:
        getter = getattr(instance, f"get_{field}_display", None)
        if getter is not None:
            out[f"{field}_label"] = getter()
    return out


def num(value) -> float | None:
    """Decimal 을 JSON 으로 내보내기 좋게 float 로 눕힌다."""
    if value is None:
        return None
    if isinstance(value, Decimal):
        return float(value)
    return value


def ratio(part, whole) -> float | None:
    if part is None or not whole:
        return None
    return round(float(part) / float(whole), 4)


def pct(part, whole) -> float | None:
    r = ratio(part, whole)
    return None if r is None else round(r * 100, 2)
