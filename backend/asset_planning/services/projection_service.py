"""
예상 계산 / 적중률 서비스.

정책 두 가지만 기억하면 된다.
1) 시나리오 가정이 바뀌면 UPDATE 가 아니라 새 ProjectionSnapshot 배치를 INSERT 한다.
2) target_date 가 지나면 배치가 actual_value / gap 을 채우고 is_settled=True 로 닫는다.
"""
from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Any


def project(
    *,
    start_value: Decimal,
    monthly_contribution: Decimal,
    annual_return_rate: Decimal,
    months: int,
    start_date: date,
) -> list[dict[str, Any]]:
    """월 복리 + 정액 적립의 단순 투영. 화면 부채꼴 한 갈래를 만든다."""
    monthly_rate = annual_return_rate / Decimal(12)
    value = Decimal(start_value)
    points: list[dict[str, Any]] = []
    year, month = start_date.year, start_date.month
    for _ in range(months):
        month += 1
        if month > 12:
            month, year = 1, year + 1
        value = value * (Decimal(1) + monthly_rate) + monthly_contribution
        points.append(
            {"target_date": date(year, month, 1).isoformat(), "projected_value": round(value, 2)}
        )
    return points


def snapshot_projection(scenario_id: int, points: list[dict]) -> int:
    """계산 결과를 ProjectionSnapshot 으로 적재하고 생성 건수를 돌려준다."""
    # TODO(DDL): bulk_create(ProjectionSnapshot(scenario_id=..., projected_on=date.today(), ...))
    return 0


def settle_due_projections(as_of: date | None = None) -> int:
    """target_date 가 지난 예상에 실제값을 붙여 닫는다. 배치에서 호출."""
    # TODO(DDL): AssetSnapshot 과 조인해 actual_value / gap_amount / gap_rate 채우기
    return 0


def hit_rate(user_id: str, *, months: int = 12) -> float | None:
    """예상 적중률 — 홈의 지표 카드 하나. |gap_rate| <= 임계치인 비율."""
    # TODO(DDL): is_settled=True 인 ProjectionSnapshot 집계
    return None
