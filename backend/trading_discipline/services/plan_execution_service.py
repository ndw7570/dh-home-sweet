"""계획 대비 이행 — 하루 단위와 주 단위로 **숫자만** 센다.

`/execution/compare/` 는 이행 한 건씩 계획과 맞춰 보는 화면이다. 건별로 보면
"그날 전체로는 계획대로 했나" 가 안 보인다. 여기서는 같은 재료를 구간으로 접어
"계획한 만큼 했나 / 계획 밖으로 샌 게 얼마나 되나" 를 숫자로 답한다.

두 축을 따로 두는 이유:
  일별  하루가 판단의 단위다. 그날 계획을 세웠는지, 그날 실제로 뭘 했는지.
  주별  **돈의 단위는 주**다. 가용금액이 종목별 주계획에 있어서, "쓰기로 한 돈 중
        얼마나 썼나(집행률)" 는 주 단위에서만 성립한다.

그래서 집행률은 주별에만 있다. 일별에도 같은 칸을 만들어 주 예산을 하루에 갖다
대면 매일 "예산의 20% 만 썼다" 같은 숫자가 나오는데, 그건 사실이 아니다.

각 구간은 **종목별로 쪼갠 줄**을 함께 들고 있다. 구간 합계만 보면 "그날 준수율
50%" 까지는 알아도 어느 종목에서 샜는지를 모른다. 고칠 곳을 찾으려면 종목까지
내려가야 한다.
"""

from collections import defaultdict
from datetime import date, timedelta

from trading_discipline.constants.choices import ActionType, OrderSide
from trading_discipline.models import DailyInvestmentPlan, Order, WeeklySecurityInvestmentPlan
from trading_discipline.services import fulfillment_service
from trading_discipline.services._common import pct, today
from trading_discipline.services.execution_service import (
    EFFECTIVE_DATE,
    _flags_for,
    _plans_covering,
)

BUCKETS = ("DAY", "WEEK")

#: 종목이 안 붙은 이행·계획을 모으는 자리. 숨기면 합계가 안 맞아 보인다.
NO_SECURITY = 0


def _week_start(d: date) -> date:
    """그 주의 일요일. PlanTimetable(화면)이 주를 일~토로 묶는 것과 같은 관습이다.
    두 화면이 다른 요일로 주를 끊으면 같은 매매가 다른 주에 잡혀 대조가 안 된다."""
    return d - timedelta(days=(d.weekday() + 1) % 7)


def _bucket_of(d: date, bucket: str) -> date:
    return d if bucket == "DAY" else _week_start(d)


def _bucket_end(start: date, bucket: str) -> date:
    return start if bucket == "DAY" else start + timedelta(days=6)


def _label(start: date, bucket: str) -> str:
    if bucket == "DAY":
        return f"{start:%Y-%m-%d}"
    return f"{start:%Y-%m-%d} ~ {_bucket_end(start, bucket):%Y-%m-%d}"


def _acc() -> dict:
    """한 칸(구간 전체 또는 구간×종목)의 누적기."""
    return {
        "daily_count": 0,
        "security_plan_count": 0,
        "available_amount": 0.0,
        "total_count": 0,
        "fill_count": 0,
        "order_count": 0,
        "flagged_count": 0,
        "planned_count": 0,
        "buy_amount": 0.0,
        "sell_amount": 0.0,
        "gap_sum": 0.0,
        "gap_n": 0,
        # 목표체결가 대비 — 내가 걸겠다고 한 자리에서 체결됐나(매수 기준).
        "tgap_sum": 0.0,
        "tgap_n": 0,
        # 일계획 이행 판정(추세별 규칙). fulfillment_service 가 낸 결과를 접어 담는다.
        "fulfilled": 0,
        "broken": 0,
        "undecidable": 0,
    }


def _empty_bucket() -> dict:
    return {
        "agg": _acc(),
        "by_security": defaultdict(_acc),
        "securities": {},
    }


def _brief(security) -> dict:
    return {"id": security.id, "symbol": security.symbol, "name": security.name}


class _SecurityRef:
    """이미 dict 로 눌러 둔 종목을 `touch()` 에 넘기기 위한 얇은 껍데기.
    (판정 결과는 모델이 아니라 dict 로 오는데, touch 는 .id/.symbol/.name 을 본다)"""

    __slots__ = ("id", "symbol", "name")

    def __init__(self, brief: dict):
        self.id = brief["id"]
        self.symbol = brief["symbol"]
        self.name = brief["name"]


