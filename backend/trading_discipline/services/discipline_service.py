"""오늘의 규율 — 홈 화면이 통째로 받아 가는 하나의 응답.

이 프로그램은 '조회' 가 아니라 '규율' 이 목적이다. 그래서 홈은 잔고를 먼저 보여 주지 않고
**오늘 지켜야 할 것 → 지금 깨져 있는 것 → 아직 안 적은 것** 순으로 민다.

  1. 필수원칙          협상 대상이 아닌 것들. 맨 위에 고정.
  2. 오늘의 계획        오늘 유효한 일계획(없으면 주계획)
  3. 경고              담보비율·만기 — 계획보다 먼저 오는 것들
  4. 빈칸              전략 문장 미기재, 월원칙 없는 월계획, 손절가 없는 주계획
  5. 유효한 AI 의견     만료 안 된 것만

4번이 핵심이다. 계획을 세우다 만 자리를 화면이 계속 물고 늘어져야 루프가 돈다.
"""

from datetime import date, timedelta

from django.db.models import Q

from trading_discipline.models import (
    AiDecisionFeedback,
    MandatoryPrinciple,
    MonthlyInvestmentPlan,
    Order,
    QuarterlyInvestmentPlan,
    SecuritiesLoan,
    WeeklySecurityInvestmentPlan,
)
from trading_discipline.services._common import active_on, labels, num, today

#: 담보비율이 이 아래로 내려가면 경고. 증권사 반대매매 기준보다 여유를 둔 값이다.
COLLATERAL_WARN_RATIO = 140
#: 만기가 이 안쪽이면 경고.
MATURITY_WARN_DAYS = 30


def _mandatory_principles() -> list[dict]:
    return [
        {"id": p.id, "priority": p.priority, "content": p.content}
        for p in MandatoryPrinciple.objects.all().order_by("priority", "id")
    ]


def _today_plans(on: date) -> dict:
    from trading_discipline.models import DailyInvestmentPlan

    dailies = (
        DailyInvestmentPlan.objects.filter(active_on(on=on))
        .select_related("weekly_security_plan__security")
        .order_by("weekly_security_plan_id", "scenario_planning")
    )
    # 주계획 자체는 이제 기간 그룹만이라 종목·가격이 없다. 화면에 뿌릴 "오늘 유효한 주계획"은
    # 종목이 붙은 WeeklySecurityInvestmentPlan 을 그 소속 주계획의 유효기간으로 걸러 뽑는다.
    weekly_securities = (
        WeeklySecurityInvestmentPlan.objects.filter(
            weekly_plan__valid_from__lte=on,
            weekly_plan__valid_until__gte=on,
            weekly_plan__is_deleted=False,
        )
        .select_related("security", "weekly_plan")
        .order_by("security_id", "scenario_planning")
    )
    return {
        "daily": [
            {
                "id": d.id,
                "title": d.title,
                "scenario_planning": d.scenario_planning,
                "predicted_trend": d.predicted_trend,
                "confidence_score": d.confidence_score,
                "predicted_price": num(d.predicted_price),
                "stop_loss_price": num(d.stop_loss_price),
                "thesis": d.thesis,
                **labels(d, "scenario_planning", "predicted_trend"),
                "security": (
                    {
                        "id": d.security.id,
                        "symbol": d.security.symbol,
                        "name": d.security.name,
                        "current_price": num(d.security.current_price),
                    }
                    if d.security
                    else None
                ),
            }
            for d in dailies
        ],
        "weekly": [
            {
                "id": w.id,
                "title": w.title,
                "scenario_planning": w.scenario_planning,
                "predicted_trend": w.predicted_trend,
                "confidence_score": w.confidence_score,
                "predicted_price": num(w.predicted_price),
                "stop_loss_price": num(w.stop_loss_price),
                "available_amount": num(w.available_amount),
                "thesis": w.thesis,
                **labels(w, "scenario_planning", "predicted_trend"),
                "security": (
                    {
                        "id": w.security.id,
                        "symbol": w.security.symbol,
                        "name": w.security.name,
                        "current_price": num(w.security.current_price),
                    }
                    if w.security_id
                    else None
                ),
            }
            for w in weekly_securities
        ],
    }


def _warnings(on: date) -> list[dict]:
    """계획보다 먼저 오는 것들. 담보가 무너지면 규율을 지킬 기회 자체가 없어진다."""
    out = []
    horizon = on + timedelta(days=MATURITY_WARN_DAYS)

    loans = SecuritiesLoan.objects.select_related("security").filter(
        Q(collateral_ratio__lte=COLLATERAL_WARN_RATIO) | Q(maturity_at__lte=horizon)
    )
    for loan in loans:
        reasons = []
        if loan.collateral_ratio is not None and loan.collateral_ratio <= COLLATERAL_WARN_RATIO:
            reasons.append(f"담보비율 {loan.collateral_ratio}% (경고선 {COLLATERAL_WARN_RATIO}%)")
        if loan.maturity_at and loan.maturity_at <= horizon:
            days = (loan.maturity_at - on).days
            reasons.append("만기 경과" if days < 0 else f"만기까지 {days}일")
        out.append(
            {
                "kind": "LOAN",
                "severity": "HIGH" if loan.collateral_ratio and loan.collateral_ratio <= COLLATERAL_WARN_RATIO else "MEDIUM",
                "loan_id": loan.id,
                "security": (
                    {"id": loan.security.id, "symbol": loan.security.symbol, "name": loan.security.name}
                    if loan.security_id
                    else None
                ),
                "reasons": reasons,
            }
        )

    # 손절가를 이미 뚫었는데 아직 살아 있는 주(종목별)계획
    active_security_plans = WeeklySecurityInvestmentPlan.objects.filter(
        weekly_plan__valid_from__lte=on,
        weekly_plan__valid_until__gte=on,
        weekly_plan__is_deleted=False,
    ).select_related("security")
    for sp in active_security_plans:
        price = sp.security.current_price if sp.security_id else None
        if price is not None and sp.stop_loss_price and price <= sp.stop_loss_price:
            out.append(
                {
                    "kind": "STOP_LOSS_HIT",
                    "severity": "HIGH",
                    "weekly_security_plan_id": sp.id,
                    "security": {
                        "id": sp.security.id,
                        "symbol": sp.security.symbol,
                        "name": sp.security.name,
                    },
                    "reasons": [
                        f"현재가 {num(price)} 가 손절가 {num(sp.stop_loss_price)} 이하다. "
                        "계획대로면 이미 정리했어야 한다."
                    ],
                }
            )

    return out


