"""계획 캐스케이드 조립 — 이 프로그램의 시그니처.

연 → 분기 → 월 → 주 → 일 다섯 계층을 한 트리로 세운다.
문제는 계층이 한 번 꺾인다는 것이다.

    annual --FK--> quarterly --FK--> monthly
                                        |
                                 monthly_investment_principles (월계획 × 종목)
                                        |
                                     Security
                                        |
                                    weekly --FK--> daily

월계획과 주계획 사이에는 FK 가 없다. DDL 이 그렇게 생겼다(주계획은 종목에 직접 붙는다).
그래서 '이 월계획 밑의 주계획'은 **월원칙이 가리키는 종목** + **기간이 겹치는가** 두
조건으로 찾아 붙인다. 이 조립을 화면마다 다시 하면 규칙이 갈라지므로 여기 한 곳에 둔다.

기간이 안 겹치거나 월원칙이 비어서 어디에도 못 붙은 주계획은 버리지 않고
`orphan_weekly_plans` 로 따로 내보낸다. 조용히 사라지면 계획을 세워 놓고도
화면에서 안 보이는 일이 생긴다.
"""

from datetime import date

from trading_discipline.models import (
    AnnualInvestmentPlan,
    DailyInvestmentPlan,
    MonthlyInvestmentPlan,
    QuarterlyInvestmentPlan,
    WeeklyInvestmentPlan,
)
from trading_discipline.services._common import active_on, labels, num, overlaps, today


def _security_brief(security) -> dict | None:
    if security is None:
        return None
    return {
        "id": security.id,
        "symbol": security.symbol,
        "name": security.name,
        "market": security.market,
        "sector": security.sector,
        "current_price": num(security.current_price),
    }


def _daily_node(plan: DailyInvestmentPlan) -> dict:
    return {
        "id": plan.id,
        "level": "DAY",
        "title": plan.title,
        "scenario_planning": plan.scenario_planning,
        "predicted_trend": plan.predicted_trend,
        "confidence_score": plan.confidence_score,
        "predicted_price": num(plan.predicted_price),
        "stop_loss_price": num(plan.stop_loss_price),
        "thesis": plan.thesis,
        "valid_from": plan.valid_from,
        "valid_until": plan.valid_until,
        **labels(plan, "scenario_planning", "predicted_trend"),
    }


def _weekly_node(plan: WeeklyInvestmentPlan, dailies: list[DailyInvestmentPlan]) -> dict:
    return {
        "id": plan.id,
        "level": "WEEK",
        "title": plan.title,
        "security": _security_brief(plan.security),
        "scenario_planning": plan.scenario_planning,
        "predicted_trend": plan.predicted_trend,
        "confidence_score": plan.confidence_score,
        "available_amount": num(plan.available_amount),
        "predicted_price": num(plan.predicted_price),
        "stop_loss_price": num(plan.stop_loss_price),
        "risk_reward": plan.risk_reward,
        "thesis": plan.thesis,
        "valid_from": plan.valid_from,
        "valid_until": plan.valid_until,
        **labels(plan, "scenario_planning", "predicted_trend"),
        "children": [_daily_node(d) for d in dailies],
    }


def _monthly_node(plan: MonthlyInvestmentPlan, weekly_nodes: list[dict], securities: list) -> dict:
    return {
        "id": plan.id,
        "level": "MONTH",
        "title": plan.title,
        "scenario_planning": plan.scenario_planning,
        "predicted_trend": plan.predicted_trend,
        "confidence_score": plan.confidence_score,
        "allocation_ratio": plan.allocation_ratio,
        "thesis": plan.thesis,
        "valid_from": plan.valid_from,
        "valid_until": plan.valid_until,
        **labels(plan, "scenario_planning", "predicted_trend"),
        # 월계획이 종목에 닿는 통로. 비어 있으면 아래로 계층이 이어지지 않는다.
        "securities": [_security_brief(s) for s in securities],
        "children": weekly_nodes,
    }


