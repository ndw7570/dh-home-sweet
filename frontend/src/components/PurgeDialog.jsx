import { useState } from "react";

import Modal from "./Modal";
import { errorBlockedBy, errorDetail } from "../lib/apiError";
import "./PurgeDialog.css";

/**
 * 물리 삭제 확인 창.
 *
 * `정말 삭제할까요?` 로는 부족하다. 이 버튼의 주 용도가 **값이 이상한 행을 지우는 것**이라
 * (수량 칸에 46만을 적은 이행 같은), 지우려는 값이 눈에 보여야 한다. 요약을 크게 띄우는
 * 이유가 그것이다 — 옆 행을 잘못 짚었다면 숫자를 보는 순간 알아채야 한다.
 *
 * `summary` 는 화면이 만들어 넘긴다 (`현대자동차 BUY 464,000주 @20원` 처럼).
 * 확인을 누르면 `onConfirm()` 을 부르고, 그것이 실패하면 창을 닫지 않고 이유를 보여 준다.
 * `blocked_by` 는 무엇이 이 행을 붙잡고 있는지의 목록이라 그대로 노출한다.
 */
export default function PurgeDialog({ title = "영구 삭제", summary, meta, onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const run = async () => {
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      await onConfirm();
    } catch (e) {
      setErr(e);
      setBusy(false);
    }
  };

  const blockedBy = err ? errorBlockedBy(err) : [];

  return (
    <Modal
      title={title}
      subtitle="되돌릴 수 없다. 소프트 삭제(삭제 표시)와 달리 행이 DB 에서 사라진다."
      onClose={onClose}
      busy={busy}
    >
      <div className="pgd">
        <div className="pgd-target">
          <span className="pgd-target-label">지울 행</span>
          <strong className="pgd-target-summary num">{summary || "(요약 없음)"}</strong>
          {meta && <span className="pgd-target-meta num">{meta}</span>}
        </div>

        <p className="pgd-warn">
          이 행은 <strong>복구할 수 없다.</strong> 값이 이상해서 지우는 것이라면, 위 숫자가
          지우려던 그 값이 맞는지 먼저 확인한다.
        </p>

        {err && (
          <div className="pgd-error">
            <p>{errorDetail(err)}</p>
            {blockedBy.length > 0 && (
              <>
                <p className="pgd-error-label">이 행을 참조하고 있는 것</p>
                <ul className="pgd-blocked">
                  {blockedBy.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
                <p className="pgd-error-hint">
                  참조하는 쪽을 먼저 정리해야 이 행을 지울 수 있다.
                </p>
              </>
            )}
          </div>
        )}

        <div className="pgd-actions">
          {/* 기본 동작은 취소 쪽이다. 파괴적인 버튼을 primary 로 두지 않는다. */}
          <button type="button" className="btn is-primary" onClick={onClose} disabled={busy}>
            취소
          </button>
          <button type="button" className="btn pgd-go" onClick={run} disabled={busy}>
            {busy ? "지우는 중…" : "영구 삭제한다"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
