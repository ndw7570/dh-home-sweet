"""
회고 서비스.

회고는 사용자가 찾아 들어가는 화면이 아니라 주기가 끝나면 자동으로 생기는 이벤트다.
배치가 READY 상태의 Review 를 미리 만들어 두고, 사용자는 원인과 조정만 채운다.
"""
from __future__ import annotations

from datetime import date
from typing import Any

from ._common import period_bounds


def open_review_for_period(user_id: str, plan_id: int, period_type: str, anchor: date) -> dict[str, Any]:
    """주기 마감 시 Review 를 READY 로 생성한다. 이미 있으면 그대로 돌려준다."""
    start, end = period_bounds(period_type, anchor)
    # TODO(DDL): Review.objects.get_or_create(user_id=..., plan_id=..., period_start=start, ...)
    #            planned_value = 해당 주기의 기준 시나리오 projected_value
    #            actual_value  = 해당 주기 마지막 AssetSnapshot.net_worth
    return {"period_start": start.isoformat(), "period_end": end.isoformat(), "status": "READY"}


def review_digest(review_id: int) -> dict[str, Any]:
    """
    회고 화면에 얹을 요약. 사용자가 빈 화면을 보지 않도록 원인 후보까지 만들어 준다.

    - 계획 대비 차이
    - 해당 주기의 일지를 태그별로 묶은 성과
    - 이유가 비어 있는 거래 목록
    """
    # TODO(DDL): JournalEntry x JournalTag 집계 + Transaction(journal_entry__isnull=True)
    return {"gap": None, "tag_performance": [], "unjournaled_transactions": []}
