/**
 * 변동폭 비율 — 전략의 근거를 **금액이 아니라 비율**로 들고 다니기 위한 계산.
 *
 * 전략을 세운 날의 고가·저가를 금액 그대로 쓰면 그 전략은 그 가격대에서만 쓸 수 있다.
 * 삼성전자 30만원일 때 세운 "고가 306,500 / 저가 287,500" 은 주가가 10만원이 되면
 * 아무 의미가 없다. 근거로 남겨야 하는 것은 **현재가에서 얼마나 벌어졌는가**다.
 *
 *   고가 240만 · 저가 160만 · 현재가 200만  →  +20% / -20%
 *   이 비율을 나중에 100만원에 대면          →  120만 ~ 80만
 *
 * 그래서 스냅샷에서 비율을 뽑고(`bandRatios`), 그 비율을 **예측하려는 시점의 현재가**에
 * 다시 씌운다(`applyBand`). 스냅샷 자체는 여전히 안 바뀐다 — 바뀌는 것은 씌우는 대상이다.
 */

const num = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/**
 * 스냅샷 → `{ up, down, width }` (단위: %).
 *
 *   up    현재가 대비 고가가 얼마나 위인가 (보통 양수)
 *   down  현재가 대비 저가가 얼마나 아래인가 (보통 음수)
 *   width 둘을 합친 폭. 서로 다른 날의 변동성을 견줄 때 이 값 하나로 본다.
 *
 * 현재가가 없거나 0이면 나눌 기준이 없으므로 `null` 이다 — 0 으로 나눠 Infinity 를
 * 흘려보내면 화면에 `∞%` 가 찍힌다.
 */
export function bandRatios(snapshot) {
  const high = num(snapshot?.high_price);
  const low = num(snapshot?.low_price);
  const base = num(snapshot?.current_price);
  if (base == null || base === 0) return null;

  const up = high == null ? null : ((high - base) / base) * 100;
  const down = low == null ? null : ((low - base) / base) * 100;
  if (up == null && down == null) return null;
  return { up, down, width: up != null && down != null ? up - down : null, base };
}

/**
 * 비율을 다른 현재가에 씌운다 → `{ high, low }` (금액).
 * 예측하려는 날의 현재가를 넣으면 그날 기준의 상단·하단이 나온다.
 */
export function applyBand(basePrice, ratios) {
  const base = num(basePrice);
  if (base == null || !ratios) return null;
  return {
    base,
    high: ratios.up == null ? null : base * (1 + ratios.up / 100),
    low: ratios.down == null ? null : base * (1 + ratios.down / 100),
  };
}

/** 부호를 붙인 % 표기. `rate()` 와 달리 소수 자릿수를 자리에 맞게 줄인다. */
export const pct = (v, digits = 2) =>
  v == null ? "—" : `${v > 0 ? "+" : ""}${v.toFixed(digits)}%`;

/**
 * 분할 계단 — 구간을 비중만큼씩 잘라 몇 번에 나눠 담을지.
 *
 *   현재가에서 저가까지가 10만원이고 분할 비중을 30% 로 잡으면
 *   → -3만 · -6만 · -9만 · -10만  (마지막은 구간 끝)
 *
 * 마지막 계단은 **항상 구간 끝(100%)** 이다. 30% 씩 세 번이면 90% 까지밖에 안 가는데,
 * 남은 10% 를 안 담으면 정작 바닥에서 아무것도 못 산다. 그래서 끝을 한 칸 더 둔다.
 *
 * `base`(현재가) → `target`(매수면 저가, 매도면 고가) 구간을 자른다. 고가~저가 전체 폭이
 * 아니라 현재가를 한쪽 끝으로 두는 이유는, 계단이 실제로 걸리는 자리가 지금 가격에서
 * 얼마나 떨어진 곳인가이기 때문이다.
 */
export function splitLadder({ base, target, ratioPct }) {
  const b = num(base);
  const t = num(target);
  const step = num(ratioPct);
  if (b == null || t == null || b === 0 || step == null || step <= 0) return [];

  const span = t - b; // 매수면 음수(아래로), 매도면 양수(위로)
  if (span === 0) return [];

  const portions = [];
  for (let k = 1; k * step < 100; k += 1) portions.push(k * step);
  portions.push(100);

  return portions.map((portion, i) => {
    const delta = span * (portion / 100);
    return {
      step: i + 1,
      portion,
      delta, // 현재가에서 얼마나 떨어진 자리인가 (금액)
      price: b + delta,
      pctOfBase: (delta / b) * 100, // 그 자리가 현재가 대비 몇 % 인가
    };
  });
}

/**
 * 계단 행 — **두 탭이 같은 표를 쓴다.** 바뀌는 것은 재는 자(尺) 하나뿐이다.
 *
 *   상승·하락분  한쪽 구간(현재가→저가 또는 →고가)을 100% 로 두고 잰다.
 *   정비율       고가~저가 **전체**를 100% 로 두고 잰다.
 *
 * 계단이 걸리는 자리(가격)는 두 기준이 똑같다. 다른 것은 그 자리를 몇 %로 부르느냐다.
 * 고저 폭이 80만이고 현재가가 가운데(40만씩)일 때 비중 30% 로 자르면 —
 *
 *   상승·하락분  30%p 30%p 30%p 10%p  (한쪽 구간 기준, 합 100%)
 *   정비율       15%p 15%p 15%p  5%p  (전체 기준, 반대편까지 합쳐야 100%)
 *
 * `share` 는 이쪽 구간이 전체에서 차지하는 몫이다. 현재가가 가운데가 아니면 50%가 아니고,
 * 그 치우침이 정비율 기준이 알려 주는 것이다.
 */
export function ladderRows({ high, low, base, ratioPct, side = "buy", mode = "side" }) {
  const h = num(high);
  const l = num(low);
  const b = num(base);
  const buying = side !== "sell";
  const target = buying ? l : h;
  if (b == null || target == null) return null;

  const steps = splitLadder({ base: b, target, ratioPct });
  if (!steps.length) return null;

  // 전체 폭 대비 이쪽 구간의 몫. 정비율은 이 몫만큼으로 눈금을 줄여 잰다.
  const range = h != null && l != null ? h - l : null;
  const share = range && range > 0 ? (Math.abs(target - b) / range) * 100 : null;
  if (mode === "even" && share == null) return null;
  const scale = mode === "even" ? share / 100 : 1;

  let prev = 0;
  const rows = steps.map((r) => {
    const inc = r.portion - prev;
    prev = r.portion;
    return {
      step: r.step,
      incPct: inc * scale,
      cumPct: r.portion * scale,
      delta: r.delta,
      pctOfBase: r.pctOfBase,
      price: r.price,
      isEdge: r.portion >= 100,
    };
  });

  return {
    rows,
    buying,
    target,
    span: target - b,
    share,
    otherShare: share == null ? null : 100 - share,
  };
}
