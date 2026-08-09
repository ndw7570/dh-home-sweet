import "./MetricCard.css";

/** 대시보드형 화면의 지표 카드. 라벨 작게, 숫자 크게, 그 외 장식 없음. */
export default function MetricCard({ label, value, tone = "default", sub }) {
  return (
    <div className="metric">
      <p className="metric-label">{label}</p>
      <p className={`metric-value num tone-${tone}`}>{value}</p>
      {sub && <p className="metric-sub">{sub}</p>}
    </div>
  );
}