def compare_buckets(
    bucket: str = "DAY",
    date_from: date | None = None,
    date_to: date | None = None,
    security_id: int | None = None,
) -> dict:
    """구간별 계획/이행 집계. 각 구간 안에 종목별 내역이 함께 들어간다.

    bucket      "DAY" | "WEEK"
    date_from~to 이행일(executed_at) 과 계획일 둘 다 이 범위로 자른다.
    security_id 종목 하나로 좁힌다. None 이면 전체.
    """
    bucket = bucket if bucket in BUCKETS else "DAY"
    date_to = date_to or today()
    date_from = date_from or (date_to - timedelta(days=29))

    rows: dict[date, dict] = defaultdict(_empty_bucket)

    def touch(on: date, security) -> tuple[dict, dict]:
        """그 구간의 (전체 누적기, 종목 누적기) 를 꺼낸다."""
        row = rows[_bucket_of(on, bucket)]
        sid = security.id if security else NO_SECURITY
        if security:
            row["securities"][sid] = _brief(security)
        return row["agg"], row["by_security"][sid]

    # ── 이행 ────────────────────────────────────────────
    # 대조 기준은 `/execution/compare/` 와 같다 — 생성일이 아니라 이행일.
    order_qs = (
        Order.objects.select_related("security")
        .annotate(effective_date=EFFECTIVE_DATE)
        .filter(effective_date__gte=date_from, effective_date__lte=date_to)
        .exclude(action_type=ActionType.PLAN)
    )
    if security_id:
        order_qs = order_qs.filter(security_id=security_id)

    plan_cache: dict[tuple[int, date], list[dict]] = {}

    for order in order_qs:
        on = order.effective_date
        cells = touch(on, order.security if order.security_id else None)

        plans: list[dict] = []
        if order.security_id:
            key = (order.security_id, on)
            if key not in plan_cache:
                plan_cache[key] = _plans_covering(order.security_id, on)
            plans = plan_cache[key]

        flags = _flags_for(order, plans)
        amount = float(order.notional) if order.notional is not None else 0.0

        # 예상가 대비 체결가가 어디쯤이었나. 매수만 센다 — 매도는 예상가가 목표가라
        # 넘겨 파는 것이 정상이고, 같이 평균 내면 서로를 지운다.
        gap = None
        tgap = None
        if (
            order.action_type == ActionType.FILL
            and order.side == OrderSide.BUY
            and order.limit_price is not None
        ):
            price = float(order.limit_price)
            targets = [p["predicted_price"] for p in plans if p["predicted_price"]]
            if targets:
                gap = (price / float(max(targets)) - 1) * 100
            # 목표체결가는 일계획에만 있다. 여러 시나리오가 걸리면 가장 낮은 목표를
            # 쓴다 — 예상가는 max(관대) 지만 목표체결가는 "여기 아래에서 사겠다" 는
            # 약속이라, 가장 엄한 쪽으로 재야 지켰는지가 드러난다.
            tfills = [p["target_fill_price"] for p in plans if p.get("target_fill_price")]
            if tfills:
                tgap = (price / float(min(tfills)) - 1) * 100

        for cell in cells:
            cell["total_count"] += 1
            if flags:
                cell["flagged_count"] += 1
            if plans:
                cell["planned_count"] += 1
            if order.action_type == ActionType.FILL:
                cell["fill_count"] += 1
                if order.side == OrderSide.BUY:
                    cell["buy_amount"] += amount
                elif order.side == OrderSide.SELL:
                    cell["sell_amount"] += amount
                if gap is not None:
                    cell["gap_sum"] += gap
                    cell["gap_n"] += 1
                if tgap is not None:
                    cell["tgap_sum"] += tgap
                    cell["tgap_n"] += 1
            elif order.action_type == ActionType.ORDER:
                cell["order_count"] += 1

    # ── 계획: 일계획 ────────────────────────────────────
    daily_qs = DailyInvestmentPlan.objects.select_related(
        "weekly_security_plan__security"
    ).filter(valid_from__lte=date_to, valid_until__gte=date_from)
    if security_id:
        daily_qs = daily_qs.filter(weekly_security_plan__security_id=security_id)

    for plan in daily_qs:
        on = plan.valid_from
        if not (date_from <= on <= date_to):
            continue
        for cell in touch(on, plan.security):
            cell["daily_count"] += 1

    # ── 일계획 이행 판정(추세별 규칙) ───────────────────
    # 표시(flag)가 "이 매매가 계획 밖이었나" 라면, 이쪽은 "그날 이 계획을 지켰나" 다.
    # 매매 한 건씩은 다 계획 안이어도 상승 계획인 날 순매도했으면 계획은 안 지킨 것이다.
    #
    # ⚠ fulfillment_service 는 잠정 모듈이다 — 통째로 빠질 수 있다. 지울 때는 이
    # 블록과 `_numbers()` 의 "fulfillment" 키, `_acc()` 의 fulfilled/broken/
    # undecidable 세 칸, 그리고 반환 dict 의 "verdicts"/"sideways_tolerance_pct"
    # 만 걷어내면 나머지 집계는 그대로 산다. 자세한 사정은 그 모듈 상단 주석 참조.
    verdicts = fulfillment_service.judge_plans(
        date_from=date_from, date_to=date_to, security_id=security_id
    )
    verdict_rows: dict[date, list[dict]] = defaultdict(list)
    for v in verdicts:
        on = v["date"]
        verdict_rows[_bucket_of(on, bucket)].append(v)
        sec = v["security"]
        for cell in touch(on, _SecurityRef(sec) if sec else None):
            if v["verdict"] == fulfillment_service.FULFILLED:
                cell["fulfilled"] += 1
            elif v["verdict"] == fulfillment_service.BROKEN:
                cell["broken"] += 1
            else:
                cell["undecidable"] += 1

    # ── 계획: 종목별 주계획(가용금액) ───────────────────
    # 주 단위 예산이라 주별 집계에만 넣는다. 소속 주는 상위 주계획의 시작일로 정한다
    # — 계획 기간이 일~토 경계를 넘어도 한 주에만 잡히게 하려는 것이다.
    if bucket == "WEEK":
        wsp_qs = WeeklySecurityInvestmentPlan.objects.select_related(
            "weekly_plan", "security"
        ).filter(
            weekly_plan__valid_from__lte=date_to,
            weekly_plan__valid_until__gte=date_from,
            weekly_plan__is_deleted=False,
        )
        if security_id:
            wsp_qs = wsp_qs.filter(security_id=security_id)

        for sp in wsp_qs:
            start = sp.weekly_plan.valid_from if sp.weekly_plan_id else None
            if not start:
                continue
            for cell in touch(start, sp.security if sp.security_id else None):
                cell["security_plan_count"] += 1
                if sp.available_amount is not None:
                    cell["available_amount"] += float(sp.available_amount)

    out = [
        _finalize(start, bucket, row, verdict_rows.get(start, []))
        for start, row in sorted(rows.items(), reverse=True)
    ]
    return {
        "bucket": bucket,
        "date_from": date_from,
        "date_to": date_to,
        "security_id": security_id,
        "sideways_tolerance_pct": fulfillment_service.SIDEWAYS_TOLERANCE_PCT,
        "buckets": out,
        # 계획 한 건씩의 판정. 화면이 "왜 미이행인지" 를 그대로 보여 줄 수 있어야 한다.
        "verdicts": verdicts,
        "totals": {**_totals(out, bucket), **fulfillment_service.summarize(verdicts)},
    }


