"""계획 대비 이행 대조.

`orders` 테이블의 코멘트가 '주문' 이 아니라 '이행' 인 이유가 여기서 드러난다.
계획한 것과 실제로 한 것 사이의 간극을 재는 것이 이 서비스의 전부다.

판정 규칙 — 위반이라고 단정하지 않고 **표시(flag)** 만 한다.
계획 밖의 매매가 항상 잘못은 아니다. 다만 그것이 계획 밖이었다는 사실이
기록에 남아야 나중에 그 결정이 좋았는지 나빴는지 갈라 볼 수 있다.

v0.0.3 부터 대조 기준은 주계획(WeeklyInvestmentPlan) 이 아니라
주(종목별)계획(WeeklySecurityInvestmentPlan) 이다 — 종목별 예상가/손절가/추세가
그쪽으로 이동했기 때문.
"""

from datetime import date, timedelta

from trading_discipline.constants.choices import ActionType, MarketTrend, OrderSide
from trading_discipline.models import Order, WeeklySecurityInvestmentPlan
from trading_discipline.services._common import labels, num, today

#: 예상가를 이만큼 넘겨 사면 표시한다(%).
OVERPAY_TOLERANCE_PCT = 2.0


def _plans_covering(security_id: int, on: date) -> list[WeeklySecurityInvestmentPlan]:
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


def _is_grounded(plan: WeeklySecurityInvestmentPlan) -> bool:
    """이 주(종목별)계획이 위 계층(월계획)에 실제로 매달려 있는가.

    주(종목별)계획 → 주계획 → 월계획. 사이에 어느 하나라도 끊어져 있으면
    상위 논리 없이 뜬 계획으로 취급한다.
    """
    weekly = plan.weekly_plan
    return bool(weekly and weekly.monthly_plan_id is not None)


def _flags_for(order: Order, plans: list[WeeklySecurityInvestmentPlan]) -> list[dict]:
    flags: list[dict] = []

    if not plans:
        flags.append(
            {
                "code": "NO_PLAN",
                "severity": "HIGH",
                "message": "이 날짜에 이 종목을 덮는 주(종목별)계획이 없다. 계획 밖의 매매다.",
            }
        )
        return flags

    if not any(_is_grounded(p) for p in plans):
        flags.append(
            {
                "code": "UNGROUNDED_PLAN",
                "severity": "HIGH",
                "message": "주(종목별)계획은 있지만 위 계층(월계획)에 매달려 있지 않다. "
                "상위 논리 없이 세운 계획이라 사실상 계획 밖의 매매다.",
            }
        )

    # 여러 시나리오가 있으면 하나라도 통과하면 통과로 본다(BASE/BULL/BEAR 를 다 세워 둔 경우).
    price = order.limit_price

    if order.side == OrderSide.BUY:
        if all(p.predicted_trend == MarketTrend.DOWN for p in plans):
            flags.append(
                {
                    "code": "DIRECTION_MISMATCH",
                    "severity": "HIGH",
                    "message": "하락을 예측해 둔 계획만 있는데 매수했다.",
                }
            )
        if price is not None:
            stops = [p.stop_loss_price for p in plans if p.stop_loss_price is not None]
            if stops and price <= min(stops):
                flags.append(
                    {
                        "code": "BELOW_STOP_LOSS",
                        "severity": "HIGH",
                        "message": f"지정가 {num(price)} 가 손절가({num(min(stops))}) 이하다. "
                        "손절 구간에서 추가 매수했다.",
                    }
                )
            targets = [p.predicted_price for p in plans if p.predicted_price is not None]
            if targets:
                best = max(targets)
                limit = float(best) * (1 + OVERPAY_TOLERANCE_PCT / 100)
                if float(price) > limit:
                    flags.append(
                        {
                            "code": "ABOVE_TARGET",
                            "severity": "MEDIUM",
                            "message": f"지정가 {num(price)} 가 예상가({num(best)})를 "
                            f"{OVERPAY_TOLERANCE_PCT}% 넘게 웃돈다.",
                        }
                    )

    if order.side == OrderSide.SELL and all(
        p.predicted_trend == MarketTrend.UP for p in plans
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

    qs = Order.objects.select_related("security").filter(
        created_at__gte=date_from, created_at__lte=date_to
    )
    if security_id:
        qs = qs.filter(security_id=security_id)
    # 계획(PLAN) 행은 대조 대상이 아니라 계획 그 자체라 뺀다.
    qs = qs.exclude(action_type=ActionType.PLAN).order_by("-created_at", "-id")

    plan_cache: dict[tuple[int, date], list[WeeklySecurityInvestmentPlan]] = {}
    rows = []
    flagged = 0

    for order in qs:
        on = order.created_at or date_to
        plans: list[WeeklySecurityInvestmentPlan] = []
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
                "matched_plans": [
                    {
                        "id": p.id,
                        "title": p.title,
                        "scenario_planning": p.scenario_planning,
                        "predicted_trend": p.predicted_trend,
                        "predicted_price": num(p.predicted_price),
                        "stop_loss_price": num(p.stop_loss_price),
                        "weekly_plan_id": p.weekly_plan_id,
                        **labels(p, "scenario_planning", "predicted_trend"),
                    }
                    for p in plans
                ],
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
