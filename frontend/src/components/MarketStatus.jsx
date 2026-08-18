import { isoDate, minutesSince, price, sinceLabel } from "../lib/format";
import "./MarketStatus.css";

/**
 * 종목의 현재주가와 **그 값이 언제·어디서 온 것인지**.
 *
 * `securities.current_price` 는 수집기가 직접 갱신한다(장중 5분, 마감 후 일봉). 그래서
 * 값은 컬럼 하나뿐이고, 화면이 덧붙일 것은 그 숫자를 읽는 데 필요한 맥락이다:
 *
 *     price_at      그 가격이 관측된 시각
 *     price_source  SNAPSHOT(장중 현재가) | MINUTE(분봉) | DAILY(종가) | null(수집 안 됨)
 *
 * 같은 숫자라도 장중 271,500 은 "지금 이 값" 이고 마감 후 271,500 은 "오늘 종가" 다.
 * `price_source` 가 null 이면 수집되지 않는 종목이라 사람이 입력한 값이 그대로 있는 것이다.
 *
 * (한때 백엔드가 `live` 객체로 시세를 따로 실어 보냈지만 `current_price` 와 중복이라
 * 없어졌다. 여기서 그 모양을 찾지 말 것.)
 */

/** 이만큼 지나도록 갱신이 없으면 수집이 멈춘 것으로 본다(장중 현재가 주기는 5분이다). */
export const STALE_MINUTES = 30;

/** 장중에 잡힌 값인가. SNAPSHOT 과 MINUTE 은 화면에서 구분할 이유가 없다. */
const isIntraday = (source) => source === "SNAPSHOT" || source === "MINUTE";

const toNum = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** 화면·계산이 쓸 현재주가. */
export const currentPriceOf = (s) => toNum(s?.current_price);

/** 화면·합계가 쓸 평가금액. 서버가 현재주가 × 보유수량으로 계산해 숫자로 준다. */
export const marketValueOf = (s) => toNum(s?.market_value) ?? 0;

/**
 * 관측 시각을 사람 말로.
 *
 * `DAILY` 를 상대시간으로 쓰면 마감 후에 "18시간 전" 처럼 나와 고장난 것처럼 읽힌다.
 * 그건 낡은 값이 아니라 그날의 확정 종가라 날짜 + `종가` 로 적는다.
 */
export function priceWhen(security) {
  const at = security?.price_at;
  if (!at) return "";
  if (security.price_source === "DAILY") return `${isoDate(at).slice(5).replace("-", "/")} 종가`;
  return sinceLabel(at);
}

/**
 * 목록 행의 현재가 칸 — 값 + 언제 것인지 + (필요하면) 왜 안 도는지.
 *
 * 값만 찍지 않고 **얼마나 낡았는지**를 같이 낸다. 30분 지난 장중값은 현재가가 아니라
 * 흔적인데, 숫자만 두면 둘이 구분되지 않는다.
 */
export function PriceCell({ security }) {
  const value = currentPriceOf(security);
  const source = security?.price_source ?? null;

  /**
   * 값이 안 도는 이유는 한 번에 하나만 말한다. 배지를 둘씩 달면 원인이 흐려진다.
   *   관리대상이 꺼져 있으면 수집이 아예 안 돈다 — 종목 칸의 `관리 제외` 배지만으로는
   *   그게 시세와 무슨 상관인지 이어지지 않아서 여기서 한 번 더 말한다.
   *   켜져 있는데 출처가 없으면 아직 한 번도 못 가져온 것이다(남은 값은 사람이 적은 것).
   */
  const off = security?.is_active === false;
  const badge = off
    ? { text: "수집 안 함", title: "종목의 `관리대상` 이 꺼져 있어 수집이 돌지 않는다" }
    : source == null
      ? { text: "수기 입력", title: "수집된 적이 없다. 사람이 넣은 값이 그대로 있다" }
      : null;

  const age = source == null ? null : minutesSince(security.price_at);
  /**
   * 장중 값인데 30분 넘게 그대로면 수집이 멈춘 것이다.
   * 장 시간표가 필요 없다 — 그 값이 '가장 최근 관측' 으로 뽑혔는데도 30분 낡았다는
   * 사실 자체가 곧 수집이 멎었다는 뜻이다. 관리대상을 끈 종목은 멈춘 게 아니라 **끈 것**이다.
   */
  const stale = !off && isIntraday(source) && age != null && age > STALE_MINUTES;

  return (
    <span className="ms-cell">
      <span className="ms-live">
        <span className={`num ms-price ${stale || off || source == null ? "is-stale" : ""}`}>
          {value == null ? "—" : price(value)}
        </span>
        {source != null && (
          <span className="ms-since" title={security.price_at || undefined}>
            {priceWhen(security)}
            {stale && " · 멈춘 듯"}
          </span>
        )}
        {badge && (
          <span className="ms-badge is-off" title={badge.title}>
            {badge.text}
          </span>
        )}
      </span>
    </span>
  );
}

/**
 * 수집이 멈춘 것 같을 때만 뜨는 배너.
 *
 * **장 시간을 판정하지 않는다.** 백엔드가 관측 시각을 비교해 출처를 고르므로, 마감 후·주말이면
 * `price_source` 가 저절로 `DAILY` 로 넘어간다. 그래서 "장중 값이 뽑혔는데 30분 낡았다" 만
 * 보면 되고, 휴장일 달력이 틀려서 거짓 경고가 뜨는 일이 없다.
 *
 * 수집된 적 없는 종목과 `관리대상` 이 꺼진 종목은 뺀다 — 멈춘 게 아니라 시작 전이거나
 * 사용자가 끈 것이고, 행마다 배지로 이미 보인다.
 */
export function MarketStatusBanner({ securities, now = new Date() }) {
  const stale = (securities || []).filter((s) => {
    if (s?.is_active === false || !isIntraday(s?.price_source) || !s?.price_at) return false;
    const age = minutesSince(s.price_at, now);
    return age != null && age > STALE_MINUTES;
  });
  if (!stale.length) return null;

  return (
    <p className="ms-banner" role="status">
      <span aria-hidden="true">⚠</span>
      <span>
        <strong>{stale.length}종목</strong>의 시세가 {STALE_MINUTES}분 넘게 그대로다 — 수집이
        멈췄을 수 있다. ({stale.map((s) => s.name).join(", ")})
      </span>
    </p>
  );
}
