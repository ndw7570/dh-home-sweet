"""
타임라인 조립 서비스 — 이 프로그램의 핵심 화면 하나를 통째로 만든다.

반환 계약 (프론트 TimelineChart 가 그대로 받는 모양):
{
  "today": "2026-08-03",
  "actual":           [{"date": ..., "value": ...}, ...],   # 실선
  "past_projections": [{"projected_on": ..., "points": [...]}],  # 회색 파선
  "scenarios":        [{"type": "BASE", "label": "기준", "points": [...]}],  # 점선 부채꼴
  "journal_marks":    [{"date": ..., "entry_id": ..., "decision_type": ...}]
}

DDL 확정 전이므로 각 함수는 구조만 잡아 두고 빈 리스트를 돌려준다.
채울 자리는 TODO 로 표시했다.
"""
from __future__ import annotations

from datetime import date
from typing import Any


def build_timeline(user_id: str, *, plan_id: int | None = None, months_back: int = 12) -> dict[str, Any]:
    return {
        "today": date.today().isoformat(),
        "actual": _actual_series(user_id, months_back),
        "past_projections": _past_projection_series(user_id, plan_id),
        "scenarios": _scenario_series(plan_id),
        "journal_marks": _journal_marks(user_id, months_back),
    }


def _actual_series(user_id: str, months_back: int) -> list[dict]:
    """AssetSnapshot 을 snapshot_date 오름차순으로 뽑아 실선을 만든다."""
    # TODO(DDL): AssetSnapshot.objects.filter(user_id=user_id, snapshot_date__gte=...)
    #            .order_by("snapshot_date").values("snapshot_date", "net_worth")
    return []


def _past_projection_series(user_id: str, plan_id: int | None) -> list[dict]:
    """
    과거에 세운 예상선. projected_on 별로 묶어서 각각 하나의 파선으로 그린다.
    절대 최신 예상으로 덮어쓰지 않는다 — 덮어쓰면 예상 적중률을 잃는다.
    """
    # TODO(DDL): ProjectionSnapshot.objects.filter(scenario__plan_id=plan_id,
    #            projected_on__lt=today).order_by("projected_on", "target_date")
    return []


def _scenario_series(plan_id: int | None) -> list[dict]:
    """오늘 기준 현재 시나리오 3갈래."""
    # TODO(DDL): Scenario.objects.filter(plan_id=plan_id) 의 최신 projected_on 배치만 사용
    return []


def _journal_marks(user_id: str, months_back: int) -> list[dict]:
    """실선 위에 찍히는 일지 마커."""
    # TODO(DDL): JournalEntry.objects.filter(user_id=user_id, entry_date__gte=...)
    return []