def _numbers(cell: dict, bucket: str) -> dict:
    """누적기 하나를 화면이 쓰는 모양으로. 구간 전체 줄과 종목 줄이 같은 모양이라
    화면이 한 컴포넌트로 둘 다 그린다."""
    total = cell["total_count"]
    available = cell["available_amount"]
    return {
        "plan": {
            "daily_count": cell["daily_count"],
            # 주 단위 예산이라 일별에는 없다. 0 이 아니라 None 이어야 화면이
            # "계획한 돈이 0원" 과 "이 축에서는 셀 수 없음" 을 구분해 그린다.
            "security_plan_count": cell["security_plan_count"] if bucket == "WEEK" else None,
            "available_amount": (available or None) if bucket == "WEEK" else None,
        },
        "execution": {
            "total_count": total,
            "fill_count": cell["fill_count"],
            "order_count": cell["order_count"],
            "buy_amount": cell["buy_amount"] or None,
            "sell_amount": cell["sell_amount"] or None,
            "net_amount": (cell["buy_amount"] - cell["sell_amount"]) or None,
        },
        "compare": {
            # 쓰기로 한 돈 중 실제로 산 비율. 주별에만 성립한다.
            "execution_rate": pct(cell["buy_amount"], available) if available else None,
            # 이행 중 계획에 걸린 비율. 낮으면 계획 밖에서 움직인 것이다.
            "planned_count": cell["planned_count"],
            "planned_ratio": pct(cell["planned_count"], total) if total else None,
            # 표시(flag) 없이 넘어간 비율.
            "discipline_rate": pct(total - cell["flagged_count"], total) if total else None,
            "flagged_count": cell["flagged_count"],
            # 매수 체결가가 예상가보다 몇 % 위/아래였나. 양수면 비싸게 샀다.
            "avg_price_gap_pct": (
                round(cell["gap_sum"] / cell["gap_n"], 2) if cell["gap_n"] else None
            ),
            # 목표체결가 대비. 양수면 걸겠다고 한 자리보다 위에서 샀다.
            "avg_target_gap_pct": (
                round(cell["tgap_sum"] / cell["tgap_n"], 2) if cell["tgap_n"] else None
            ),
        },
        # 추세별 규칙으로 본 일계획 이행. 분모는 판정 가능한 것만 —
        # 규칙을 못 건 계획(추세·손절가 없음)을 분모에 넣으면 안 적은 것이 비율을 깎는다.
        "fulfillment": {
            "fulfilled": cell["fulfilled"],
            "broken": cell["broken"],
            "undecidable": cell["undecidable"],
            "rate": (
                pct(cell["fulfilled"], cell["fulfilled"] + cell["broken"])
                if (cell["fulfilled"] + cell["broken"])
                else None
            ),
        },
    }


