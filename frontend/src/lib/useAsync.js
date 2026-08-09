import { useCallback, useEffect, useState } from "react";

/**
 * 조회 한 건의 로딩/에러/데이터를 한 묶음으로 다룬다.
 *
 * 화면마다 useState 세 개를 따로 두면 로딩 중에 빈 배열을 '데이터 없음' 으로
 * 그려 버리는 실수가 반복된다. 여기서 상태를 하나로 묶어 그 구분을 강제한다.
 *
 *   const { data, error, loading, reload } = useAsync(() => listSecurities(), [accountId]);
 */
export function useAsync(fn, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });

  const run = useCallback(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.resolve()
      .then(fn)
      .then((data) => alive && setState({ data, error: null, loading: false }))
      .catch((error) => alive && setState({ data: null, error, loading: false }));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => run(), [run]);

  return { ...state, reload: run };
}

/** 여러 조회를 한 번에. 하나라도 실패하면 error 로 떨어진다. */
export function useAsyncAll(map, deps = []) {
  const keys = Object.keys(map);
  return useAsync(
    () =>
      Promise.all(keys.map((k) => Promise.resolve().then(map[k]))).then((values) =>
        Object.fromEntries(keys.map((k, i) => [k, values[i]]))
      ),
    deps
  );
}
