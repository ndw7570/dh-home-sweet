"""일계획 이행 판정 — **예측추세마다 지켰다는 뜻이 다르다.**

┌──────────────────────────────────────────────────────────────────────────┐
│ ⚠ 이 모듈은 **잠정(provisional)** 이다. 통째로 버려질 수 있다.            │
│                                                                          │
│ 2026-08-13 사용자 판단: "나중에 개편해야겠다. 이 부분은 전면 삭제할 수    │
│ 있다." 규칙의 골격은 사용자가 직접 제시했지만, 횡보 기준이 실제 데이터에  │
│ 서 못 쓰는 것으로 드러나 재설계가 필요한 상태다(아래 참조).               │
│                                                                          │
│ 지우게 되면 건드릴 곳 — 이 파일 말고 네 군데뿐이다:                       │
│   1. services/__init__.py        import·__all__ 에서 fulfillment_service │
│   2. plan_execution_service.py   judge_plans 호출 + `fulfillment` 블록    │
│                                  + _acc() 의 fulfilled/broken/undecidable│
│   3. PerformancePage.jsx         "계획 이행률" 카드, 표의 "이행 판정" 칸, │
│                                  VerdictList 컴포넌트와 그 Panel          │
│   4. PerformancePage.css         .pe-verdict* 블록                       │
│ DB 스키마는 안 건드린다 — 이 판정은 저장하지 않고 조회 때마다 계산한다.   │
│ 그래서 지워도 마이그레이션이 필요 없다(daily_plan.target_fill_price 는    │
│ 판정과 별개로 쓰이므로 남긴다).                                          │
└──────────────────────────────────────────────────────────────────────────┘

**미결: 횡보 기준을 무엇에 대비해 재나.**

사용자 원문은 "매도 체결금액의 합과 매수 체결금액의 합의 차이가 매수/매도**가**의
평균의 적정한 선을 넘지 않아야 한다" 였다. `가` 를 금액으로 읽어 (a) 로 구현했는데,
**한쪽으로만 체결하면 비율이 항상 정확히 200%** 가 되어(차이=매수액, 평균=매수액/2)
허용선을 얼마로 두든 한 방향 매매는 무조건 미이행이 된다. 기준으로 못 쓴다.

2026-08-12 실데이터로 후보를 재 본 결과:

    종목          |매수−매도|   (a)금액평균   (b)가용금액   (c)순수량
    SK하이닉스     4,569,000        200%         45.7%        3.0주
    삼성전자       7,675,000        200%         76.8%       30.5주

  (a) 지금 구현. 위 이유로 폐기 대상.
  (b) 가용금액 대비 — 추천안. 한 방향이어도 정도가 갈리고, 집행률과 분모가 같아
      나란히 읽힌다. 허용선 기본값을 새로 정해야 한다(지금 20%는 (a) 기준값이라
      그대로 쓰면 안 된다).
  (c) 평균단가로 나눈 순수량 — 원문 직역. 허용선을 종목마다 따로 정해야 해 부적합.
  (d) |평균매수가 − 평균매도가| ÷ 두 단가의 평균 — 진짜 단가 기준. 횡보의 뜻에는
      가장 맞지만 **양방향 체결이 다 있어야만** 계산된다(한쪽이면 판정 불가).

사용자가 (b)~(d) 중 어느 것인지, 허용선을 얼마로 할지 아직 정하지 않았다.
정해지기 전까지 이 모듈의 횡보 판정 결과는 신뢰하지 말 것.


`execution_service` 의 표시(flag)는 이행 한 건씩 "이 매매가 계획 밖이었나" 를 본다.
여기서는 반대로 **계획 한 건씩** "그날 이 계획을 지켰나" 를 본다. 상승을 보고 세운
계획인데 그날 순매도했다면, 매매 한 건 한 건은 다 계획 안이어도 계획은 안 지킨 것이다.
그 구멍을 메우는 판정이다.

판정 단위는 일계획 하나 = (종목, 하루) 다.

규칙 (예측추세별):
  상승 UP        매수 체결금액 합 > 매도 체결금액 합
  하락 DOWN      매도 체결금액 합 > 매수 체결금액 합
  횡보 SIDEWAYS  |매수합 − 매도합| 이 두 합의 평균의 SIDEWAYS_TOLERANCE_PCT% 이내
  변동성확대     아무것도 안 했거나, 손절가에 닿기 전에(손절가보다 위에서) 팔았을 것
  VOLATILE       — 이 국면에 새로 사는 것은 이행으로 보지 않는다

**주문(ORDER)은 안 센다. 체결(FILL)만 센다.** 걸어만 두고 안 된 주문은 하지 않은
것과 같다. 계획을 지켰는지는 실제로 오간 돈으로만 판정한다.
"""

from collections import defaultdict
from datetime import date, timedelta

from trading_discipline.constants.choices import ActionType, MarketTrend, OrderSide
from trading_discipline.models import DailyInvestmentPlan, Order
from trading_discipline.services._common import num, pct, today
from trading_discipline.services.execution_service import EFFECTIVE_DATE

