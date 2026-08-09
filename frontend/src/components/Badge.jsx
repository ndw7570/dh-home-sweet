import "./Badge.css";

/**
 * 코드값 배지.
 *
 * 서버가 `<필드>_label` 을 같이 내려 주므로 라벨 매핑 테이블을 프론트에 두지 않는다.
 * 코드값이 하나 늘 때마다 두 군데를 고쳐야 하는 상태를 만들지 않기 위해서다.
 */
export default function Badge({ row, field, tone, children, title }) {
  const text = children ?? row?.[`${field}_label`] ?? row?.[field];
  if (!text) return null;
  return (
    <span className={`badge ${tone ? `is-${tone}` : ""}`} title={title}>
      {text}
    </span>
  );
}

/** 추세는 색이 아니라 기호로 먼저 읽히게 한다(색맹 대응). */
export function TrendBadge({ row, field = "predicted_trend" }) {
  const code = row?.[field];
  const tone = code === "UP" ? "up" : code === "DOWN" ? "down" : "flat";
  const mark = code === "UP" ? "▲" : code === "DOWN" ? "▼" : code === "VOLATILE" ? "↕" : "—";
  return (
    <span className={`badge is-${tone}`}>
      {mark} {row?.[`${field}_label`] ?? code ?? "?"}
    </span>
  );
}
