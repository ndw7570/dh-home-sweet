import { useEffect, useState } from "react";

import { fetchChoices } from "../api/trading";

/**
 * 코드값 목록을 앱 전체에서 한 번만 받아 캐시한다.
 *
 * SQL 이 `VARCHAR(20)` 으로만 잡아 둔 코드값의 실제 값과 한글 라벨은 서버가 정한다
 * (`trading_discipline/constants/choices.py`). 프론트에 복사해 두면 값이 하나 늘 때마다
 * 두 군데를 고쳐야 하고, 그러다 한쪽만 고치면 셀렉트박스에 없는 값이 저장된다.
 */
let cache = null;
let inflight = null;
const listeners = new Set();

function load() {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = fetchChoices()
      .then((data) => {
        cache = data;
        inflight = null;
        listeners.forEach((fn) => fn(cache));
        return cache;
      })
      .catch((err) => {
        inflight = null;
        throw err;
      });
  }
  return inflight;
}

export function useChoices() {
  const [choices, setChoices] = useState(cache);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    if (!cache) load().catch((e) => alive && setError(e));
    const fn = (c) => alive && setChoices(c);
    listeners.add(fn);
    if (cache) setChoices(cache);
    return () => {
      alive = false;
      listeners.delete(fn);
    };
  }, []);

  return { choices, error, ready: Boolean(choices) };
}

/** 저장된 값이 목록에 없으면 그 값도 옵션으로 끼워 넣는다 — 편집 화면에서 사라지지 않게. */
export function optionsFor(choices, key, currentValue) {
  const list = choices?.[key] || [];
  if (currentValue && !list.some((o) => o.value === currentValue)) {
    return [...list, { value: currentValue, label: `${currentValue} (목록에 없는 값)` }];
  }
  return list;
}