#: 횡보 계획에서 매수합과 매도합이 이만큼까지 벌어지는 것은 균형으로 본다(%).
#:
#: ⚠ 이 값은 **의미가 없다.** 위 모듈 주석의 (a) 기준이 한 방향 매매에서 늘 200%
#: 를 내기 때문에, 20 이든 50 이든 결과가 같다. 기준을 (b)~(d) 중 하나로 바꿀 때
#: 허용선도 같이 새로 정해야 한다. 지금 값은 자리만 잡아 둔 것이다.
SIDEWAYS_TOLERANCE_PCT = 20.0

#: 판정 결과.
FULFILLED = "FULFILLED"  # 이행
BROKEN = "BROKEN"  # 미이행
UNDECIDABLE = "UNDECIDABLE"  # 판정 불가 (추세나 손절가가 없어 규칙을 못 건다)

VERDICT_LABEL = {
    FULFILLED: "이행",
    BROKEN: "미이행",
    UNDECIDABLE: "판정 불가",
}


def _won(v) -> str:
    """판정 이유에 찍히는 금액. 사람이 읽는 문장이라 콤마와 단위를 붙인다.
    `num()` 이 내는 `4569000.0` 같은 raw float 을 그대로 찍으면 자릿수를 눈으로
    세게 되고, 단위가 없어 금액인지 단가인지도 구분이 안 된다."""
    if v is None:
        return "—"
    return f"{float(v):,.0f}원"


def _fill_stats(orders: list[Order]) -> dict:
    """체결만 모아 매수/매도 금액과 가중평균 단가를 낸다."""
    buy_amount = sell_amount = 0.0
    buy_qty = sell_qty = 0
    sell_prices: list[float] = []
    buy_count = sell_count = 0

    for o in orders:
        if o.action_type != ActionType.FILL:
            continue
        amount = float(o.notional) if o.notional is not None else 0.0
        qty = o.quantity or 0
        if o.side == OrderSide.BUY:
            buy_amount += amount
            buy_qty += qty
            buy_count += 1
        elif o.side == OrderSide.SELL:
            sell_amount += amount
            sell_qty += qty
            sell_count += 1
            if o.limit_price is not None:
                sell_prices.append(float(o.limit_price))

    return {
        "buy_amount": buy_amount,
        "sell_amount": sell_amount,
        "buy_count": buy_count,
        "sell_count": sell_count,
        "fill_count": buy_count + sell_count,
        # 가중평균 — 단순평균을 쓰면 1주 체결과 100주 체결이 같은 무게가 된다.
        "avg_buy_price": (buy_amount / buy_qty) if buy_qty else None,
        "avg_sell_price": (sell_amount / sell_qty) if sell_qty else None,
        "_sell_prices": sell_prices,
    }


def _judge(plan: DailyInvestmentPlan, s: dict) -> tuple[str, str]:
    """(판정, 이유). 이유는 화면에 그대로 찍는다 — 판정만 던지면 왜인지 못 되짚는다."""
    trend = plan.predicted_trend
    buy, sell = s["buy_amount"], s["sell_amount"]
    gap = abs(buy - sell)

    if not trend:
        return UNDECIDABLE, "예측추세가 없어 어떤 기준을 걸지 정할 수 없다."

    # 아래 문장에 찍히는 금액은 전부 **체결 금액 합**이다. 단가가 아니다.
    amounts = f"매수 체결 {_won(buy)} · 매도 체결 {_won(sell)}"

    if trend == MarketTrend.UP:
        if buy > sell:
            return FULFILLED, f"상승 계획 — {amounts}. 매수가 더 크다."
        if s["fill_count"] == 0:
            return BROKEN, "상승 계획인데 그날 체결이 없다. 사기로 해 놓고 안 샀다."
        return BROKEN, f"상승 계획인데 {amounts}. 매수가 매도를 넘지 못했다."

    if trend == MarketTrend.DOWN:
        if sell > buy:
            return FULFILLED, f"하락 계획 — {amounts}. 매도가 더 크다."
        if s["fill_count"] == 0:
            return BROKEN, "하락 계획인데 그날 체결이 없다. 줄이기로 해 놓고 안 줄였다."
        return BROKEN, f"하락 계획인데 {amounts}. 매도가 매수를 넘지 못했다."

    if trend == MarketTrend.SIDEWAYS:
        mean = (buy + sell) / 2
        allowed = mean * SIDEWAYS_TOLERANCE_PCT / 100
        if s["fill_count"] == 0:
            return FULFILLED, "횡보 계획 — 체결이 없어 한쪽으로 기울지 않았다."
        basis = (
            f"두 금액의 평균 {_won(mean)} 의 {SIDEWAYS_TOLERANCE_PCT}% = {_won(allowed)}"
        )
        if gap <= allowed:
            return FULFILLED, f"횡보 계획 — {amounts}. 차이 {_won(gap)}, 기준({basis}) 이내."
        return (
            BROKEN,
            f"횡보 계획인데 {amounts}. 차이 {_won(gap)} 로 기준({basis})을 넘는다. "
            "한쪽으로 기울었다.",
        )

    if trend == MarketTrend.VOLATILE:
        if s["fill_count"] == 0:
            return FULFILLED, "변동성 확대 — 아무것도 하지 않았다."
        if s["buy_count"]:
            return BROKEN, "변동성 확대 국면에 새로 매수했다."
        stop = plan.stop_loss_price
        if stop is None:
            return UNDECIDABLE, "변동성 확대인데 손절가가 없어 '손절 전에 팔았나'를 못 잰다."
        stop = float(stop)
        below = [p for p in s["_sell_prices"] if p <= stop]
        if below:
            return (
                BROKEN,
                f"손절가 {_won(stop)} 이하에서 매도한 체결이 {len(below)}건 있다. "
                "손절선을 지나서 팔았다.",
            )
        return FULFILLED, f"변동성 확대 — 손절가 {_won(stop)} 위에서 정리했다."

    return UNDECIDABLE, f"모르는 예측추세({trend})다."


