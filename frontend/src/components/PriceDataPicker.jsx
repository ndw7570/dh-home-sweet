import { useMemo, useState } from "react";

import CandleChart from "./CandleChart";
import { priceAtForDate } from "./CandleDatePicker";
import { listDailyCandles, priceData as priceDataApi } from "../api/trading";
import { errorDetail } from "../lib/apiError";
import { dateWithWeekday, isoDate, price, todayISODate } from "../lib/format";
import { useAsync } from "../lib/useAsync";
import "./PriceDataPicker.css";

/**
 * 전략의 **기준 가격데이터**를 고른다 — 드롭다운이 아니라 일자 목록으로.
 *
 * 전에는 이미 만들어 둔 가격데이터를 드롭다운에서 골랐다. 그러면 전략을 세우기 전에
 * 가격데이터 화면으로 가서 스냅샷을 먼저 만들고 돌아와야 했고, 목록에는 `#3 현대차
 * 438,000원 08-13 10:04` 같은 줄만 보여서 그게 어느 날의 무슨 가격인지 알기 어려웠다.
 *
 * 지금은 **종목 → 그 종목의 거래일 목록**을 보고 하루를 고른다. 목록에 그날의 고가·저가·
 * 종가가 함께 있어서 "어느 가격대에 분할을 걸지" 를 보면서 정할 수 있다.
 *
 * 고른 날의 스냅샷이 이미 있으면 **그걸 다시 쓴다.** 없을 때만 그 자리에서 만든다 —
 * 같은 날 같은 종목의 스냅샷이 여럿 쌓이면 전략마다 다른 행을 가리키게 되고, 나중에
 * "이 전략의 근거" 를 물었을 때 답이 갈린다.
 *
 * 고르는 방법은 둘이다.
 *   목록  숫자를 나란히 놓고 읽는다. 특정 값을 찾을 때 빠르다.
 *   차트  캔들을 눌러 고른다. **고저 폭이 비슷한 날을 찾을 때는 이쪽이다** — 표에서
 *         80줄의 뺄셈을 눈으로 하는 것보다, 고른 날의 고가~저가를 가로 띠로 깔아 두고
 *         그 구간에 드는 봉을 보는 편이 훨씬 빠르다.
 */

/** `price_at` → 로컬(KST) 날짜. 같은 날의 스냅샷을 찾는 열쇠다. */
const dateOf = (row) => isoDate(row?.price_at);

