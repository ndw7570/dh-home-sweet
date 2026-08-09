import { useEffect, useState } from "react";

import AsyncState from "../components/AsyncState";
import Panel from "../components/Panel";
import SplitTable from "../components/SplitTable";
import { fetchChoices, getTradingStrategy, listTradingStrategies } from "../api/trading";
import { dateTime, price } from "../lib/format";
import { useAsync } from "../lib/useAsync";
import "./StrategyPage.css";

/**
 * 전략 — n차 분할표.
 *
 * 전략이 가격데이터(`security_price_data`)를 가리킨다는 게 이 화면의 요점이다.
 * '지금 가격 기준'이 아니라 '그때 그 가격 기준'으로 못박혀 있어서,
 * 나중에 왜 이 가격대에 분할을 걸었는지 되짚을 수 있다.
 */
export default function StrategyPage() {
  const list = useAsync(() => listTradingStrategies(), []);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (!selectedId && list.data?.length) setSelectedId(list.data[0].id);
  }, [list.data, selectedId]);

  const detail = useAsync(
    () => (selectedId ? getTradingStrategy(selectedId) : Promise.resolve(null)),
    [selectedId]
  );

  return (
    <div className="stp">
      <AsyncState loading={list.loading} error={list.error} onRetry={list.reload}>
        {list.data && (
          <>
            {list.data.length === 0 ? (
              <Panel title="매수매도전략">
                <p className="stp-empty">
                  전략이 없다. 떨어지기 전에 몇 %에 얼마를 살지 적어 두지 않으면,
                  물타기는 계획이 아니라 반응이 된다.
                </p>
              </Panel>
            ) : (
              <>
                <nav className="stp-list" aria-label="전략 목록">
                  {list.data.map((s) => (
                    <button
                      key={s.id}
                      className={`stp-item ${selectedId === s.id ? "is-on" : ""}`}
                      onClick={() => setSelectedId(s.id)}
                    >
                      <strong>{s.policy_name || `전략#${s.id}`}</strong>
                      <span className="stp-item-meta num">
                        {s.sector || "업종 미지정"} · {s.method_count}단계
                      </span>
                    </button>
                  ))}
                </nav>

                <AsyncState
                  loading={detail.loading}
                  error={detail.error}
                  onRetry={detail.reload}
                >
                  {detail.data && (
                    <Panel
                      title={detail.data.policy_name || `전략#${detail.data.id}`}
                      meta={dateTime(detail.data.reference_at)}
                      note="분할표를 미리 채워 두는 것이 규율의 실체다. 수량 비중의 합이 100%가 아니면 그 자리에 표시된다."
                    >
                      {detail.data.price_data_detail && (
                        <div className="stp-price">
                          <span className="stp-price-label">기준 가격데이터</span>
                          <span className="num">
                            고가 {price(detail.data.price_data_detail.high_price)} · 저가{" "}
                            {price(detail.data.price_data_detail.low_price)} · 호가{" "}
                            {price(detail.data.price_data_detail.quote_price)}
                          </span>
                          <span className="num stp-price-at">
                            {dateTime(detail.data.price_data_detail.price_at)}
                          </span>
                        </div>
                      )}
                      <SplitTable methods={detail.data.methods} />
                    </Panel>
                  )}
                </AsyncState>
              </>
            )}
          </>
        )}
      </AsyncState>
    </div>
  );
}
