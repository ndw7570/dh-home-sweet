"""계획 대비 이행 대조.

`orders` 테이블의 코멘트가 '주문' 이 아니라 '이행' 인 이유가 여기서 드러난다.
계획한 것과 실제로 한 것 사이의 간극을 재는 것이 이 서비스의 전부다.

판정 규칙 — 위반이라고 단정하지 않고 **표시(flag)** 만 한다.
계획 밖의 매매가 항상 잘못은 아니다. 다만 그것이 계획 밖이었다는 사실이
기록에 남아야 나중에 그 결정이 좋았는지 나빴는지 갈라 볼 수 있다.

v0.0.3 부터 대조 기준은 주계획(WeeklyInvestmentPlan) 이 아니라
주(종목별)계획(WeeklySecurityInvestmentPlan) 이다 — 종목별 예상가/손절가/추세가
그쪽으로 이동했기 때문.

대조는 **(종목, 이행일) 로 그때 살아 있던 계획을 사후에 찾는 방식**이다.
`orders` 에 계획ID 컬럼을 두고 이행할 때 사람이 고르게 하지 않는다. 그러면 계획
밖의 매매도 아무 계획이나 붙여 '계획 안' 으로 만들 수 있어, 이 서비스가 재려는
간극 자체가 사라진다. 날짜로 사후 대조해야 "그때 그 계획이 실제로 있었나" 가
객관적으로 남는다.

찾는 순서는 **일계획 → 주(종목별)계획** 이다. 그날을 콕 집어 세운 계획이 있으면
그것이 가장 가까운 기준이고, 없으면 그 주의 종목별 계획으로 물러선다.
"""

from datetime import date, timedelta

from django.db.models import DateField, F
from django.db.models.functions import Coalesce, TruncDate

from trading_discipline.constants.choices import ActionType, MarketTrend, OrderSide
from trading_discipline.models import (
    DailyInvestmentPlan,
    Order,
    WeeklySecurityInvestmentPlan,
)
from trading_discipline.services._common import labels, num, today

#: 예상가를 이만큼 넘겨 사면 표시한다(%).
OVERPAY_TOLERANCE_PCT = 2.0

#: 이행이 '언제 일어난 것인가'. 이행시각이 비어 있는 행만 생성일로 물러선다.
#:
#: 예전엔 생성일(created_at, auto_now_add) 하나로 대조했다. 그러면 지난주 매매를
#: 오늘 뒤늦게 입력했을 때 **오늘 계획**과 대조돼 준수율이 통째로 틀어진다.
#: TruncDate 는 settings.TIME_ZONE(Asia/Seoul) 기준으로 날짜를 끊는다 — UTC 로
#: 끊으면 한국 장 마감 뒤의 매매가 다음 날로 밀린다.
EFFECTIVE_DATE = Coalesce(TruncDate("executed_at"), F("created_at"), output_field=DateField())


def _daily_plans_covering(security_id: int, on: date) -> list[DailyInvestmentPlan]:
    """그날을 콕 집어 세운 일계획. 일계획은 하루짜리라 사실상 날짜 일치다."""
    return list(
        DailyInvestmentPlan.objects.filter(
            weekly_security_plan__security_id=security_id,
            weekly_security_plan__is_deleted=False,
            valid_from__lte=on,
            valid_until__gte=on,
        )
        .select_related("weekly_security_plan__weekly_plan")
        .order_by("scenario_planning")
    )


def _security_plans_covering(security_id: int, on: date) -> list[WeeklySecurityInvestmentPlan]:
    return list(
        WeeklySecurityInvestmentPlan.objects.filter(
            security_id=security_id,
            weekly_plan__valid_from__lte=on,
            weekly_plan__valid_until__gte=on,
            weekly_plan__is_deleted=False,
        )
        .select_related("weekly_plan")
        .order_by("scenario_planning")
    )


