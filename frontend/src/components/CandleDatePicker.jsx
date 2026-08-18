import { listDailyCandles } from "../api/trading";
import { errorDetail } from "../lib/apiError";
import { dateWithWeekday, price, todayISODate } from "../lib/format";
import { useAsync } from "../lib/useAsync";
import "./CandleDatePicker.css";

/**
 * 스냅샷을 뜰 **기준 일자**를 고른다.
 *
 * 날짜 입력칸(`<input type="date">`) 대신 목록을 두는 이유가 둘이다.
 *   1. 고를 수 있는 날은 **일봉이 수집된 날**뿐이다. 자유 입력이면 휴장일이나 수집 안 된 날을
 *      골라 놓고 저장 단계에서야 "시세가 없다" 를 듣게 된다.
 *   2. 목록에 고가·저가·종가가 이미 들어 있다. 어느 날을 고를지는 숫자를 보고 정하는
 *      일이라, 날짜만 늘어놓으면 고른 뒤에 다시 확인하러 가야 한다.
 *
 * 값으로 들고 있는 것은 날짜가 아니라 `price_at`(datetime) 이다 — 실제 컬럼이 그것이라
 * 중간 상태를 하나 더 두지 않는다. 과거는 그날 15:30 KST, 오늘은 지금 시각으로 만든다.
 */

/** 고른 날짜 → 저장할 `price_at`. 과거는 장 마감 시각, 오늘은 지금. */
export const priceAtForDate = (date, now = new Date()) =>
  date === todayISODate() ? now.toISOString() : `${date}T15:30:00+09:00`;

/** `price_at` → 목록에서 켜 둘 날짜. 로컬(KST) 기준으로 되돌린다. */
const dateOfPriceAt = (v) => {
  if (!v) return "";
  const t = new Date(v);
  if (Number.isNaN(t.getTime())) return String(v).slice(0, 10);
  const p = (n) => String(n).padStart(2, "0");
  return `${t.getFullYear()}-${p(t.getMonth() + 1)}-${p(t.getDate())}`;
};

export default function CandleDatePicker({ symbol, value, onChange }) {
  const { data, error, loading } = useAsync(
    () => (symbol ? listDailyCandles({ symbol, ordering: "-date" }) : Promise.resolve([])),
    [symbol]
  );

  if (!symbol) {
    return <p className="cdp-idle">종목을 먼저 고르면 담을 수 있는 일자가 나온다.</p>;
  }
  if (loading) return <p className="cdp-idle">수집된 일자를 불러오는 중…</p>;
  if (error) return <p className="cdp-error">일자를 불러오지 못했다 — {errorDetail(error)}</p>;

  const rows = data || [];
  if (!rows.length) {
    return (
      <p className="cdp-error">
        이 종목은 수집된 일봉이 없다. 종목의 `관리대상` 을 켜고 `kis_backfill_daily` 를 돌리면
        채워진다. 그때까지는 아래에서 값을 직접 입력한다.
      </p>
    );
  }

  const today = todayISODate();
  const picked = dateOfPriceAt(value);

  return (
    <div className="cdp">
      <div className="cdp-head" aria-hidden="true">
        <span>일자</span>
        <span>고가</span>
        <span>저가</span>
        <span>종가</span>
      </div>
      <ul className="cdp-list" role="radiogroup" aria-label="기준 일자">
        {rows.map((c) => {
          const isToday = c.date === today;
          const on = picked === c.date;
          return (
            <li key={c.date}>
              <label className={`cdp-row ${on ? "is-on" : ""}`}>
                <input
                  type="radio"
                  name="cdp-date"
                  className="cdp-radio"
                  checked={on}
                  onChange={() => onChange(priceAtForDate(c.date))}
                />
                <span className="cdp-date num">
                  {dateWithWeekday(c.date)}
                  {/* 오늘 것은 아직 확정이 아니다. 장이 끝나면 값이 달라진다. */}
                  {isToday && <span className="cdp-today">오늘 · 진행 중</span>}
                </span>
                <span className="num">{price(c.high)}</span>
                <span className="num">{price(c.low)}</span>
                <span className="num">{price(c.close)}</span>
              </label>
            </li>
          );
        })}
      </ul>
      <p className="cdp-foot">
        {rows.length}거래일 · {rows[rows.length - 1].date} ~ {rows[0].date}. 휴장일은 목록에
        없다. 더 과거가 필요하면 `kis_backfill_daily --days 365` 를 돌린다.
      </p>
    </div>
  );
}
