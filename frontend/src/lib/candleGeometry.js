/**
 * 봉 차트의 좌표 계산. 그리기(JSX)와 분리해 둔 이유는 **검증 때문**이다.
 *
 * 지금 봉 테이블이 0건이라 화면으로는 차트가 맞는지 확인할 방법이 없다. 여기 있는 것이
 * 전부 순수 함수라 합성 데이터를 넣어 좌표가 격자 안에 떨어지는지, NaN 이 안 나오는지를
 * 데이터 없이도 확인할 수 있다. DecimalField 가 `"73800.00"` 처럼 **문자열**로 내려오는
 * 것이 이 파일에서 가장 자주 사고를 내는 지점이다.
 */

import { clockTime, dateWithWeekday, isoDate, shortDate } from "./format";

// 격자 좌표계. 픽셀이 아니라 viewBox 단위다 — 폭은 컨테이너에 맞춰 늘어난다.
export const W = 720;
export const PAD_L = 58; // y축 눈금 글자 자리
export const PAD_R = 12;
export const PAD_T = 10;
export const PRICE_H = 216;
export const GAP_H = 14; // 가격 패널과 거래량 패널 사이
export const VOL_H = 56;
/**
 * x축 글자 자리. **컨테이너 높이에 반드시 포함한다** — 빼면 축 글자가 잘리면서
 * 카드 안에 조그만 세로 스크롤이 생긴다.
 */
export const AXIS_H = 22;

export const H = PAD_T + PRICE_H + GAP_H + VOL_H + AXIS_H;
export const PLOT_W = W - PAD_L - PAD_R;
export const PRICE_Y1 = PAD_T + PRICE_H;
export const VOL_Y0 = PRICE_Y1 + GAP_H;
export const VOL_Y1 = VOL_Y0 + VOL_H;

const GAP = 2; // 이웃한 봉 사이의 여백. 테두리 대신 이 빈틈이 봉을 갈라 준다.
const MAX_BODY = 14;

/**
 * 값이 없으면 `null`. **빈 값을 먼저 걸러야 한다** — `Number(null)` 과 `Number("")` 은 둘 다
 * `0` 이라, 그냥 `Number()` 에 넣으면 "고가 없음" 이 "고가 0원" 이 되어 있지도 않은 폭락을
 * 그린다. 시가 73,000 짜리 봉이 0 까지 꽂히는 그림이 나온다.
 */
const num = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** 눈금은 1/2/5 × 10^k 로만 끊는다. 73,412 같은 눈금은 읽는 데 품이 든다. */
export function niceTicks(min, max, count = 4) {
  if (!Number.isFinite(min) || !Number.isFinite(max) || !(max > min)) return [];
  const raw = (max - min) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = ([1, 2, 5, 10].find((m) => m * mag >= raw) ?? 10) * mag;
  const out = [];
  for (let v = Math.ceil(min / step) * step; v <= max + step * 1e-6; v += step) {
    out.push(Math.round(v * 1e6) / 1e6);
  }
  return out;
}

/**
 * 응답 행을 그리기 좋은 모양으로 눕힌다.
 *
 * 서버는 최신순(`-date` / `-ts`)으로 주므로 오름차순으로 뒤집는다.
 * 시/고/저/종 중 하나라도 비면 그 봉은 버린다 — 0 으로 채우면 있지도 않은 폭락을 그린다.
 */
export function normalize(rows, kind) {
  const out = [];
  for (const r of rows || []) {
    const o = num(r.open);
    const h = num(r.high);
    const l = num(r.low);
    const c = num(r.close);
    if (o == null || h == null || l == null || c == null) continue;
    const key = kind === "minute" ? r.ts : r.date;
    if (!key) continue;
    out.push({
      key,
      o,
      h,
      l,
      c,
      v: num(r.volume) ?? 0,
      short: kind === "minute" ? clockTime(r.ts) : shortDate(r.date),
      long: kind === "minute" ? `${isoDate(r.ts)} ${clockTime(r.ts)}` : dateWithWeekday(r.date),
    });
  }
  return out.sort((a, b) => String(a.key).localeCompare(String(b.key)));
}

