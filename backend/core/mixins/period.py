"""기간 계산 헬퍼.

계획이 연 → 분기 → 월 → 주 → 일 로 다섯 겹이라, "오늘이 속한 분기의 시작일" 같은
계산이 서비스 층 곳곳에서 필요하다. 한 군데 모아 둔다.
"""

from calendar import monthrange
from datetime import date, timedelta


def quarter_of(d: date) -> int:
    return (d.month - 1) // 3 + 1


def year_range(d: date) -> tuple[date, date]:
    return date(d.year, 1, 1), date(d.year, 12, 31)


def quarter_range(d: date) -> tuple[date, date]:
    q = quarter_of(d)
    start_month = 3 * (q - 1) + 1
    end_month = start_month + 2
    return date(d.year, start_month, 1), date(d.year, end_month, monthrange(d.year, end_month)[1])


def month_range(d: date) -> tuple[date, date]:
    return date(d.year, d.month, 1), date(d.year, d.month, monthrange(d.year, d.month)[1])


def week_range(d: date) -> tuple[date, date]:
    """월요일 시작."""
    start = d - timedelta(days=d.weekday())
    return start, start + timedelta(days=6)


def day_range(d: date) -> tuple[date, date]:
    return d, d


PERIOD_RANGE = {
    "YEAR": year_range,
    "QUARTER": quarter_range,
    "MONTH": month_range,
    "WEEK": week_range,
    "DAY": day_range,
}


def range_for(period_type: str, d: date) -> tuple[date, date]:
    fn = PERIOD_RANGE.get((period_type or "").upper())
    if fn is None:
        raise ValueError(f"알 수 없는 기간 유형: {period_type}")
    return fn(d)
