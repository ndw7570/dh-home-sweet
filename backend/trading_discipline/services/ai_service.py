"""AI 피드백을 대상 객체에 붙인다.

`ai_decision_feedback` 은 FK 가 아니라 `table_name` + `object_id` 로 아무 테이블에나 붙는다.
DB 가 무결성을 지켜 주지 않으므로 조회 쪽에서 두 가지를 한다.

  1. 대상 테이블을 화이트리스트로 좁힌다 (AiDecisionFeedback.TARGET_TABLES)
  2. 만료된 의견을 기본값으로 제외한다

2번이 중요하다. AI 의견에는 `valid_until` 이 있고, 지난 의견을 오늘 판단의 근거로
끌어다 쓰는 순간 이 테이블은 도움이 아니라 소음이 된다.
"""

from datetime import date

from django.db.models import Q

from trading_discipline.models import AiDecisionFeedback
from trading_discipline.services._common import num, today


def _row(fb: AiDecisionFeedback) -> dict:
    return {
        "id": fb.id,
        "opinion_type": fb.opinion_type,
        "opinion_type_label": fb.get_opinion_type_display(),
        "table_name": fb.table_name,
        "object_id": fb.object_id,
        "ai_decision": fb.ai_decision,
        "score": num(fb.score),
        "confidence_score": num(fb.confidence_score),
        "reasoning_summary": fb.reasoning_summary,
        "risk_summary": fb.risk_summary,
        "valid_until": fb.valid_until,
        "is_expired": fb.is_expired,
        "model": (
            {
                "id": fb.model_id,
                "model_name": fb.model.model_name,
                "model_version": fb.model.model_version,
                "prompt_version": fb.model.prompt_version,
            }
            if fb.model_id
            else None
        ),
    }


def feedback_for(
    table_name: str,
    object_ids: list[int] | None = None,
    include_expired: bool = False,
    on: date | None = None,
) -> dict[int, list[dict]]:
    """`{object_id: [의견, ...]}` 형태로 돌려준다. 목록 화면이 한 번에 붙일 수 있게."""
    on = on or today()

    if table_name not in AiDecisionFeedback.TARGET_TABLES:
        raise ValueError(f"의견을 붙일 수 없는 테이블이다: {table_name}")

    qs = AiDecisionFeedback.objects.select_related("model").filter(table_name=table_name)
    if object_ids is not None:
        qs = qs.filter(object_id__in=object_ids)
    if not include_expired:
        qs = qs.filter(Q(valid_until__gte=on) | Q(valid_until__isnull=True))

    out: dict[int, list[dict]] = {}
    for fb in qs.order_by("-created_at", "-id"):
        out.setdefault(fb.object_id, []).append(_row(fb))
    return out


def attach(rows: list[dict], table_name: str, id_key: str = "id", **kwargs) -> list[dict]:
    """직렬화된 목록에 `ai_feedback` 키를 얹어서 돌려준다."""
    ids = [r[id_key] for r in rows if r.get(id_key) is not None]
    mapping = feedback_for(table_name, object_ids=ids, **kwargs)
    for row in rows:
        row["ai_feedback"] = mapping.get(row.get(id_key), [])
    return rows


def digest(on: date | None = None) -> dict:
    """AI 화면 상단 요약 — 유효한 의견을 성격별로 세어 본다."""
    on = on or today()
    qs = AiDecisionFeedback.objects.filter(
        Q(valid_until__gte=on) | Q(valid_until__isnull=True)
    )
    by_type: dict[str, int] = {}
    for fb in qs:
        by_type[fb.opinion_type or "UNKNOWN"] = by_type.get(fb.opinion_type or "UNKNOWN", 0) + 1

    expired = AiDecisionFeedback.objects.filter(valid_until__lt=on).count()
    return {
        "as_of": on,
        "valid_count": qs.count(),
        "expired_count": expired,
        "by_opinion_type": by_type,
    }
