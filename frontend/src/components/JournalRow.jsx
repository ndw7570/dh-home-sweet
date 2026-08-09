import { DECISION_LABEL, shortDate } from "../lib/format";
import "./JournalRow.css";

/**
 * 일지 한 줄. 태그가 비어 있으면 '이유 미기재'를 경고 톤으로 띄운다 —
 * 이 표시가 이 프로그램에서 사용자를 움직이는 유일한 장치다.
 */
export default function JournalRow({ entry, tags = [], onOpen }) {
  const tagNames = (entry.tag_ids || [])
    .map((id) => tags.find((t) => t.tag_id === id)?.name)
    .filter(Boolean);
  const missing = tagNames.length === 0;

  return (
    <button className="jrow" onClick={() => onOpen?.(entry)}>
      <span className="jrow-date num">{shortDate(entry.entry_date)}</span>
      <span className="jrow-title">{entry.title || "제목 없음"}</span>
      <span className="jrow-type">{DECISION_LABEL[entry.decision_type] || ""}</span>
      {missing ? (
        <span className="pill is-warning">이유 미기재</span>
      ) : (
        tagNames.map((n) => (
          <span key={n} className="pill is-accent">
            {n}
          </span>
        ))
      )}
      <span className="jrow-conv num">
        {entry.conviction_level ? `확신 ${entry.conviction_level}` : "—"}
      </span>
    </button>
  );
}
