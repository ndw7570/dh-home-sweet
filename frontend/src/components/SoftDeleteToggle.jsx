import "./SoftDeleteToggle.css";

/**
 * 목록이 어느 범위를 보고 있는지 고르는 3단 토글.
 *
 * 백엔드는 모든 목록 엔드포인트에서 `?soft_delete_mode=alive|deleted|all` 을 받는다
 * (`core/views/common.py:_base_queryset`). 안 보내면 `alive` 라, 이 토글을 안 쓰는
 * 화면은 지금까지와 똑같이 동작한다.
 *
 * 켜 놓은 사실을 화면에 계속 남겨 두는 것이 이 컴포넌트의 절반이다.
 * 삭제분이 섞인 목록을 살아 있는 목록으로 착각하고 합계를 읽으면, 그게 바로
 * 이번에 보유수량 464,026 을 만든 것과 같은 종류의 오해다.
 */

export const SOFT_DELETE_MODES = [
  { value: "alive", label: "살아있는 것만", hint: "기본값 — 지금까지의 동작" },
  { value: "deleted", label: "삭제분만", hint: "is_deleted=true 인 행만" },
  { value: "all", label: "전부", hint: "삭제분이 섞여 나온다" },
];

export const isDeleted = (row) => row?.is_deleted === true;

/** 살아 있는 행만 골라 낸다. 합계·지표는 반드시 이걸 통과한 것으로 센다. */
export const aliveOnly = (rows) => (rows || []).filter((r) => !isDeleted(r));

export default function SoftDeleteToggle({ value, onChange, id = "sdm" }) {
  return (
    <div className="sdm" role="group" aria-label="삭제분 보기 범위">
      <span className="sdm-label">삭제분 포함 보기</span>
      <div className="sdm-seg">
        {SOFT_DELETE_MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            id={`${id}-${m.value}`}
            className={`sdm-opt ${value === m.value ? "is-on" : ""}`}
            aria-pressed={value === m.value}
            title={m.hint}
            onClick={() => onChange(m.value)}
          >
            {m.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * "지금 삭제분을 같이 보고 있다" 를 목록 위에 계속 띄우는 배너.
 * 토글은 화면 위쪽 한 번만 보이고 스크롤하면 사라지므로, 목록 바로 앞에 한 번 더 말한다.
 */
export function SoftDeleteBanner({ mode, deletedCount, aliveCount, onReset }) {
  if (mode === "alive") return null;
  const only = mode === "deleted";
  return (
    <p className="sdm-banner" role="status">
      <span className="sdm-banner-mark" aria-hidden="true">
        ⚠
      </span>
      <span>
        {only ? (
          <>
            <strong>삭제분만</strong> 보고 있다 — {deletedCount ?? 0}건. 살아 있는 행은 이 목록에
            없다.
          </>
        ) : (
          <>
            <strong>삭제분 포함</strong> — 삭제 {deletedCount ?? 0}건 + 살아있음{" "}
            {aliveCount ?? 0}건. 합계·지표는 살아 있는 행만 센다.
          </>
        )}
      </span>
      {onReset && (
        <button type="button" className="sdm-banner-reset" onClick={onReset}>
          살아있는 것만 보기
        </button>
      )}
    </p>
  );
}

/** 목록 행 안에 붙는 `삭제됨` 표. 회색·취소선만으로는 흑백 출력에서 안 갈린다. */
export function DeletedMark({ children = "삭제됨" }) {
  return <span className="sdm-mark">{children}</span>;
}

/**
 * 삭제된 행에만 붙는 두 버튼.
 *
 * `영구 삭제` 를 여기서 바로 실행하지 않고 `onPurge` 로 넘기는 이유 —
 * 무엇을 지우는지 값이 눈에 보이는 확인 창을 거쳐야 하기 때문이다(PurgeDialog).
 */
export function DeletedRowActions({ onRestore, onPurge, busy }) {
  return (
    <span className="sdm-actions">
      <button type="button" className="row-edit" onClick={onRestore} disabled={busy}>
        복구
      </button>
      <button type="button" className="row-edit is-purge" onClick={onPurge} disabled={busy}>
        영구 삭제
      </button>
    </span>
  );
}
