"""성과 집계.

`performance_records` 는 이미 계산된 결과를 담는 테이블이다(수익률·최대낙폭까지).
그래서 이 서비스는 계산이 아니라 **묶기**를 한다 — 종목별로, 기간유형별로, 비용 항목별로.

비용을 따로 세우는 이유: 수익률이 낮을 때 판단이 틀린 것인지 비용이 갉아먹은 것인지
갈라 보지 못하면, 고쳐야 할 곳을 못 찾는다.
"""

from datetime import date, timedelta

from django.db.models import Avg, Count, Sum

from trading_discipline.models import PerformanceRecord
from trading_discipline.services._common import num, pct, today

_SUM_FIELDS = (
    "realized_profit",
    "unrealized_profit",
    "dividend_income",
    "interest_cost",
    "commission",
    "tax",
    "etc_cost",
    "net_profit",
)


def summarize(
    period_type: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    security_id: int | None = None,
) -> dict:
    date_to = date_to or today()
    date_from = date_from or (date_to - timedelta(days=365))

    # 포함(containment)이 아니라 겹침(overlap)으로 고른다.
    # `period_end <= date_to` 로 잡으면 이번 달 레코드(종료일이 월말)가 오늘 기준 조회에서
    # 통째로 빠져 나간다. 진행 중인 기간이 안 보이는 성과 화면은 쓸모가 없다.
    qs = PerformanceRecord.objects.select_related("security").filter(
        period_start__lte=date_to, period_end__gte=date_from
    )
    if period_type:
        qs = qs.filter(period_type=period_type)
    if security_id:
        qs = qs.filter(security_id=security_id)

    totals = qs.aggregate(
        **{f: Sum(f) for f in _SUM_FIELDS},
        avg_return=Avg("return_rate"),
        avg_benchmark=Avg("benchmark_return_rate"),
        worst_drawdown=Avg("max_drawdown"),
        record_count=Count("id"),
    )

    cost_total = sum(
        (totals[f] or 0) for f in ("interest_cost", "commission", "tax", "etc_cost")
    )
    income_total = sum(
        (totals[f] or 0)
        for f in ("realized_profit", "unrealized_profit", "dividend_income")
    )

    by_security = []
    grouped = (
        qs.values("security_id", "security__symbol", "security__name")
        .annotate(
            net_profit=Sum("net_profit"),
            avg_return=Avg("return_rate"),
            avg_benchmark=Avg("benchmark_return_rate"),
            record_count=Count("id"),
        )
        .order_by("-net_profit")
    )
    for row in grouped:
        avg_return = row["avg_return"]
        avg_benchmark = row["avg_benchmark"]
        by_security.append(
            {
                "security_id": row["security_id"],
                "symbol": row["security__symbol"],
                "name": row["security__name"],
                "net_profit": num(row["net_profit"]),
                "return_rate": num(avg_return),
                "benchmark_return_rate": num(avg_benchmark),
                "excess_return": (
                    num(avg_return - avg_benchmark)
                    if avg_return is not None and avg_benchmark is not None
                    else None
                ),
                "record_count": row["record_count"],
            }
        )

    avg_return = totals["avg_return"]
    avg_benchmark = totals["avg_benchmark"]

    return {
        "date_from": date_from,
        "date_to": date_to,
        "period_type": period_type,
        "security_id": security_id,
        "totals": {
            **{f: num(totals[f]) for f in _SUM_FIELDS},
            "cost_total": num(cost_total),
            "income_total": num(income_total),
            # 번 돈 중 비용이 가져간 비율. 이게 크면 매매 빈도부터 의심한다.
            "cost_bite_pct": pct(cost_total, income_total) if income_total else None,
            "return_rate": num(avg_return),
            "benchmark_return_rate": num(avg_benchmark),
            "excess_return": (
                num(avg_return - avg_benchmark)
                if avg_return is not None and avg_benchmark is not None
                else None
            ),
            "max_drawdown": num(totals["worst_drawdown"]),
            "record_count": totals["record_count"],
        },
        "cost_breakdown": [
            {
                "field": f,
                "label": PerformanceRecord._meta.get_field(f).db_comment or f,
                "value": num(totals[f]) or 0.0,
            }
            for f in PerformanceRecord.COST_FIELDS
        ],
        "by_security": by_security,
    }