def _finalize(start: date, bucket: str, row: dict, verdicts: list[dict]) -> dict:
    securities = []
    for sid, cell in row["by_security"].items():
        brief = row["securities"].get(sid)
        securities.append(
            {
                "security": brief,
                # 종목이 안 붙은 이행·계획도 줄로 남긴다. 빼 버리면 종목 줄의 합이
                # 구간 합계와 안 맞아서 화면이 틀린 것처럼 보인다.
                "label": f"{brief['name']} {brief['symbol']}" if brief else "종목 미지정",
                **_numbers(cell, bucket),
            }
        )
    # 움직임이 큰 종목부터. 이행이 없으면 계획 수로 민다.
    securities.sort(
        key=lambda s: (
            s["execution"]["buy_amount"] or 0,
            s["execution"]["total_count"],
            s["plan"]["daily_count"],
        ),
        reverse=True,
    )

    return {
        "key": f"{start:%Y-%m-%d}",
        "period_start": start,
        "period_end": _bucket_end(start, bucket),
        "label": _label(start, bucket),
        **_numbers(row["agg"], bucket),
        "securities": securities,
        # 이 구간에 걸린 일계획 판정. 미이행이 먼저 오게 둔다 — 고칠 것이 위로.
        "verdicts": sorted(
            verdicts,
            key=lambda v: (v["verdict"] != fulfillment_service.BROKEN, v["date"]),
        ),
    }


def _totals(buckets: list[dict], bucket: str) -> dict:
    """구간 합계. 비율은 합을 다시 나눠 구한다 — 구간별 비율을 평균 내면
    이행이 1건인 날과 20건인 날이 같은 무게가 돼 숫자가 거짓말을 한다."""
    total = sum(b["execution"]["total_count"] for b in buckets)
    flagged = sum(b["compare"]["flagged_count"] for b in buckets)
    buy = sum(b["execution"]["buy_amount"] or 0 for b in buckets)
    sell = sum(b["execution"]["sell_amount"] or 0 for b in buckets)
    available = sum(b["plan"]["available_amount"] or 0 for b in buckets)
    # 건수를 그대로 더한다. 구간별 비율에서 역산하면 반올림 오차가 쌓여
    # 합계가 100% 를 넘거나 모자라는 숫자가 나온다.
    planned = sum(b["compare"]["planned_count"] for b in buckets)
    gaps = [
        b["compare"]["avg_price_gap_pct"]
        for b in buckets
        if b["compare"]["avg_price_gap_pct"] is not None
    ]
    tgaps = [
        b["compare"]["avg_target_gap_pct"]
        for b in buckets
        if b["compare"]["avg_target_gap_pct"] is not None
    ]

    return {
        "bucket_count": len(buckets),
        # 계획도 이행도 없는 구간은 애초에 행이 안 생긴다. 둘 중 하나라도 있는 구간 중
        # 계획이 없던 구간이 몇 개인지가 "계획 없이 움직인 날" 이다.
        "planless_bucket_count": sum(
            1
            for b in buckets
            if b["execution"]["total_count"] > 0 and b["plan"]["daily_count"] == 0
        ),
        "daily_plan_count": sum(b["plan"]["daily_count"] for b in buckets),
        "security_count": len(
            {
                s["security"]["id"]
                for b in buckets
                for s in b["securities"]
                if s["security"]
            }
        ),
        "order_count": total,
        "flagged_count": flagged,
        "buy_amount": buy or None,
        "sell_amount": sell or None,
        "net_amount": (buy - sell) or None,
        "available_amount": (available or None) if bucket == "WEEK" else None,
        "execution_rate": pct(buy, available) if available else None,
        "planned_ratio": pct(planned, total) if total else None,
        "discipline_rate": pct(total - flagged, total) if total else None,
        "avg_price_gap_pct": round(sum(gaps) / len(gaps), 2) if gaps else None,
        "avg_target_gap_pct": round(sum(tgaps) / len(tgaps), 2) if tgaps else None,
    }
