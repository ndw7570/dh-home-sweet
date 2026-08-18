import { isoDate, minutesSince, price, sinceLabel } from "../lib/format";
import "./MarketStatus.css";

/**
 * 종목의 실효 시세 표시 — `securities` 응답의 `live` 객체를 읽는다.
 *
 * `current_price` 는 **사람이 적은 값**이고 `live.price` 는 **수집기가 KIS 에서 받아 온 값**이다.
 * 둘이 다른 것은 고장이 아니라 정상이고, 나란히 두는 것이 이 화면의 쓸모다 — 적어 둔 값이
 * 얼마나 낡았는지가 그 자리에서 드러난다(현대차가 수기 446,000 / 실제 438,500 이던 적이 있다).
 * 그래서 어느 한쪽으로 덮어쓰지 않는다.
 *
 * `live` 는 **항상 존재한다.** 값이 없어도 `null` 이 아니라 `{price:null, at:null, source:null,
 * market_value:null}` 로 온다. 그리고 `live.price`·`live.market_value` 는 **문자열**이다
 * (다른 금액 필드와 형식을 맞춘 것) — 계산 전에 반드시 Number 를 거친다.
 */

/** 이만큼 지나도록 갱신이 없으면 수집이 멈춘 것으로 본다(현재가 주기는 5분이다). */
export const STALE_MINUTES = 30;

/** 장중 실시간으로 잡힌 값인가. SNAPSHOT 과 MINUTE 은 화면에서 구분할 이유가 없다. */
const isIntraday = (source) => source === "SNAPSHOT" || source === "MINUTE";

const toNum = (v) => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** 화면이 쓸 시세 하나. 수집값이 있으면 그것, 없으면 사람이 적은 값으로 물러난다. */
export const livePrice = (s) => toNum(s?.live?.price) ?? toNum(s?.current_price);

/**
 * 화면이 쓸 평가금액.
 * 기존 `market_value` 는 숫자고 `live.market_value` 는 문자열이라 양쪽 다 Number 를 거친다.
 */
export const liveMarketValue = (s) => toNum(s?.live?.market_value) ?? toNum(s?.market_value) ?? 0;

/**
 * 관측 시각을 사람 말로.
 *
 * `DAILY` 를 상대시간으로 쓰면 장 마감 후에 "18시간 전" 처럼 나와 고장난 것처럼 읽힌다.
 * 그건 낡은 값이 아니라 그날의 확정 종가라 날짜 + `종가` 로 적는다.
 */
export function liveWhen(live) {
  if (!live?.at) return "";
  if (live.source === "DAILY") return `${isoDate(live.at).slice(5).replace("-", "/")} 종가`;
  return sinceLabel(live.at);
}

/**
 * 목록 행의 시세 칸 — 수집값을 크게, 수기값을 아래 작게.
 *
 * 값만 찍지 않고 **얼마나 낡았는지**를 같이 낸다. 30분 지난 438,500 은 현재가가 아니라
 * 흔적인데, 숫자만 두면 둘이 구분되지 않는다.
 */
export function LivePriceCell({ security }) {
  const live = security?.live;
  const collected = toNum(live?.price);
  const manual = toNum(security?.current_price);

  /**
   * 관리대상이 꺼져 있으면 수집이 아예 안 돈다 — 값이 멈춰 있는 이유가 이것이다.
   * 종목 칸의 `관리 제외` 배지만으로는 그게 시세와 무슨 상관인지 이어지지 않아서,
   * 시세 칸에서 한 번 더 말한다. 여기 남은 값은 수집이 돌던 마지막 흔적이다.
   */
  const off = security?.is_active === false;

  // 값이 안 도는 이유는 한 번에 하나만 말한다. 배지를 둘씩 달면 무엇이 원인인지 흐려진다.
  const badge = off
    ? { text: "수집 안 함", title: "종목의 `관리대상` 이 꺼져 있어 수집이 돌지 않는다" }
    : collected == null
      ? { text: "미수집", title: "수집 대상이지만 시세를 아직 한 번도 못 가져왔다" }
      : null;

  // 보여 줄 값. 수집값이 없으면 사람이 적어 둔 값으로 물러난다.
  const shown = collected ?? manual;

  const age = collected == null ? null : minutesSince(live.at);
  /**
   * 장중 값(SNAPSHOT/MINUTE)인데 30분 넘게 그대로면 수집이 멈춘 것이다.
   * 이 판정에는 장 시간표가 필요 없다 — 그 값이 '가장 최근 관측' 으로 뽑혔는데도
   * 30분 낡았다는 사실 자체가 곧 수집이 멎었다는 뜻이다.
   * 관리대상을 끈 종목은 멈춘 게 아니라 **끈 것**이라 여기서 뺀다.
   */
  const stale = !off && isIntraday(live?.source) && age != null && age > STALE_MINUTES;

  // 수기값과 얼마나 벌어졌나. 수집값이 있고 값이 다를 때만 두 줄로 쓴다.
  const gap = collected != null && manual != null ? collected - manual : null;

  return (
    <span className="ms-cell">
      <span className="ms-live">
        <span className={`num ms-price ${stale || off || collected == null ? "is-stale" : ""}`}>
          {shown == null ? "—" : price(shown)}
        </span>
        {collected != null && (
          <span className="ms-since" title={live.at || undefined}>
            {liveWhen(live)}
            {stale && " · 멈춘 듯"}
          </span>
        )}
        {badge && (
          <span className="ms-badge is-off" title={badge.title}>
            {badge.text}
          </span>
        )}
      </span>
      {gap != null && gap !== 0 && (
        <span className="ms-manual num" title="사람이 입력해 둔 현재가">
          수기 {price(manual)}
          <span className={`ms-gap ${gap > 0 ? "is-up" : "is-down"}`}>
            {gap > 0 ? "▲" : "▼"} {price(Math.abs(gap))}
          </span>
        </span>
      )}
    </span>
  );
}

/**
 * 수집이 멈춘 것 같을 때만 뜨는 배너.
 *
 * **장 시간을 판정하지 않는다.** 백엔드가 세 후보(현재가 스냅샷/분봉/일봉) 중 가장 최근
 * 관측을 골라 주므로, 마감 후·주말이면 `source` 가 저절로 `DAILY` 로 넘어간다. 그래서
 * "장중 값이 뽑혔는데 30분 낡았다" 만 보면 되고, 휴장일 달력이 틀려서 화면이 거짓 경고를
 * 내는 일이 없다.
 *
 * 경고하지 않는 두 경우 —
 *   아예 수집된 적 없는 종목(`price: null`)은 멈춘 게 아니라 시작 전이고, 행마다
 *   `미수집` 로 이미 보인다.
 *   `관리대상` 이 꺼진 종목은 멈춘 게 아니라 **사용자가 끈 것**이다. 이걸 안 빼면
 *   관리에서 제외할 때마다 고장 경고가 뜬다.
 */
export function MarketStatusBanner({ securities, now = new Date() }) {
  const stale = (securities || []).filter((s) => {
    if (s?.is_active === false) return false;
    const live = s?.live;
    if (!live?.at || live.price == null || !isIntraday(live.source)) return false;
    const age = minutesSince(live.at, now);
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
