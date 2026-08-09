import { useCallback, useState } from "react";

/**
 * 한 화면에서 여러 종류의 엔티티를 만들고 고칠 때 쓴다 (계획 화면은 6종을 다룬다).
 *
 * `kinds` = { KEY: { title, fields, api, optionsKey?, wide? } }
 *
 * 수정은 **목록 행이 아니라 서버에서 원본을 다시 읽어** 연다.
 * 캐스케이드 트리의 노드는 화면용으로 눌러 놓은 것이라(`strategies: {buy: …}` 처럼
 * 모양이 다르고 일부 컬럼은 아예 없다), 그걸로 폼을 채우면 안 보이던 컬럼이
 * 저장될 때 null 로 덮인다.
 */
export function useMultiForm(kinds, reload) {
  const [state, setState] = useState({ kind: null, instance: null });
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  const openCreate = useCallback((kind, preset = null) => {
    setLoadError(null);
    setState({ kind, instance: preset });
  }, []);

  const openEdit = useCallback(
    async (kind, id) => {
      const spec = kinds[kind];
      if (!spec) return;
      setLoading(true);
      setLoadError(null);
      try {
        const row = await spec.api.get(id);
        setState({ kind, instance: row });
      } catch (err) {
        setLoadError(err);
      } finally {
        setLoading(false);
      }
    },
    [kinds]
  );

  const close = useCallback(() => setState({ kind: null, instance: null }), []);

  const submit = useCallback(
    async (payload) => {
      const spec = kinds[state.kind];
      const id = state.instance?.id;
      // 생성 프리셋에는 id 가 없다 — id 유무로 생성/수정을 가른다.
      const saved = id != null ? await spec.api.update(id, payload) : await spec.api.create(payload);
      close();
      await reload?.();
      // 저장된 행을 돌려준다. 화면이 "저장은 됐는데 지금 필터로는 안 보인다"를
      // 알려 줄 수 있어야 한다 — 저장이 안 된 줄 알고 다시 누르는 것을 막는다.
      return { kind: state.kind, saved, created: id == null };
    },
    [kinds, state, close, reload]
  );

  const remove = useCallback(async () => {
    const spec = kinds[state.kind];
    const id = state.instance?.id;
    if (id == null) return;
    await spec.api.remove(id);
    close();
    await reload?.();
  }, [kinds, state, close, reload]);

  return {
    kind: state.kind,
    spec: state.kind ? kinds[state.kind] : null,
    instance: state.instance,
    isOpen: Boolean(state.kind),
    isEdit: state.instance?.id != null,
    loading,
    loadError,
    openCreate,
    openEdit,
    close,
    submit,
    remove,
  };
}
