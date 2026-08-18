import { useEffect, useRef } from "react";

import "./ConfirmOutlierDialog.css";

/**
 * 서버가 "이 값 정말 맞나" 로 세운 저장을 사람에게 되묻는 창.
 *
 * 이행 저장은 종목 현재가에 비추어 수량·가격이 말이 되는지 검사를 거친다
 * (`trading_discipline/serializers/execution/order.py`). 걸리면 400 이 오고,
 * 메시지는 `confirm_outlier=true 로 다시 보내라` 로 끝난다. 그 재전송은
 * **사람이 확인한 뒤에만** 일어나야 한다 — 화면이 자동으로 붙여 보내면 검사가 통째로 죽는다.
 *
 * 기본 동작은 `[수정하기]` 다. 되돌아가 고치는 쪽에 포커스를 두고 primary 를 준다.
 * `[값이 맞습니다]` 를 기본으로 두면 엔터 한 번에 검사를 통과해 버리는데, 그러면
 * 이 검사가 막으려던 사고(수량 칸에 46만) 를 다시 그대로 통과시킨다.
 *
 * 폼 모달 위에 겹쳐 뜨므로 `data-nested-dialog` 를 단다. Modal 이 이걸 보고
 * ESC 를 흘려보내 뒤쪽 폼이 같이 닫히는 것을 막는다.
 */
export default function ConfirmOutlierDialog({ message, fieldLabel, onEdit, onConfirm, busy }) {
  const editRef = useRef(null);

  useEffect(() => {
    editRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape" && !busy) {
        e.stopPropagation();
        onEdit();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onEdit, busy]);

  return (
    <div className="cod-backdrop" data-nested-dialog="outlier">
      <div className="cod" role="alertdialog" aria-modal="true" aria-labelledby="cod-title">
        <h3 id="cod-title" className="cod-title">
          <span aria-hidden="true">⚠</span> 이 값이 맞습니까
        </h3>

        {fieldLabel && <p className="cod-field">{fieldLabel}</p>}
        <p className="cod-message">{message}</p>

        <p className="cod-note">
          맞다면 그대로 저장한다. 이 확인은 이번 저장 한 번에만 적용된다.
        </p>

        <div className="cod-actions">
          <button
            type="button"
            className="btn cod-keep"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "저장 중…" : "값이 맞습니다 · 그대로 저장"}
          </button>
          <button
            type="button"
            className="btn is-primary"
            ref={editRef}
            onClick={onEdit}
            disabled={busy}
          >
            수정하기
          </button>
        </div>
      </div>
    </div>
  );
}