export default function PriceDataPicker({ securities, priceRows, value, onChange }) {
  const known = priceRows || [];
  // 방금 만든 스냅샷. 목록 재조회를 기다리지 않고 바로 요약에 쓴다.
  const [created, setCreated] = useState([]);
  const all = useMemo(() => [...known, ...created], [known, created]);

  const selected = all.find((r) => String(r.id) === String(value)) || null;
  // 고른 스냅샷이 있으면 그 종목에서 시작한다 — 바꾸러 들어왔을 때 목록이 비어 있지 않게.
  const [securityId, setSecurityId] = useState(() => (selected ? String(selected.security) : ""));
  const [busyDate, setBusyDate] = useState(null);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState("chart");

  const security = (securities || []).find((s) => String(s.id) === String(securityId));
  const { data: candles, loading } = useAsync(
    () =>
      security?.symbol
        ? listDailyCandles({ symbol: security.symbol, ordering: "-date" })
        : Promise.resolve([]),
    [security?.symbol]
  );

  /**
   * 차트에 넘길 봉. **반드시 메모해서 같은 배열을 넘긴다** — 매 렌더 새 배열을 주면
   * CandleChart 안에서 points 가 매번 새로 만들어지고, 거기 걸린 초기화 effect 가
   * 커서를 계속 지워 호버·키보드 이동이 먹지 않는다.
   *
   * 60거래일까지만 그린다. 80개를 다 넣으면 캔들 폭이 1px 로 눌려서 고저 폭을 눈으로
   * 비교하는 일 자체가 안 된다.
   */
  const chartRows = useMemo(() => (candles || []).slice(0, 60), [candles]);

  /** 이 종목으로 이미 떠 둔 날짜들. 차트 축 아래 점으로 표시한다. */
  const markedDates = useMemo(
    () =>
      new Set(
        all.filter((r) => String(r.security) === String(securityId)).map((r) => dateOf(r))
      ),
    [all, securityId]
  );

  /** 이 종목·이 날짜로 이미 떠 둔 스냅샷. */
  const snapshotFor = (date) =>
    all.find((r) => String(r.security) === String(securityId) && dateOf(r) === date) || null;

  const pick = async (date) => {
    // 만드는 중에 또 누르면 같은 날 스냅샷이 둘 생긴다. 차트는 클릭 한 번이 쉬워서 더 그렇다.
    if (busyDate) return;
    const existing = snapshotFor(date);
    if (existing) {
      onChange(existing.id);
      return;
    }
    setBusyDate(date);
    setError(null);
    try {
      // 고가·저가·현재가는 안 보낸다. 백엔드가 그날 봉에서 읽어 채운다.
      const row = await priceDataApi.create({
        security: Number(securityId),
        price_at: priceAtForDate(date),
      });
      setCreated((c) => [...c, row]);
      onChange(row.id);
    } catch (e) {
      setError(errorDetail(e));
    } finally {
      setBusyDate(null);
    }
  };

  if (selected) {
    const secLabel = (securities || []).find((s) => String(s.id) === String(selected.security));
    return (
      <div className="pdp-picked">
        <div className="pdp-picked-main">
          <strong className="num pdp-picked-when">{dateWithWeekday(dateOf(selected))}</strong>
          <span className="pdp-picked-sec">
            {secLabel ? `${secLabel.name} (${secLabel.symbol})` : `종목 #${selected.security}`}
          </span>
        </div>
        <dl className="pdp-picked-nums">
          <div>
            <dt>고가</dt>
            <dd className="num">{price(selected.high_price)}</dd>
          </div>
          <div>
            <dt>저가</dt>
            <dd className="num">{price(selected.low_price)}</dd>
          </div>
          <div>
            <dt>현재가</dt>
            <dd className="num">{price(selected.current_price)}</dd>
          </div>
        </dl>
        <button type="button" className="row-edit" onClick={() => onChange("")}>
          다시 고르기
        </button>
      </div>
    );
  }

  return (
    <div className="pdp">
      <label className="pdp-sec">
        <span>종목</span>
        <select
          className="ff-input"
          value={securityId}
          onChange={(e) => setSecurityId(e.target.value)}
        >
          <option value="">선택 안 함</option>
          {(securities || []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.symbol})
            </option>
          ))}
        </select>
      </label>

      {error && <p className="pdp-error">{error}</p>}

      {securityId && (candles || []).length > 0 && (
        <div className="pdp-modes" role="group" aria-label="고르는 방법">
          {[
            { key: "chart", label: "차트에서 고르기" },
            { key: "list", label: "목록에서 고르기" },
          ].map((m) => (
            <button
              key={m.key}
              type="button"
              className={`pdp-mode ${mode === m.key ? "is-on" : ""}`}
              aria-pressed={mode === m.key}
              onClick={() => setMode(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

      {!securityId ? (
        <p className="pdp-idle">종목을 고르면 담을 수 있는 거래일이 나온다.</p>
      ) : loading ? (
        <p className="pdp-idle">거래일을 불러오는 중…</p>
      ) : !(candles || []).length ? (
        <p className="pdp-error">
          이 종목은 수집된 일봉이 없다. 종목의 `관리대상` 을 켜고 `kis_backfill_daily` 를
          돌리면 채워진다.
        </p>
      ) : mode === "chart" ? (
        <>
          <CandleChart
            rows={chartRows}
            kind="day"
            label={`${security.name} 일봉`}
            onPick={(pt) => pick(pt.key)}
            markedKeys={markedDates}
            selectedKey={busyDate}
          />
          <p className="pdp-foot">
            캔들을 눌러 그 날을 담는다(키보드는 ←/→ 로 옮기고 Enter). 커서를 올린 날의
            고가~저가가 가로 띠로 깔리므로, <strong>비슷한 폭의 날</strong>이 그 띠에
            드는지로 찾으면 된다. 축 아래 점이 찍힌 날은 이미 담아 둔 날이다.
          </p>
        </>
      ) : (
        <>
          <div className="pdp-head" aria-hidden="true">
            <span>일자</span>
            <span>고가</span>
            <span>저가</span>
            <span>종가</span>
            <span />
          </div>
          <ul className="pdp-list">
            {candles.map((c) => {
              const has = snapshotFor(c.date);
              const busy = busyDate === c.date;
              return (
                <li key={c.date}>
                  <button
                    type="button"
                    className="pdp-row"
                    disabled={Boolean(busyDate)}
                    onClick={() => pick(c.date)}
                  >
                    <span className="pdp-date num">
                      {dateWithWeekday(c.date)}
                      {c.date === todayISODate() && (
                        <span className="pdp-today">오늘 · 진행 중</span>
                      )}
                    </span>
                    <span className="num">{price(c.high)}</span>
                    <span className="num">{price(c.low)}</span>
                    <span className="num">{price(c.close)}</span>
                    <span className="pdp-state">
                      {busy ? "담는 중…" : has ? "담긴 것 재사용" : "담기"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="pdp-foot">
            고른 날의 스냅샷이 이미 있으면 그걸 다시 쓴다. 없으면 그 자리에서 만든다 —
            고가·저가·현재가는 그날 봉에서 읽어 채워지고, 한 번 만들어지면 다시 안 바뀐다.
          </p>
        </>
      )}
    </div>
  );
}
