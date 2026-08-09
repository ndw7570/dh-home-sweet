import { useCallback, useState } from "react";

/**
 * "추가 / 수정 / 삭제 모달"의 열고 닫기와 저장 후 리로드를 한 곳에서 다룬다.
 *
 *   const form = useEntityForm(reload);
 *   <button onClick={() => form.openCreate()}>추가</button>
 *   <button onClick={() => form.openEdit(row)}>수정</button>
 *   {form.isOpen && <Modal …><EntityForm instance={form.target} onSubmit={form.submit(api)} …/></Modal>}
 *
 * 저장이 성공해야 닫는다. 실패하면 열어 둔 채 에러를 필드에 붙여야 하므로,
 * `submit` 은 예외를 삼키지 않고 EntityForm 으로 다시 던진다.
 */
export function useEntityForm(reload) {
  const [state, setState] = useState({ open: false, target: null, preset: null });

  const openCreate = useCallback((preset = null) => {
    setState({ open: true, target: null, preset });
  }, []);

  const openEdit = useCallback((target) => {
    setState({ open: true, target, preset: null });
  }, []);

  const close = useCallback(() => setState({ open: false, target: null, preset: null }), []);

  /** api = { create, update, remove } */
  const submit = useCallback(
    (api) => async (payload) => {
      const id = state.target?.id;
      if (id != null) await api.update(id, payload);
      else await api.create(payload);
      close();
      await reload?.();
    },
    [state.target, close, reload]
  );

  const remove = useCallback(
    (api) => async () => {
      const id = state.target?.id;
      if (id == null) return;
      await api.remove(id);
      close();
      await reload?.();
    },
    [state.target, close, reload]
  );

  return {
    isOpen: state.open,
    target: state.target,
    // 생성 시 미리 채워 둘 값 (캐스케이드에서 '이 분기 아래 월계획 추가' 같은 문맥)
    instance: state.target ?? state.preset,
    isEdit: Boolean(state.target),
    openCreate,
    openEdit,
    close,
    submit,
    remove,
  };
}