def _normalize(plan, level: str) -> dict:
    """일계획과 주(종목별)계획을 판정에 쓸 같은 모양으로 눌러 둔다.

    두 계층이 predicted_trend / predicted_price / stop_loss_price 를 같은 이름으로
    갖고 있어 판정 로직은 하나로 충분하다. 갈리는 것은 '위 계층에 매달려 있는가'를
    어디까지 타고 올라가야 하는지뿐이다.
      일계획      → 주(종목별)계획 → 주계획 → 월계획
      주(종목별)  →                  주계획 → 월계획
    """
    if level == "DAY":
        sec_plan = plan.weekly_security_plan
        weekly = sec_plan.weekly_plan if sec_plan else None
    else:
        sec_plan = plan
        weekly = plan.weekly_plan

    return {
        "level": level,
        "id": plan.id,
        "title": plan.title,
        "scenario_planning": plan.scenario_planning,
        "predicted_trend": plan.predicted_trend,
        "predicted_price": num(plan.predicted_price),
        # 목표체결가는 일계획에만 있다. 주(종목별)계획으로 물러선 경우엔 None.
        "target_fill_price": num(getattr(plan, "target_fill_price", None)),
        "stop_loss_price": num(plan.stop_loss_price),
        "weekly_plan_id": weekly.id if weekly else None,
        "weekly_security_plan_id": sec_plan.id if sec_plan else None,
        # 일계획은 자기 날짜를, 주(종목별)계획은 상위 주계획의 기간을 쓴다.
        "valid_from": getattr(plan, "valid_from", None) or (weekly.valid_from if weekly else None),
        "valid_until": (
            getattr(plan, "valid_until", None) or (weekly.valid_until if weekly else None)
        ),
        # 사이가 한 군데라도 끊겨 있으면 상위 논리 없이 뜬 계획이다.
        "grounded": bool(weekly and weekly.monthly_plan_id is not None),
        **labels(plan, "scenario_planning", "predicted_trend"),
    }


def _plans_covering(security_id: int, on: date) -> list[dict]:
    """그날 이 종목을 덮던 계획. 일계획이 있으면 그쪽이 기준이다."""
    dailies = _daily_plans_covering(security_id, on)
    if dailies:
        return [_normalize(p, "DAY") for p in dailies]
    return [_normalize(p, "WEEKLY_SECURITY") for p in _security_plans_covering(security_id, on)]


def _flags_for(order: Order, plans: list[dict]) -> list[dict]:
    """`plans` 는 `_normalize` 로 눌러 둔 dict 목록 — 일계획/주(종목별)계획 둘 다 온다."""
    flags: list[dict] = []

    if not plans:
        flags.append(
            {
                "code": "NO_PLAN",
                "severity": "HIGH",
                "message": "이 날짜에 이 종목을 덮는 계획이 없다(일계획도, 주(종목별)계획도). "
                "계획 밖의 매매다.",
            }
        )
        return flags

    if not any(p["grounded"] for p in plans):
        flags.append(
            {
                "code": "UNGROUNDED_PLAN",
                "severity": "HIGH",
                "message": "계획은 있지만 위 계층(월계획)에 매달려 있지 않다. "
                "상위 논리 없이 세운 계획이라 사실상 계획 밖의 매매다.",
            }
        )

    # 여러 시나리오가 있으면 하나라도 통과하면 통과로 본다(BASE/BULL/BEAR 를 다 세워 둔 경우).
    price = order.limit_price

    if order.side == OrderSide.BUY:
        if all(p["predicted_trend"] == MarketTrend.DOWN for p in plans):
            flags.append(
                {
                    "code": "DIRECTION_MISMATCH",
                    "severity": "HIGH",
                    "message": "하락을 예측해 둔 계획만 있는데 매수했다.",
                }
            )
        if price is not None:
            price = float(price)
            stops = [p["stop_loss_price"] for p in plans if p["stop_loss_price"] is not None]
            if stops and price <= min(stops):
                flags.append(
                    {
                        "code": "BELOW_STOP_LOSS",
                        "severity": "HIGH",
                        "message": f"지정가 {num(price)} 가 손절가({num(min(stops))}) 이하다. "
                        "손절 구간에서 추가 매수했다.",
                    }
                )
            targets = [p["predicted_price"] for p in plans if p["predicted_price"] is not None]
            if targets:
                best = max(targets)
                limit = float(best) * (1 + OVERPAY_TOLERANCE_PCT / 100)
                if price > limit:
                    flags.append(
                        {
                            "code": "ABOVE_TARGET",
                            "severity": "MEDIUM",
                            "message": f"지정가 {num(price)} 가 예상가({num(best)})를 "
                            f"{OVERPAY_TOLERANCE_PCT}% 넘게 웃돈다.",
                        }
                    )

    if order.side == OrderSide.SELL and all(
        p["predicted_trend"] == MarketTrend.UP for p in plans
    ):
        flags.append(
            {
                "code": "DIRECTION_MISMATCH",
                "severity": "MEDIUM",
                "message": "상승을 예측해 둔 계획만 있는데 매도했다.",
            }
        )

    return flags


