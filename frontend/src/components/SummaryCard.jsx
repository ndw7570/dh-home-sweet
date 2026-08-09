import "./SummaryCard.css";

/**
 * 홈(토스형) 카드. 시스템이 한 문장으로 해석해 주고 행동은 버튼 하나로 끝낸다.
 * 강조 카드는 화면당 하나만 — accent 가 둘 이상이면 아무것도 강조되지 않는다.
 */
export default function SummaryCard({
  eyebrow,
  headline,
  value,
  caption,
  tone = "default",
  badge,
  action,
  onAction,
  accent = false,
  children,
}) {
  return (
    <section className={`scard ${accent ? "is-accent" : ""}`}>
      {badge && <span className="pill is-accent scard-badge">{badge}</span>}
      {eyebrow && <p className="scard-eyebrow">{eyebrow}</p>}
      {value != null && <p className={`scard-value num tone-${tone}`}>{value}</p>}
      {headline && <p className="scard-headline">{headline}</p>}
      {children}
      {caption && <p className={`scard-caption tone-${tone}`}>{caption}</p>}
      {action && (
        <button className="btn is-block scard-action" onClick={onAction}>
          {action}
        </button>
      )}
    </section>
  );
}
