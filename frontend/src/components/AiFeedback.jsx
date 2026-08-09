import Badge from "./Badge";
import { isoDate } from "../lib/format";
import "./AiFeedback.css";

/**
 * AI 피드백 목록.
 *
 * `valid_until` 이 지난 의견은 흐리게 처리하고 '만료' 를 붙인다.
 * 지난 의견을 오늘 판단의 근거로 끌어다 쓰는 순간 이 기능은 도움이 아니라 소음이 된다.
 *
 * 점수는 크게, 근거는 그 아래. AI 가 무슨 결론을 냈는지보다
 * **왜 그렇게 봤는지**가 판단에 쓸모 있다.
 */
const TONE = {
  WARNING: "warning",
  REJECTION: "danger",
  APPROVAL: "success",
  SUGGESTION: "accent",
  REVIEW: "muted",
};

export default function AiFeedback({ items, compact }) {
  if (!items?.length) {
    return <p className="af-empty">이 대상에 대한 유효한 AI 의견이 없다.</p>;
  }

  return (
    <ul className={`af ${compact ? "is-compact" : ""}`}>
      {items.map((f) => (
        <li key={f.id} className={`af-item ${f.is_expired ? "is-expired" : ""}`}>
          <div className="af-head">
            <Badge row={f} field="opinion_type" tone={TONE[f.opinion_type] || "muted"} />
            {f.table_name && (
              <span className="af-target num">
                {f.table_name}#{f.object_id}
              </span>
            )}
            {f.confidence_score != null && (
              <span className="af-conf num" title="AI 가 스스로 매긴 신뢰도">
                신뢰도 {Number(f.confidence_score).toFixed(0)}
              </span>
            )}
            {f.valid_until && (
              <span className={`af-until num ${f.is_expired ? "is-expired" : ""}`}>
                {f.is_expired ? "만료" : "유효"} ~{isoDate(f.valid_until)}
              </span>
            )}
          </div>

          <p className="af-decision">{f.ai_decision}</p>

          {!compact && f.reasoning_summary && (
            <p className="af-sub">
              <span className="af-sub-label">근거</span> {f.reasoning_summary}
            </p>
          )}
          {!compact && f.risk_summary && (
            <p className="af-sub af-risk">
              <span className="af-sub-label">위험</span> {f.risk_summary}
            </p>
          )}
          {!compact && (f.model?.model_name || f.model_name) && (
            <p className="af-model num">
              {f.model?.model_name || f.model_name}
              {f.model?.model_version ? ` · ${f.model.model_version}` : ""}
              {f.model?.prompt_version ? ` · prompt ${f.model.prompt_version}` : ""}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
