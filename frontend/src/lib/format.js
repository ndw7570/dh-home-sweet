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

/** 그해 몇 번째 주. PlanTimetable 의 WEEK 앵커(직전 일요일) 와 같은 정의. */
export const weekOfYear = (d) => {
  const anchor = new Date(d.getFullYear(), 0, 1);
  anchor.setDate(anchor.getDate() - anchor.getDay());
  return Math.floor((d.getTime() - anchor.getTime()) / (7 * 86400000)) + 1;
};

/**
 * 계층별 기간 라벨 — "이 계획이 언제 것인지" 를 라벨만 보고 알게 한다.
 * 드롭다운·목록에서 동명이인 구분에 쓴다. 트리 셀 안의 짧은 표기와 달리
 * 해(year) 를 함께 실어 다른 해 계획과 섞이지 않게 한다.
 */
export const planPeriodLabel = (level, validFrom) => {
  if (!validFrom) return "";
  const d = new Date(`${String(validFrom).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  switch (level) {
    case "YEAR":
      return `${y}년`;
    case "QUARTER":
      return `${y} ${Math.floor((m - 1) / 3) + 1}분기`;
    case "MONTH":
      return `${y}-${String(m).padStart(2, "0")}`;
    case "WEEK":
    case "WEEKLY_SECURITY":
      return `${y} ${weekOfYear(d)}주`;
    case "DAY":
      return `${y}-${String(m).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    default:
      return "";
  }
};

/** JS Date → 로컬 기준 YYYY-MM-DD. toISOString() 은 UTC 라 KST 15시 이후엔 하루가 밀린다. */
export const localISODate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
};

/** 오늘(로컬) 을 YYYY-MM-DD 로. 날짜 필터·기본값 자리에 쓴다. */
export const todayISODate = () => localISODate(new Date());

/** n 일 전(로컬) 을 YYYY-MM-DD 로. */
export const daysAgoISODate = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return localISODate(d);
};

/** JS Date → <input type="datetime-local"> 값 (로컬 YYYY-MM-DDTHH:MM). */
export const localISODateTimeInput = (d) => {
  const base = localISODate(d);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${base}T${hh}:${mm}`;
};

/**
 * 로컬(KST) 기준 YYYY-MM-DD.
 * 순수 날짜 문자열("2026-08-15") 은 그대로 잘라 반환한다 — Date 로 파싱하면 UTC 자정으로 취급되어
 * 음수 시차 지역에서 하루가 밀린다.
 * TZ 정보가 붙은 datetime("2026-08-15T22:00:00Z", "…+00:00", "…+09:00") 은 로컬 기준으로 바꾼다.
 * 예: 백엔드가 "2026-08-15T22:00:00Z" (UTC) 를 주면 KST 로는 2026-08-16 07:00 → "2026-08-16".
 */
export const isoDate = (d) => {
  if (!d) return "";
  const s = String(d);
  if (!/[TZ]|[+-]\d\d:?\d\d$/.test(s)) return s.slice(0, 10);
  const t = new Date(s);
  if (Number.isNaN(t.getTime())) return s.slice(0, 10);
  return localISODate(t);
};

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
