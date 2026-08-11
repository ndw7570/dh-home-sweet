import { useMemo } from "react";

import AsyncState from "./AsyncState";
import MetricCard, { MetricRow } from "./MetricCard";
import Panel from "./Panel";
import { fetchExecutionCompare, fetchPerformanceSummary } from "../api/trading";
import { rate, won } from "../lib/format";
import { useAsyncAll } from "../lib/useAsync";
import "./PlanPerformanceChart.css";

/**
 * 계획 성과 그래프 — 계획한 것과 실제 결과가 얼마나 붙어 갔는가.
 *
 * 좌: 규율 준수율 (계획대로 이행된 비율)
 * 우: 종목별 수익률 vs 벤치마크
 * 하: 매매 건별 계획가 대비 체결가 diff
 *
 * 이 뷰는 조회 전용이다. 편집은 이행 · 성과 페이지에서.
 */

const dateFrom = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
};

export default function PlanPerformanceChart({ accountId }) {
  const today = new Date().toISOString().slice(0, 10);
  const start = useMemo(() => dateFrom(90), []);

  const { data, error, loading, reload } = useAsyncAll(
    {
      compare: () =>
        fetchExecutionCompare({
          date_from: start,
          date_to: today,
        }),
      perf: () =>
        fetchPerformanceSummary({
          date_from: dateFrom(365),
          date_to: today,
        }),
    },
    [accountId, start, today]
  );

  const compare = data?.compare;
  const perf = data?.perf;
  const summary = compare?.summary;
  const t = perf?.totals;

  const bySecurity = perf?.by_security || [];
  const maxAbsReturn = Math.max(1, ...bySecurity.map((s) => Math.abs(s.return_rate || 0)));

  return (
    <AsyncState loading={loading} error={error} onRetry={reload}>
      {compare && perf && (
        <div className="pc">
          <MetricRow>
            <MetricCard
              label="규율 준수율"
              value={summary.discipline_rate == null ? "—" : summary.discipline_rate}
              unit={summary.discipline_rate == null ? "" : "%"}
              hint={`최근 90일 · 이행 ${summary.order_count}건 중 표시 ${summary.flagged_count}건`}
              tone={
                summary.discipline_rate == null
                  ? undefined
                  : summary.discipline_rate >= 80
                    ? "success"
                    : summary.discipline_rate >= 50
                      ? "warning"
                      : "danger"
              }
            />
            <MetricCard
              label="순손익"
              value={won(t.net_profit)}
              hint={`최근 1년 · 성과 기록 ${t.record_count}건`}
              tone={t.net_profit > 0 ? "success" : t.net_profit < 0 ? "danger" : undefined}
            />
            <MetricCard
              label="수익률"
              value={rate(t.return_rate)}
              hint={`벤치마크 ${rate(t.benchmark_return_rate)}`}
            />
            <MetricCard
              label="초과수익"
              value={rate(t.excess_return)}
              hint="시장을 이겼는가 아닌가"
              tone={
                t.excess_return == null
                  ? undefined
                  : t.excess_return >= 0
                    ? "success"
                    : "danger"
              }
            />
          </MetricRow>

          <Panel
            title="종목별 수익률 vs 벤치마크"
            meta={`${bySecurity.length}종목`}
            note="계획대로 이행이 되었다 해도 결과가 벤치마크를 넘어서지 못하면 판단이 틀린 것이다. 그 갈림선을 여기서 본다."
          >
            {bySecurity.length === 0 ? (
              <p className="pc-empty">최근 1년에 성과 기록이 없다.</p>
            ) : (
              <div className="pc-bars">
                {bySecurity.map((s) => {
                  const r = s.return_rate ?? 0;
                  const bm = s.benchmark_return_rate ?? 0;
                  const rW = (Math.abs(r) / maxAbsReturn) * 50;
                  const bmW = (Math.abs(bm) / maxAbsReturn) * 50;
                  return (
                    <div key={s.security_id} className="pc-bar-row">
                      <div className="pc-bar-label">
                        <strong>{s.name}</strong>
                        <span className="num pc-bar-sym"> {s.symbol}</span>
                      </div>
                      <div className="pc-bar-axis">
                        <span className="pc-bar-mid" />
                        <span
                          className={`pc-bar-seg pc-bar-return ${r >= 0 ? "is-pos" : "is-neg"}`}
                          style={{ width: `${rW}%`, [r >= 0 ? "left" : "right"]: "50%" }}
                          title={`수익률 ${rate(r)}`}
                        />
                        <span
                          className={`pc-bar-seg pc-bar-bench ${bm >= 0 ? "is-pos" : "is-neg"}`}
                          style={{ width: `${bmW}%`, [bm >= 0 ? "left" : "right"]: "50%" }}
                          title={`벤치마크 ${rate(bm)}`}
                        />
                      </div>
                      <div className="pc-bar-nums num">
                        <span className={r >= 0 ? "pos" : "neg"}>{rate(r)}</span>
                        <span className="pc-bar-vs">vs</span>
                        <span className="pc-bar-bm">{rate(bm)}</span>
                      </div>
                    </div>
                  );
                })}
                <div className="pc-legend">
                  <span>
                    <span className="pc-legend-swatch pc-bar-return is-pos" /> 실현 수익률
                  </span>
                  <span>
                    <span className="pc-legend-swatch pc-bar-bench is-pos" /> 벤치마크
                  </span>
                </div>
              </div>
            )}
          </Panel>

          <Panel
            title="계획가 대비 체결가"
            meta={`이행 ${compare.rows.length}건`}
            note="계획에는 예상가와 손절가가 있다. 체결가가 그 두 선 사이에 놓였는지, 벗어났는지 한 눈에 본다."
          >
            {compare.rows.length === 0 ? (
              <p className="pc-empty">이 기간에 이행 기록이 없다.</p>
            ) : (
              <ul className="pc-orders">
                {compare.rows.map((row) => {
                  const p = row.matched_plans[0];
                  const filled = row.order.limit_price;
                  const pred = p?.predicted_price;
                  const stop = p?.stop_loss_price;
                  const flagged = row.flags.length > 0;
                  const priceMin = Math.min(
                    ...[filled, pred, stop].filter((v) => v != null && Number.isFinite(v))
                  );
                  const priceMax = Math.max(
                    ...[filled, pred, stop].filter((v) => v != null && Number.isFinite(v))
                  );
                  const span = Math.max(1, priceMax - priceMin) || 1;
                  const pos = (v) =>
                    v == null ? null : `${((v - priceMin) / span) * 100}%`;
                  return (
                    <li key={row.order.id} className={`pc-order ${flagged ? "is-flagged" : ""}`}>
                      <div className="pc-order-head">
                        <span className={`pc-side is-${(row.order.side || "").toLowerCase()}`}>
                          {row.order.side_label}
                        </span>
                        <strong>{row.security?.name}</strong>
                        <span className="num pc-order-sym">{row.security?.symbol}</span>
                        <span className="pc-order-plan">
                          {p ? p.title : <em className="pc-order-noplan">대조 계획 없음</em>}
                        </span>
                      </div>
                      {p && (
                        <div className="pc-price-track">
                          <span className="pc-price-line" />
                          {pos(stop) && (
                            <span
                              className="pc-price-tick is-stop"
                              style={{ left: pos(stop) }}
                              title={`손절가 ${stop}`}
                            >
                              <span className="pc-price-cap">손절</span>
                            </span>
                          )}
                          {pos(pred) && (
                            <span
                              className="pc-price-tick is-target"
                              style={{ left: pos(pred) }}
                              title={`예상가 ${pred}`}
                            >
                              <span className="pc-price-cap">예상</span>
                            </span>
                          )}
                          {pos(filled) && (
                            <span
                              className="pc-price-tick is-filled"
                              style={{ left: pos(filled) }}
                              title={`체결가 ${filled}`}
                            >
                              <span className="pc-price-cap">체결</span>
                            </span>
                          )}
                        </div>
                      )}
                      {flagged && (
                        <ul className="pc-order-flags">
                          {row.flags.map((f, i) => (
                            <li key={i} className={`pc-order-flag is-${f.severity.toLowerCase()}`}>
                              {f.message}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      )}
    </AsyncState>
  );
}