def judge_plans(
    date_from: date | None = None,
    date_to: date | None = None,
    security_id: int | None = None,
) -> list[dict]:
    """기간 안의 일계획을 하나씩 그날 체결과 맞춰 판정한다.

    반환은 계획 한 건 = 한 줄. 집계는 `plan_execution_service` 가 이걸 접어서 쓴다.
    """
    date_to = date_to or today()
    date_from = date_from or (date_to - timedelta(days=29))

    plan_qs = DailyInvestmentPlan.objects.select_related(
        "weekly_security_plan__security"
    ).filter(valid_from__lte=date_to, valid_until__gte=date_from)
    if security_id:
        plan_qs = plan_qs.filter(weekly_security_plan__security_id=security_id)
    plans = [p for p in plan_qs if date_from <= p.valid_from <= date_to]
    if not plans:
        return []

    # 그날 그 종목의 체결을 한 번에 끌어와 (종목, 날짜) 로 묶는다.
    order_qs = (
        Order.objects.annotate(effective_date=EFFECTIVE_DATE)
        .filter(
            effective_date__gte=date_from,
            effective_date__lte=date_to,
            action_type=ActionType.FILL,
        )
        .select_related("security")
    )
    if security_id:
        order_qs = order_qs.filter(security_id=security_id)

    by_key: dict[tuple[int, date], list[Order]] = defaultdict(list)
    for o in order_qs:
        if o.security_id:
            by_key[(o.security_id, o.effective_date)].append(o)

    rows = []
    for plan in sorted(plans, key=lambda p: (p.valid_from, p.id), reverse=True):
        security = plan.security
        stats = _fill_stats(by_key.get((security.id, plan.valid_from), []) if security else [])
        verdict, reason = _judge(plan, stats)

        # 목표체결가 대비 — 내가 걸겠다고 한 자리에서 실제로 체결됐나.
        # 매수는 목표보다 위면 비싸게 산 것이고(+), 매도는 목표보다 아래면 싸게 판 것이다(−).
        target = float(plan.target_fill_price) if plan.target_fill_price is not None else None
        buy_gap = (
            (stats["avg_buy_price"] / target - 1) * 100
            if target and stats["avg_buy_price"]
            else None
        )
        sell_gap = (
            (stats["avg_sell_price"] / target - 1) * 100
            if target and stats["avg_sell_price"]
            else None
        )

        rows.append(
            {
                "plan_id": plan.id,
                "title": plan.title,
                "date": plan.valid_from,
                "security": (
                    {"id": security.id, "symbol": security.symbol, "name": security.name}
                    if security
                    else None
                ),
                "predicted_trend": plan.predicted_trend,
                "predicted_trend_label": plan.get_predicted_trend_display(),
                "scenario_planning": plan.scenario_planning,
                "predicted_price": num(plan.predicted_price),
                "target_fill_price": num(plan.target_fill_price),
                "stop_loss_price": num(plan.stop_loss_price),
                "buy_amount": stats["buy_amount"] or None,
                "sell_amount": stats["sell_amount"] or None,
                "fill_count": stats["fill_count"],
                "avg_buy_price": stats["avg_buy_price"],
                "avg_sell_price": stats["avg_sell_price"],
                "target_gap_buy_pct": round(buy_gap, 2) if buy_gap is not None else None,
                "target_gap_sell_pct": round(sell_gap, 2) if sell_gap is not None else None,
                "verdict": verdict,
                "verdict_label": VERDICT_LABEL[verdict],
                "reason": reason,
            }
        )
    return rows


def summarize(rows: list[dict]) -> dict:
    """판정 줄들을 이행률로 접는다. 분모는 **판정 가능한 것만** — 규칙을 못 건 계획을
    분모에 넣으면 손절가 안 적은 것이 이행률을 깎는다."""
    fulfilled = sum(1 for r in rows if r["verdict"] == FULFILLED)
    broken = sum(1 for r in rows if r["verdict"] == BROKEN)
    undecidable = sum(1 for r in rows if r["verdict"] == UNDECIDABLE)
    judged = fulfilled + broken
    return {
        "plan_count": len(rows),
        "fulfilled": fulfilled,
        "broken": broken,
        "undecidable": undecidable,
        "fulfillment_rate": pct(fulfilled, judged) if judged else None,
    }
