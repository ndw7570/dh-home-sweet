import { useCallback, useEffect, useRef } from "react";

import "./Modal.css";

/**
 * 다이얼로그 껍데기.
 *
 * 저장 중에는 배경 클릭·ESC 로 닫히지 않는다. 저장이 날아가는 중에 창이 사라지면
 * 사용자는 저장이 됐는지 안 됐는지 알 수 없고, 이 프로그램에서 그 불확실성은
 * '기록이 남았다고 착각하는' 상태로 이어진다.
 *
 * 배경 클릭으로 닫는 길은 **실수로 밟히기 쉬운 길**이다. 패널은 520px 인데 배경은
 * 화면 전체라 좌우 여백이 전부 닫힘 버튼이고, 날짜칸의 달력 팝업을 밖을 눌러 닫으면
 * 그 클릭이 배경까지 그대로 내려온다. 그래서 두 가지를 건다.
 *   1. 누른 자리와 뗀 자리가 **둘 다** 배경일 때만 닫는다 — 패널 안에서 시작한 드래그나
 *      뗄 때만 배경에 걸친 클릭으로는 안 닫힌다.
 *   2. 이 창 안에서 뭔가 입력·선택한 뒤라면 묻고 닫는다. 적어 둔 것이 말 없이
 *      사라지는 것이 이 화면에서 가장 나쁜 일이다.
 * 명시적으로 누른 X·취소는 묻지 않는다 — 그건 실수가 아니라 의사표시다.
 */
export default function Modal({ title, subtitle, onClose, busy, children, wide }) {
  const panelRef = useRef(null);
  /** mousedown 이 배경에서 시작했는가. click 때 함께 본다. */
  const downOnBackdrop = useRef(false);
  /** 이 창 안에서 값이 한 번이라도 바뀌었는가. */
  const dirtyRef = useRef(false);

  const requestClose = useCallback(() => {
    if (busy) return;
    if (dirtyRef.current && !window.confirm("적은 내용을 버리고 닫는다.")) return;
    onClose();
  }, [busy, onClose]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") requestClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [requestClose]);

  // 스크롤 잠금과 첫 칸 포커스는 **열릴 때 한 번만**. 위 keydown 과 한 덩어리로 두면
  // 리렌더마다 focus() 가 다시 불려 사용자가 열어 둔 달력·셀렉트 팝업을 닫아 버린다.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector("input, select, textarea")?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        downOnBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        const outside = e.target === e.currentTarget && downOnBackdrop.current;
        downOnBackdrop.current = false;
        if (outside) requestClose();
      }}
    >
      <div
        className={`modal-panel ${wide ? "is-wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={panelRef}
        // 안쪽 입력에서 올라오는 변경을 한 자리에서 받아 '적은 것이 있다'로 기억한다.
        onChange={() => {
          dirtyRef.current = true;
        }}
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