/**
 * 값 → 좌표 변환기.
 *
 * 가격과 거래량은 단위가 다르다. 한 격자에 y축 둘을 얹으면 두 축의 정렬이 임의로 정해지면서
 * 데이터에 없는 상관을 만들어 낸다. 그래서 `y`(가격)와 `vy`(거래량)는 **서로 다른 패널**에
 * 떨어뜨려 두고 x 만 공유한다.
 */
export function buildScale(points) {
  if (!points?.length) return null;

  let lo = Math.min(...points.map((p) => p.l));
  let hi = Math.max(...points.map((p) => p.h));
  if (hi === lo) {
    // 봉이 하나뿐이거나 값이 전부 같으면 폭이 0 이라 눈금이 안 선다(0 으로 나누면 NaN).
    const pad = Math.abs(hi) * 0.01 || 1;
    lo -= pad;
    hi += pad;
  } else {
    const pad = (hi - lo) * 0.06;
    lo -= pad;
    hi += pad;
  }

  const maxVol = Math.max(1, ...points.map((p) => p.v));
  const band = PLOT_W / points.length;

  return {
    lo,
    hi,
    maxVol,
    band,
    body: Math.max(1, Math.min(MAX_BODY, band - GAP)),
    x: (i) => PAD_L + band * (i + 0.5),
    y: (v) => PRICE_Y1 - ((v - lo) / (hi - lo)) * PRICE_H,
    vy: (v) => VOL_Y1 - (v / maxVol) * VOL_H,
  };
}

/** 포인터 x 위치(0~1) → 봉 인덱스. */
export function indexAtRatio(ratio, scale, count) {
  const i = Math.round((ratio * W - PAD_L) / scale.band - 0.5);
  return Math.max(0, Math.min(count - 1, i));
}

/** x축 글자는 다 찍으면 겹친다. 폭에 맞춰 몇 개씩 건너뛸지 정한다. */
export const tickStride = (count) => Math.max(1, Math.ceil(count / 7));

/** 봉 `count` 개를 그릴 때의 한 칸 폭. 창을 바꿔 가며 좌표를 물을 때 쓴다. */
export const bandFor = (count) => PLOT_W / Math.max(1, count);

/** 이 개수 밑으로는 더 확대하지 않는다. 봉 몇 개만 남으면 추세가 안 읽힌다. */
export const MIN_BARS = 8;

/**
 * 확대/축소 — 보이는 구간 `{start, end}` 를 좁히거나 넓힌다.
 *
 * **커서가 짚고 있던 봉을 제자리에 둔다.** 그냥 가운데를 기준으로 줄이면, 보려던 구간이
 * 확대할 때마다 화면 밖으로 밀려나 다시 찾아가야 한다. 커서 아래의 봉이 화면에서 차지하던
 * 가로 위치(`frac`)를 그대로 유지하도록 새 시작점을 역산한다.
 *
 * `anchorLocal` 은 지금 보이는 구간 안에서의 인덱스(0..count-1)다.
 */
export function zoomWindow(win, total, anchorLocal, factor, minBars = MIN_BARS) {
  const count = win.end - win.start;
  const floor = Math.min(minBars, total);
  const next = Math.max(floor, Math.min(Math.round(count * factor), total));
  if (next === count) return win;

  const frac = count > 1 ? anchorLocal / (count - 1) : 0;
  const anchorGlobal = win.start + anchorLocal;
  const start = Math.max(0, Math.min(Math.round(anchorGlobal - frac * (next - 1)), total - next));
  return { start, end: start + next };
}

/** 좌우 이동 — 보이는 개수는 그대로 두고 구간만 민다. 양끝에서는 더 안 밀린다. */
export function panWindow(win, total, bars) {
  const count = win.end - win.start;
  const start = Math.max(0, Math.min(win.start + Math.round(bars), total - count));
  return { start, end: start + count };
}