def compare_with_plan(
    security_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
) -> dict:
    """기간 안의 이행을 하나씩 계획과 맞춰 본다."""
    date_to = date_to or today()
    date_from = date_from or (date_to - timedelta(days=30))

    # 기간 필터도 이행일 기준이다. 입력일로 걸면 밀린 거래를 몰아 넣었을 때
    # 그 매매들이 통째로 조회 밖으로 새 나간다.
    qs = (
        Order.objects.select_related("security")
        .annotate(effective_date=EFFECTIVE_DATE)
        .filter(effective_date__gte=date_from, effective_date__lte=date_to)
    )
    if security_id:
        qs = qs.filter(security_id=security_id)
    # 계획(PLAN) 행은 대조 대상이 아니라 계획 그 자체라 뺀다.
    qs = qs.exclude(action_type=ActionType.PLAN).order_by("-effective_date", "-executed_at", "-id")

    plan_cache: dict[tuple[int, date], list[dict]] = {}
    rows = []
    flagged = 0

    for order in qs:
        on = order.effective_date or date_to
        plans: list[dict] = []
        if order.security_id:
            key = (order.security_id, on)
            if key not in plan_cache:
                plan_cache[key] = _plans_covering(order.security_id, on)
            plans = plan_cache[key]

        flags = _flags_for(order, plans)
        if flags:
            flagged += 1

        rows.append(
            {
                # 이 이행이 '언제 일어난 것' 으로 판정됐는지. 화면이 이 값으로 묶는다.
                "date": on,
                "order": {
                    "id": order.id,
                    "action_type": order.action_type,
                    "order_type": order.order_type,
                    "side": order.side,
                    "quantity": order.quantity,
                    "limit_price": num(order.limit_price),
                    "notional": num(order.notional),
                    "executed_at": order.executed_at,
                    "created_at": order.created_at,
                    "remarks": order.remarks,
                    **labels(order, "action_type", "order_type", "side"),
                },
                "security": (
                    {
                        "id": order.security.id,
                        "symbol": order.security.symbol,
                        "name": order.security.name,
                    }
                    if order.security_id
                    else None
                ),
                # `_normalize` 가 이미 화면이 쓸 모양으로 눌러 뒀다. level 로 일계획인지
                # 주(종목별)계획인지가 화면에 드러난다 — 무엇과 대조했는지 숨기지 않는다.
                "matched_plans": plans,
                "flags": flags,
            }
        )

    total = len(rows)
    return {
        "date_from": date_from,
        "date_to": date_to,
        "security_id": security_id,
        "rows": rows,
        "summary": {
            "order_count": total,
            "flagged_count": flagged,
            # 규율 준수율. 이 숫자 하나가 이 프로그램이 답하려는 질문이다.
            "discipline_rate": round((total - flagged) / total * 100, 1) if total else None,
        },
    }
