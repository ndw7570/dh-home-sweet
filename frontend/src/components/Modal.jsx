import { useEffect, useRef } from "react";

import "./Modal.css";

/**
 * 다이얼로그 껍데기.
 *
 * 저장 중에는 배경 클릭·ESC 로 닫히지 않는다. 저장이 날아가는 중에 창이 사라지면
 * 사용자는 저장이 됐는지 안 됐는지 알 수 없고, 이 프로그램에서 그 불확실성은
 * '기록이 남았다고 착각하는' 상태로 이어진다.
 */
export default function Modal({ title, subtitle, onClose, busy, children, wide }) {
  const panelRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector("input, select, textarea")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, busy]);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        className={`modal-panel ${wide ? "is-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={panelRef}
      >
        <div className="modal-head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p className="modal-sub">{subtitle}</p>}
          </div>
          <button className="modal-x" onClick={onClose} disabled={busy} aria-label="닫기">
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