def _quarterly_node(plan: QuarterlyInvestmentPlan, monthly_nodes: list[dict]) -> dict:
    return {
        "id": plan.id,
        "level": "QUARTER",
        "title": plan.title,
        "direction": plan.direction,
        "thesis": plan.thesis,
        "rebalancing_ratio": plan.rebalancing_ratio,
        "strategy_coverage": plan.strategy_coverage,
        "strategies": {
            "buy": plan.buy_strategy,
            "sell": plan.sell_strategy,
            "sideways": plan.sideways_strategy,
            "stop_loss": plan.stop_loss_strategy,
        },
        "target_return_ratio": num(plan.target_return_ratio),
        "stop_loss_ratio": num(plan.stop_loss_ratio),
        "valid_from": plan.valid_from,
        "valid_until": plan.valid_until,
        **labels(plan, "direction"),
        "children": monthly_nodes,
    }


def _annual_node(plan: AnnualInvestmentPlan, quarterly_nodes: list[dict]) -> dict:
    return {
        "id": plan.id,
        "level": "YEAR",
        "title": plan.title,
        "market": plan.market,
        "direction": plan.direction,
        "status": plan.status,
        "thesis": plan.thesis,
        "target_return_ratio": num(plan.target_return_ratio),
        "stop_loss_ratio": num(plan.stop_loss_ratio),
        "valid_from": plan.valid_from,
        "valid_until": plan.valid_until,
        **labels(plan, "market", "direction", "status"),
        "account": {
            "id": plan.account_id,
            "broker_name": plan.account.broker_name,
            "account_number": plan.account.masked_account_number,
        }
        if plan.account_id
        else None,
        "children": quarterly_nodes,
    }


def build_cascade(
    on: date | None = None,
    account_id: int | None = None,
    only_active: bool = True,
) -> dict:
    """계획 트리를 통째로 조립한다.

    on          기준일. 이 날짜에 유효한 계획만 담는다(only_active=True 일 때).
    account_id  증권사계좌로 좁힌다. None 이면 전체.
    only_active False 면 기간을 무시하고 전부 담는다(과거 계획 열람용).
    """
    on = on or today()

    annual_qs = AnnualInvestmentPlan.objects.select_related("account")
    if account_id:
        annual_qs = annual_qs.filter(account_id=account_id)
    if only_active:
        annual_qs = annual_qs.filter(active_on(on=on))
    annual_plans = list(annual_qs.order_by("-valid_from"))

    # 주계획은 종목으로 붙일 것이라 한 번에 다 읽어 종목별로 쌓아 둔다.
    weekly_qs = WeeklyInvestmentPlan.objects.select_related("security").prefetch_related(
        "daily_plans"
    )
    if only_active:
        weekly_qs = weekly_qs.filter(active_on(on=on))
    weekly_plans = list(weekly_qs.order_by("-valid_from"))

    weekly_by_security: dict[int, list[WeeklyInvestmentPlan]] = {}
    for wp in weekly_plans:
        if wp.security_id:
            weekly_by_security.setdefault(wp.security_id, []).append(wp)

    attached_weekly_ids: set[int] = set()
    tree = []

    for annual in annual_plans:
        quarterly_qs = annual.quarterly_plans.filter(is_deleted=False)
        if only_active:
            quarterly_qs = quarterly_qs.filter(active_on(on=on))
        quarterly_nodes = []

        for quarterly in quarterly_qs.order_by("valid_from"):
            monthly_qs = quarterly.monthly_plans.filter(is_deleted=False).prefetch_related(
                "principles__security"
            )
            if only_active:
                monthly_qs = monthly_qs.filter(active_on(on=on))
            monthly_nodes = []

            for monthly in monthly_qs.order_by("valid_from", "scenario_planning"):
                securities = [
                    p.security
                    for p in monthly.principles.all()
                    if not p.is_deleted and p.security_id
                ]
                weekly_nodes = []
                for security in securities:
                    for wp in weekly_by_security.get(security.id, []):
                        # 월계획 기간과 겹치는 주계획만 이 월계획 밑으로 붙인다.
                        if not (
                            wp.valid_from <= monthly.valid_until
                            and wp.valid_until >= monthly.valid_from
                        ):
                            continue
                        attached_weekly_ids.add(wp.id)
                        dailies = [d for d in wp.daily_plans.all() if not d.is_deleted]
                        if only_active:
                            dailies = [d for d in dailies if d.is_active_on(on)]
                        dailies.sort(key=lambda d: d.valid_from)
                        weekly_nodes.append(_weekly_node(wp, dailies))

                monthly_nodes.append(_monthly_node(monthly, weekly_nodes, securities))

            quarterly_nodes.append(_quarterly_node(quarterly, monthly_nodes))

        tree.append(_annual_node(annual, quarterly_nodes))

    orphans = [
        {
            "id": wp.id,
            "title": wp.title,
            "security": _security_brief(wp.security),
            "valid_from": wp.valid_from,
            "valid_until": wp.valid_until,
            "reason": (
                "종목이 지정되지 않았다"
                if not wp.security_id
                else "이 종목을 가리키는 월투자원칙이 없거나 기간이 겹치지 않는다"
            ),
        }
        for wp in weekly_plans
        if wp.id not in attached_weekly_ids
    ]

    return {
        "as_of": on,
        "account_id": account_id,
        "only_active": only_active,
        "tree": tree,
        # 어느 월계획에도 못 붙은 주계획. 계층이 끊긴 지점을 화면이 그대로 보여 준다.
        "orphan_weekly_plans": orphans,
        "counts": {
            "annual": len(tree),
            "weekly_total": len(weekly_plans),
            "weekly_attached": len(attached_weekly_ids),
            "weekly_orphan": len(orphans),
        },
    }


