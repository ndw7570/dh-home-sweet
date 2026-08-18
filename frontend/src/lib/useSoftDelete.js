import { useCallback, useState } from "react";

import { errorDetail } from "./apiError";

/**
 * 삭제된 행의 복구 / 물리 삭제를 다루는 상태 한 묶음.
 *
 *   const life = useSoftDelete(reload);
 *   <DeletedRowActions
 *     busy={life.busyId === row.id}
 *     onRestore={() => life.restore(order, row)}
 *     onPurge={() => life.askPurge(order, row, "현대자동차 BUY 464,000주 @20원")}
 *   />
 *   {life.purgeTarget && <PurgeDialog {...life.purgeProps} />}
 *
 * 복구는 되돌릴 수 있으므로 바로 실행한다. 물리 삭제는 되돌릴 수 없으므로
 * **무엇을 지우는지 요약을 들고** 확인 창을 한 번 거친다.
 *
 * `confirmPurge` 는 실패를 삼키지 않는다 — 확인 창이 그 에러를 받아서
 * `blocked_by`(무엇이 붙잡고 있는지) 까지 화면에 펼쳐야 하기 때문이다.
 */
export function useSoftDelete(reload) {
  const [purgeTarget, setPurgeTarget] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  const restore = useCallback(
    async (api, row) => {
      if (row?.id == null) return;
      setBusyId(row.id);
      setError(null);
      try {
        await api.restore(row.id);
        await reload?.();
      } catch (e) {
        setError(errorDetail(e));
      } finally {
        setBusyId(null);
      }
    },
    [reload]
  );

  const askPurge = useCallback((api, row, summary, meta) => {
    if (row?.id == null) return;
    setError(null);
    setPurgeTarget({ api, id: row.id, summary, meta });
  }, []);

  const closePurge = useCallback(() => setPurgeTarget(null), []);

  const confirmPurge = useCallback(async () => {
    if (!purgeTarget) return;
    await purgeTarget.api.purge(purgeTarget.id);
    setPurgeTarget(null);
    await reload?.();
  }, [purgeTarget, reload]);

  return {
    purgeTarget,
    busyId,
    error,
    clearError: () => setError(null),
    restore,
    askPurge,
    // 확인 창에 그대로 펼쳐 넣는다.
    purgeProps: purgeTarget && {
      summary: purgeTarget.summary,
      meta: purgeTarget.meta,
      onConfirm: confirmPurge,
      onClose: closePurge,
    },
  };
}
