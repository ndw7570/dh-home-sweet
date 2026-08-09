"""홈 화면(토스형 카드 스택) 한 번의 호출로 채워지는 요약."""
from __future__ import annotations

from typing import Any


def home_summary(user_id: str) -> dict[str, Any]:
    """
    반환 계약 (프론트 HomePage 가 그대로 받는 모양):
    {
      "net_worth": 84320000,
      "plan_gap_amount": 2020000,        # 계획 대비 (+/-)
      "projection": {"target_date": "2026-12-01", "value": 98500000,
                     "vs_last_projection_rate": 0.03},
      "unjournaled": {"total": 3, "missing": 2},   # 이번 주 매매 중 이유 미기재
      "pending_review": {"review_id": 12, "period_label": "7월", "status": "READY"}
    }
    """
    # TODO(DDL): AssetSnapshot / Plan / ProjectionSnapshot / Transaction / Review 집계
    return {
        "net_worth": None,
        "plan_gap_amount": None,
        "projection": None,
        "unjournaled": {"total": 0, "missing": 0},
        "pending_review": None,
    }