def _gaps(on: date) -> list[dict]:
    """계획을 세우다 만 자리. 화면이 여기를 계속 물고 늘어진다."""
    out = []

    for q in QuarterlyInvestmentPlan.objects.filter(active_on(on=on)):
        missing = [k for k, filled in q.strategy_coverage.items() if not filled]
        if missing:
            label = {
                "buy": "매수전략",
                "sell": "매도전략",
                "sideways": "횡보전략",
                "stop_loss": "손절전략",
            }
            out.append(
                {
                    "kind": "QUARTERLY_STRATEGY_MISSING",
                    "target": {"table": "quarterly_investment_plan", "id": q.id, "title": q.title},
                    "message": f"{', '.join(label[m] for m in missing)} 이 비어 있다.",
                }
            )

    for m in MonthlyInvestmentPlan.objects.filter(active_on(on=on)).prefetch_related("principles"):
        if not any(not p.is_deleted for p in m.principles.all()):
            out.append(
                {
                    "kind": "MONTHLY_PRINCIPLE_MISSING",
                    "target": {"table": "monthly_investment_plan", "id": m.id, "title": m.title},
                    "message": "월투자원칙이 없어 이 계획이 종목에 닿지 않는다. 아래 계층이 끊긴다.",
                }
            )

    incomplete = WeeklySecurityInvestmentPlan.objects.filter(
        weekly_plan__valid_from__lte=on,
        weekly_plan__valid_until__gte=on,
        weekly_plan__is_deleted=False,
    ).filter(Q(stop_loss_price__isnull=True) | Q(confidence_score__isnull=True))
    for sp in incomplete:
        missing = []
        if sp.stop_loss_price is None:
            missing.append("손절가")
        if sp.confidence_score is None:
            missing.append("확신도")
        out.append(
            {
                "kind": "WEEKLY_SECURITY_PLAN_INCOMPLETE",
                "target": {
                    "table": "weekly_security_investment_plan",
                    "id": sp.id,
                    "title": sp.title,
                },
                "message": f"{' · '.join(missing)} 가 비어 있다.",
            }
        )

    return out


def _valid_ai_feedback(on: date) -> list[dict]:
    rows = (
        AiDecisionFeedback.objects.filter(Q(valid_until__gte=on) | Q(valid_until__isnull=True))
        .select_related("model")
        .order_by("-created_at", "-id")[:10]
    )
    return [
        {
            "id": r.id,
            "opinion_type": r.opinion_type,
            **labels(r, "opinion_type"),
            "is_expired": r.is_expired,
            "table_name": r.table_name,
            "object_id": r.object_id,
            "ai_decision": r.ai_decision,
            "score": num(r.score),
            "confidence_score": num(r.confidence_score),
            "risk_summary": r.risk_summary,
            "valid_until": r.valid_until,
            "model_name": r.model.model_name if r.model_id else None,
        }
        for r in rows
    ]


def today_board(on: date | None = None) -> dict:
    """홈 화면 한 방 조회."""
    on = on or today()

    plans = _today_plans(on)
    warnings = _warnings(on)
    gaps = _gaps(on)

    today_orders = Order.objects.filter(created_at=on).select_related("security")

    return {
        "as_of": on,
        "mandatory_principles": _mandatory_principles(),
        "plans": plans,
        "warnings": warnings,
        "gaps": gaps,
        "ai_feedback": _valid_ai_feedback(on),
        "counters": {
            "daily_plan_count": len(plans["daily"]),
            "weekly_plan_count": len(plans["weekly"]),
            "warning_count": len(warnings),
            "gap_count": len(gaps),
            "order_count_today": today_orders.count(),
        },
        # 홈이 밀어 줄 행동 하나. 경고 > 빈칸 > 계획없음 순.
        "next_action": _next_action(warnings, gaps, plans),
    }


def _next_action(warnings: list, gaps: list, plans: dict) -> dict | None:
    if warnings:
        top = next((w for w in warnings if w["severity"] == "HIGH"), warnings[0])
        return {
            "kind": top["kind"],
            "message": top["reasons"][0] if top["reasons"] else "확인이 필요하다.",
            "goto": {"tab": "security"},
        }
    if gaps:
        top = gaps[0]
        return {
            "kind": top["kind"],
            "message": top["message"],
            "goto": {"tab": "plan", "focus": top["target"]},
        }
    if not plans["daily"] and not plans["weekly"]:
        return {
            "kind": "NO_PLAN_TODAY",
            "message": "오늘 유효한 계획이 없다. 계획 없이 매매하면 남는 것은 결과뿐이다.",
            "goto": {"tab": "plan"},
        }
    return None
