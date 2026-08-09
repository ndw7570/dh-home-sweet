"""서비스 계층 공통 헬퍼."""
from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Optional


def to_float(value: Optional[Decimal]) -> Optional[float]:
    """JSON 직렬화용. Decimal 을 그대로 내보내면 프론트에서 문자열로 받는다."""
    return float(value) if value is not None else None


def iso(d: Optional[date]) -> Optional[str]:
    return d.isoformat() if d else None


def period_bounds(period_type: str, anchor: date) -> tuple[date, date]:
    """주기 문자열과 기준일로 (시작일, 종료일)을 만든다. 회고 배치가 사용."""
    if period_type == "YEAR":
        return date(anchor.year, 1, 1), date(anchor.year, 12, 31)
    if period_type == "QUARTER":
        q = (anchor.month - 1) // 3
        start = date(anchor.year, q * 3 + 1, 1)
        end_month = q * 3 + 3
        end_year = anchor.year + (1 if end_month == 12 else 0)
        nxt = date(end_year, 1, 1) if end_month == 12 else date(anchor.year, end_month + 1, 1)
        return start, date.fromordinal(nxt.toordinal() - 1)
    start = date(anchor.year, anchor.month, 1)
    nxt = (
        date(anchor.year + 1, 1, 1)
        if anchor.month == 12
        else date(anchor.year, anchor.month + 1, 1)
    )
    return start, date.fromordinal(nxt.toordinal() - 1)