def plans_for_security(security_id: int, on: date | None = None) -> dict:
    """한 종목에 걸린 계획을 위(연·분기·월)와 아래(주·일) 양쪽으로 훑는다.

    이행 화면에서 "이 매매가 어떤 계획 밑에 있었나"를 묻는 데 쓴다.
    """
    on = on or today()

    weekly = list(
        WeeklyInvestmentPlan.objects.filter(security_id=security_id)
        .filter(active_on(on=on))
        .prefetch_related("daily_plans")
        .order_by("-valid_from")
    )
    monthly = list(
        MonthlyInvestmentPlan.objects.filter(
            principles__security_id=security_id, principles__is_deleted=False
        )
        .filter(active_on(on=on))
        .select_related("quarterly_plan__annual_plan")
        .distinct()
        .order_by("-valid_from")
    )

    return {
        "as_of": on,
        "security_id": security_id,
        "monthly_plans": [
            {
                "id": m.id,
                "title": m.title,
                "scenario_planning": m.scenario_planning,
                "predicted_trend": m.predicted_trend,
                "confidence_score": m.confidence_score,
                "quarterly_plan_id": m.quarterly_plan_id,
                "annual_plan_id": (
                    m.quarterly_plan.annual_plan_id if m.quarterly_plan_id else None
                ),
            }
            for m in monthly
        ],
        "weekly_plans": [
            {
                "id": w.id,
                "title": w.title,
                "predicted_price": num(w.predicted_price),
                "stop_loss_price": num(w.stop_loss_price),
                "valid_from": w.valid_from,
                "valid_until": w.valid_until,
                "daily_plans": [
                    _daily_node(d) for d in w.daily_plans.all() if not d.is_deleted
                ],
            }
            for w in weekly
        ],
    }


def overlapping_monthly_plans(start: date, end: date):
    """기간이 겹치는 월계획 — 캐스케이드 밖에서도 쓰라고 열어 둔다."""
    return MonthlyInvestmentPlan.objects.filter(overlaps(start, end))
