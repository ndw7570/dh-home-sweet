import { minutesSince, price, sinceLabel } from "../lib/format";
import "./MarketStatus.css";

/**
 * 수집 시세의 상태 표시.
 *
 * `securities.current_price` 는 **사람이 적은 값**이고 `market_symbols.last_price` 는
 * **수집기가 KIS 에서 받아 온 값**이다. 둘이 다른 것은 고장이 아니라 정상이고, 나란히
 * 두는 것이 이 화면의 쓸모다 — 사람이 적어 둔 값이 얼마나 낡았는지가 그 자리에서 드러난다.
 * 그래서 어느 한쪽으로 덮어쓰거나 하나만 보여 주지 않는다.
 */

/** 장중 판정선. 브라우저 로컬시각을 KST 로 본다 — 이 앱의 다른 날짜 계산과 같은 전제다. */
const OPEN_MIN = 9 * 60;
const CLOSE_MIN = 15 * 60 + 30;

/** 이만큼 지나도록 갱신이 없으면 수집이 멈춘 것으로 본다(현재가 주기는 5분이다). */
export const STALE_MINUTES = 30;

export function inMarketHours(now = new Date()) {
  const day = now.getDay();
  if (day === 0 || day === 6) return false;
  const mins = now.getHours() * 60 + now.getMinutes();
  return mins >= OPEN_MIN && mins <= CLOSE_MIN;
}

/**
 * 목록 행의 `수집시세` 칸.
 *
 * 값만 찍지 않고 **얼마나 낡았는지**를 같이 낸다. 30분 낡은 73,800 은 현재가가 아니라
 * 흔적인데, 숫자만 두면 둘이 구분되지 않는다.
 */
export function MarketPriceCell({ entry }) {
  // market_symbols 에 아예 행이 없다 — 아직 수집 대상으로 등록되지 않은 종목이다.
  if (!entry) return <span className="ms-none">수집 대상 아님</span>;

  if (!entry.is_target) {
    return (
      <span className="ms-cell">
        {entry.last_price == null ? (
          <span className="ms-none">미조회</span>
        ) : (
          <span className="num ms-price is-stale">{price(entry.last_price)}</span>
        )}
        <span className="ms-badge is-off" title="종목의 `관리대상` 이 꺼져 있어 수집이 돌지 않는다">
          수집 안 함
        </span>
      </span>
    );
  }

  if (entry.last_price == null) {
    return (
      <span className="ms-cell">
        <span className="ms-none" title="수집 대상이지만 아직 한 번도 못 가져왔다">
          미조회
        </span>
      </span>
    );
  }

  const age = minutesSince(entry.last_price_at);
  const stale = age != null && age > STALE_MINUTES;
  return (
    <span className="ms-cell">
      <span className={`num ms-price ${stale ? "is-stale" : ""}`}>{price(entry.last_price)}</span>
      <span className="ms-since" title={entry.last_price_at || undefined}>
        {sinceLabel(entry.last_price_at)}
      </span>
    </span>
  );
}

/**
 * 수집이 멈춘 것 같을 때만 뜨는 배너.
 *
 * `last_price_at` 이 아예 없는 것(미조회)은 경고하지 않는다 — 키를 아직 안 넣었거나 이제
 * 막 등록한 종목일 뿐이고, 그건 행마다 `미조회` 로 이미 보인다. 한 번 받아 왔는데 장중에
 * 30분 넘게 안 바뀐 것만이 "돌던 것이 멈췄다" 는 뜻이다.
 */
export function MarketStatusBanner({ symbols, now = new Date() }) {
  if (!inMarketHours(now)) return null;

  const stale = (symbols || []).filter((s) => {
    if (!s.is_target || !s.last_price_at) return false;
    const age = minutesSince(s.last_price_at, now);
    return age != null && age > STALE_MINUTES;
  });
  if (!stale.length) return null;

  return (
    <p className="ms-banner" role="status">
      <span aria-hidden="true">⚠</span>
      <span>
        장중인데 <strong>{stale.length}종목</strong>의 시세가 {STALE_MINUTES}분 넘게 그대로다 —
        수집이 멈췄을 수 있다. ({stale.map((s) => s.name).join(", ")})
      </span>
    </p>
  );
}
