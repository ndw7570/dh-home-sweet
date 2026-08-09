import AsyncState from "../components/AsyncState";
import Badge, { TrendBadge } from "../components/Badge";
import Panel from "../components/Panel";
import { listMarketDirections } from "../api/trading";
import { isoDate } from "../lib/format";
import { useAsync } from "../lib/useAsync";
import "./MarketPage.css";

/**
 * 시장 — "무엇 때문에 시장을 이렇게 보는가".
 *
 * `factor_value`(수치)를 근거와 같은 행에 남기는 것이 이 테이블의 핵심이다.
 * "금리가 부담된다" 같은 문장만 남기면 나중에 그 판단이 맞았는지 확인할 방법이 없다.
 * 숫자를 같이 적어 두면 그 숫자가 실제로 어떻게 움직였는지와 대조할 수 있다.
 *
 * 영향받는 종목은 두 갈래로 온다.
 *   - `affected_securities` : 실제 종목 행 (정확)
 *   - `affected_targets`    : 섹터·지수 등 종목이 아닌 대상 (JSONB, 보조)
 */
export default function MarketPage() {
  const { data, error, loading, reload } = useAsync(() => listMarketDirections(), []);

  return (
    <AsyncState loading={loading} error={error} onRetry={reload}>
      {data && (
        <Panel
          title="시장방향"
          meta={`${data.length}건`}
          note="근거 없이 방향만 바꾸는 것은 서버가 막는다(rationale 필수). 방향 전환에는 항상 이유가 붙어 있어야 한다."
        >
          {data.length === 0 ? (
            <p className="mp-empty">아직 기록한 시장방향이 없다.</p>
          ) : (
            <ul className="mp-list">
              {data.map((d) => (
                <li key={d.id} className="mp-item">
                  <div className="mp-head">
                    <Badge row={d} field="factor_type" tone="accent" />
                    <TrendBadge row={d} field="direction" />
                    {d.factor_value != null && (
                      <span className="mp-value num" title="이 판단의 근거가 된 수치">
                        {d.factor_value}
                      </span>
                    )}
                    <span className="mp-date num">{isoDate(d.created_at)}</span>
                  </div>

                  {d.content && <p className="mp-content">{d.content}</p>}
                  {d.rationale && (
                    <p className="mp-sub">
                      <span>근거</span> {d.rationale}
                    </p>
                  )}

                  {d.affected_securities?.length > 0 && (
                    <div className="mp-affected">
                      <span className="mp-affected-label">영향 종목</span>
                      {d.affected_securities.map((s) => (
                        <span key={s.id} className="mp-chip num">
                          {s.name} {s.symbol}
                        </span>
                      ))}
                    </div>
                  )}

                  {d.affected_targets && (
                    <div className="mp-affected">
                      <span className="mp-affected-label">영향 대상</span>
                      {Object.entries(d.affected_targets).map(([key, values]) => (
                        <span key={key} className="mp-chip is-loose">
                          {key}: {Array.isArray(values) ? values.join(", ") : String(values)}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}
    </AsyncState>
  );
}
