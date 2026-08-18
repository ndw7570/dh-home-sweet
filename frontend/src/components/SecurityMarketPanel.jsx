import { useMemo, useState } from "react";

import AsyncState from "./AsyncState";
import CandleChart from "./CandleChart";
import Panel from "./Panel";
import { listDailyCandles, listMinuteCandles } from "../api/trading";
import { daysAgoISODate, todayISODate } from "../lib/format";
import { useAsyncAll } from "../lib/useAsync";
import "./SecurityMarketPanel.css";

/**
 * 고른 종목의 수집 시세 — 일봉 + 당일 분봉.
 *
 * **종목 없이는 아무것도 부르지 않는다.** 봉 API 는 종목을 지정하지 않은 목록 조회를
 * 400 으로 막는다 — 전체 봉을 긁는 질의는 수백만 행까지 가서 DB 와 화면이 함께 멈추기
 * 때문이다. 그래서 이 컴포넌트는 종목이 정해진 뒤에만 마운트한다(부모가 그렇게 쓴다).
 *
 * 0건이 기본 상태다. 아직 KIS 키가 안 들어가 봉 테이블이 비어 있고, 관리대상이 아닌
 * 종목은 앞으로도 안 쌓인다. 빈 차트를 그리는 대신 왜 비었는지를 말한다.
 */

const RANGES = [
  { key: "1m", label: "1개월", days: 30 },
  { key: "3m", label: "3개월", days: 90 },
  { key: "1y", label: "1년", days: 365 },
];

export default function SecurityMarketPanel({ security, entry, onClose }) {
  const [range, setRange] = useState("3m");
  const symbolCode = security?.symbol;
  const days = RANGES.find((r) => r.key === range)?.days ?? 90;

  const today = todayISODate();
  const dateFrom = useMemo(() => daysAgoISODate(days), [days]);

  const { data, error, loading, reload } = useAsyncAll(
    {
      daily: () =>
        listDailyCandles({ symbol: symbolCode, date_from: dateFrom, date_to: today }),
      minute: () => listMinuteCandles({ symbol: symbolCode, date: today }),
    },
    [symbolCode, dateFrom, today]
  );

  // 왜 비었는지는 상황마다 다르다. "데이터 없음" 한 줄로 뭉치면 사용자가 할 일을 못 찾는다.
  const emptyHint = !entry
    ? "이 종목코드로 등록된 수집 종목이 없다. 수집기가 한 번 돌면 종목 행부터 만들어진다."
    : entry.is_target
      ? "수집 대상이긴 하다. 아직 한 번도 안 쌓였거나 수집기가 돌기 전이다."
      : "이 종목은 수집 대상이 아니다 — 종목 수정에서 `관리대상` 을 켜면 다음 수집 주기부터 쌓인다.";

  return (
    <Panel
      title={`시세 — ${security.name}`}
      meta={security.symbol}
      note="사람이 적은 현재가와 달리 이건 수집기가 KIS 에서 받아 온 값이다. 둘이 다르면 적어 둔 값이 낡은 것이다."
      actions={
        <span className="smp-actions">
          <span className="smp-ranges" role="group" aria-label="조회 구간">
            {RANGES.map((r) => (
              <button
                key={r.key}
                type="button"
                className={`smp-range ${range === r.key ? "is-on" : ""}`}
                aria-pressed={range === r.key}
                onClick={() => setRange(r.key)}
              >
                {r.label}
              </button>
            ))}
          </span>
          <button type="button" className="row-edit" onClick={onClose}>
            닫기
          </button>
        </span>
      }
    >
      <AsyncState loading={loading} error={error} onRetry={reload}>
        {data && (
          <div className="smp">
            <section className="smp-chart">
              <h3 className="smp-h">
                일봉
                <span className="smp-h-meta num">
                  {dateFrom} ~ {today} · {data.daily.length}봉
                </span>
              </h3>
              <CandleChart
                rows={data.daily}
                kind="day"
                label={`${security.name} 일봉`}
                emptyText="수집된 시세가 없습니다."
                emptyHint={emptyHint}
              />
            </section>

            <section className="smp-chart">
              <h3 className="smp-h">
                분봉
                <span className="smp-h-meta num">
                  {today} · {data.minute.length}봉
                </span>
              </h3>
              <CandleChart
                rows={data.minute}
                kind="minute"
                label={`${security.name} 당일 분봉`}
                emptyText="오늘 분봉이 아직 없습니다."
                emptyHint={
                  entry?.is_target
                    ? "분봉은 당일치만 쌓인다. 장 시작 전이거나 첫 수집 주기(10분) 전이면 0건이 정상이다."
                    : emptyHint
                }
              />
            </section>
          </div>
        )}
      </AsyncState>
    </Panel>
  );
}
