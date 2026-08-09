// 금액 표기는 화면마다 다르다. 홈은 전체 금액, 대시보드는 만원 단위 축약.
export const won = (v) =>
  v == null ? "—" : `${Math.round(Number(v)).toLocaleString("ko-KR")}원`;

export const manwon = (v) => {
  if (v == null) return "—";
  const man = Math.round(Number(v) / 10000);
  return man >= 10000
    ? `${(man / 10000).toFixed(2).replace(/\.?0+$/, "")}억`
    : `${man.toLocaleString("ko-KR")}만`;
};

export const signed = (v, fmt = manwon) => {
  if (v == null) return "—";
  const n = Number(v);
  return `${n > 0 ? "+" : n < 0 ? "-" : ""}${fmt(Math.abs(n))}`;
};

export const percent = (v, digits = 0) =>
  v == null ? "—" : `${(Number(v) * 100).toFixed(digits)}%`;

export const shortDate = (d) => (d ? String(d).slice(5).replace("-", ".") : "");

export const monthLabel = (d) => (d ? `${Number(String(d).slice(5, 7))}월` : "");

export const DECISION_LABEL = {
  BUY: "매수",
  SELL: "매도",
  HOLD: "보유",
  REBALANCE: "리밸런싱",
  CASH: "현금",
};
