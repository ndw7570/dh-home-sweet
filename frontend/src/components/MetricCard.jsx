import "./MetricCard.css";

/**
 * 숫자 하나 + 그 숫자를 어떻게 읽어야 하는지 한 줄.
 *
 * `hint` 가 이 컴포넌트의 존재 이유다. "규율 준수율 50%" 만 띄우면 좋은지 나쁜지
 * 알 수 없다. 무엇 대비 50% 인지를 같은 카드 안에 적는다.
 */
export default function MetricCard({ label, value, unit, hint, tone }) {
  return (
    <div className={`mc ${tone ? `is-${tone}` : ""}`}>
      <span className="mc-label">{label}</span>
      <strong className="mc-value num">
        {value ?? "—"}
        {unit && value != null && <span className="mc-unit">{unit}</span>}
      </strong>
      {hint && <span className="mc-hint">{hint}</span>}
    </div>
  );
}

export function MetricRow({ children }) {
  return <div className="mc-row">{children}</div>;
}
