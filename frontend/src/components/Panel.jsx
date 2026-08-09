import "./Panel.css";

/**
 * 화면의 기본 구획. 제목 + 오른쪽 보조정보 + 본문.
 *
 * `note` 는 "이 숫자를 어떻게 읽어야 하는가"를 적는 자리다.
 * 지표만 던져 놓고 해석을 사용자에게 미루면 화면이 판단을 돕지 못한다.
 */
export default function Panel({ title, meta, note, actions, children, tone }) {
  return (
    <section className={`panel ${tone ? `is-${tone}` : ""}`}>
      {(title || meta || actions) && (
        <div className="panel-head">
          <div className="panel-head-left">
            {title && <h2>{title}</h2>}
            {note && <p className="panel-note">{note}</p>}
          </div>
          <div className="panel-head-right">
            {meta && <span className="panel-meta num">{meta}</span>}
            {actions}
          </div>
        </div>
      )}
      <div className="panel-body">{children}</div>
    </section>
  );
}
