import { useEffect, useState } from "react";

import MetricCard from "../components/MetricCard";
import TimelineChart from "../components/TimelineChart";
import {
  fetchTimeline,
  listAccounts,
  listHoldings,
  listTransactions,
} from "../api/planner";
import { DECISION_LABEL, manwon, shortDate, won } from "../lib/format";
import "./AssetPage.css";

/** 자산 — 대시보드형. 파고들기 위한 화면이라 밀도를 가장 높게 잡는다. */
export default function AssetPage({ onGo }) {
  const [state, setState] = useState({ status: "loading" });

  useEffect(() => {
    let alive = true;
    Promise.all([listAccounts(), listHoldings(), listTransactions(), fetchTimeline()])
      .then(([accounts, holdings, transactions, timeline]) => {
        if (!alive) return;
        setState({ status: "ready", accounts, holdings, transactions, timeline });
      })
      .catch(() => alive && setState({ status: "error" }));
    return () => {
      alive = false;
    };
  }, []);

  if (state.status === "loading") return <div className="placeholder">불러오는 중입니다…</div>;
  if (state.status === "error")
    return <div className="placeholder">자산 정보를 불러오지 못했습니다.</div>;

  const { accounts = [], holdings = [], transactions = [], timeline } = state;
  const evaluated = holdings.reduce(
    (sum, h) => sum + Number(h.quantity || 0) * Number(h.avg_price || 0),
    0
  );
  const missing = transactions.filter((t) => !t.entry_id).length;

  return (
    <div className="asset">
      <div className="section-head">
        <h2>자산</h2>
        <span className="meta">계좌 {accounts.length}개 · 종목 {holdings.length}개</span>
      </div>

      <div className="asset-metrics">
        <MetricCard label="평가금액" value={manwon(evaluated)} />
        <MetricCard label="보유 종목" value={`${holdings.length}개`} />
        <MetricCard
          label="이유 미기재 거래"
          value={`${missing}건`}
          tone={missing > 0 ? "warning" : "default"}
          sub={missing > 0 ? "회고 때 근거가 없습니다" : "전부 기록됨"}
        />
      </div>

      <div className="card asset-chart">
        <TimelineChart data={timeline} />
      </div>

      <div className="section-head">
        <h2>보유 종목</h2>
      </div>
      <div className="card table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>종목</th>
              <th>자산군</th>
              <th className="ta-r">수량</th>
              <th className="ta-r">평균단가</th>
              <th className="ta-r">평가금액</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((h) => (
              <tr key={h.holding_id}>
                <td>
                  {h.name}
                  <span className="sym num">{h.symbol}</span>
                </td>
                <td>{h.asset_class}</td>
                <td className="ta-r num">{Number(h.quantity).toLocaleString("ko-KR")}</td>
                <td className="ta-r num">{won(h.avg_price)}</td>
                <td className="ta-r num">{manwon(h.quantity * h.avg_price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section-head">
        <h2>최근 거래</h2>
        <button className="btn" onClick={() => onGo?.("journal", "missing")}>
          일지로 이동
        </button>
      </div>
      <div className="card table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>일자</th>
              <th>유형</th>
              <th className="ta-r">금액</th>
              <th>일지</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.transaction_id}>
                <td className="num">{shortDate(t.traded_at)}</td>
                <td>{DECISION_LABEL[t.trade_type] || t.trade_type}</td>
                <td className="ta-r num">{manwon(t.amount)}</td>
                <td>
                  {t.entry_id ? (
                    <span className="pill is-success">기록됨</span>
                  ) : (
                    <span className="pill is-warning">이유 미기재</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
