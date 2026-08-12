// 표기 규칙 한 곳. 금액은 화면마다 단위가 다르다 — 홈은 전체 금액, 표는 만원 축약.

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

/** 백엔드의 비율 컬럼은 이미 % 단위다 (NUMERIC(5,2) — 6.40 = 6.4%). 100 을 곱하지 않는다. */
export const rate = (v, digits = 2) =>
  v == null ? "—" : `${Number(v) > 0 ? "+" : ""}${Number(v).toFixed(digits)}%`;

/** 0~1 비율을 % 로. filled_ratio 처럼 소수로 오는 값에만 쓴다. */
export const percent = (v, digits = 0) =>
  v == null ? "—" : `${(Number(v) * 100).toFixed(digits)}%`;

export const price = (v) =>
  v == null ? "—" : Math.round(Number(v)).toLocaleString("ko-KR");

export const qty = (v) => (v == null ? "—" : Number(v).toLocaleString("ko-KR"));

export const shortDate = (d) => (d ? String(d).slice(5).replace("-", ".") : "");

export const isoDate = (d) => (d ? String(d).slice(0, 10) : "");

export const dateRange = (from, to) =>
  from && to ? `${shortDate(from)} ~ ${shortDate(to)}` : "기간 미정";

export const dateTime = (d) => {
  if (!d) return "—";
  const t = new Date(d);
  if (Number.isNaN(t.getTime())) return String(d);
  return `${String(t.getMonth() + 1).padStart(2, "0")}.${String(t.getDate()).padStart(
    2,
    "0"
  )} ${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
};

/** 확신도 1~5 를 막대로. 숫자보다 눈에 먼저 들어와야 한다. */
export const confidenceBar = (score) =>
  score == null ? "—" : "●".repeat(score) + "○".repeat(Math.max(0, 5 - score));

export const LEVEL_LABEL = {
  YEAR: "연",
  QUARTER: "분기",
  MONTH: "월",
  WEEK: "주",
  WEEKLY_SECURITY: "종목별",
  DAY: "일",
};

export const SEVERITY_CLASS = {
  HIGH: "is-danger",
  MEDIUM: "is-warning",
  LOW: "is-muted",
};

/**
 * 코드값 → 한글 라벨.
 * 서버가 `<필드>_label` 을 같이 내려 주므로 원칙적으로 매핑 테이블은 두지 않는다.
 * 이건 라벨이 없는 자리(집계 결과의 키 등)를 위한 최소한의 보조다.
 */
export const labelOf = (row, field) => row?.[`${field}_label`] ?? row?.[field] ?? "—";
