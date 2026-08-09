import { useState } from "react";

import AsyncState from "../components/AsyncState";
import CascadeTree from "../components/CascadeTree";
import MetricCard, { MetricRow } from "../components/MetricCard";
import Panel from "../components/Panel";
import { fetchCascade, listBrokerAccounts } from "../api/trading";
import { isoDate } from "../lib/format";
import { useAsync, useAsyncAll } from "../lib/useAsync";
import "./PlanPage.css";

/**
 * 계획 — 연 → 분기 → 월 → 주 → 일.
 *
 * 이 화면의 목적은 계획을 '보는' 것이 아니라 **끊긴 자리를 찾는** 것이다.
 * DDL 상 월계획과 주계획 사이에 FK 가 없어서(주계획은 종목에 직접 붙는다),
 * 계층은 언제든 조용히 끊어질 수 있다. 서버가 조립하면서 붙지 못한 주계획을
 * orphan 으로 따로 내려 주고, 화면은 그걸 숨기지 않고 아래에 모아 둔다.
 */
export default function PlanPage() {
  const [on, setOn] = useState(() => new Date().toISOString().slice(0, 10));
  const [accountId, setAccountId] = useState("");
  const [onlyActive, setOnlyActive] = useState(true);

  const accounts = useAsync(() => listBrokerAccounts(), []);
  const { data, error, loading, reload } = useAsyncAll(
    {
      cascade: () =>
        fetchCascade({
          on,
          account_id: accountId || undefined,
          only_active: onlyActive ? 1 : 0,
        }),
    },
    [on, accountId, onlyActive]
  );

  const cascade = data?.cascade;
  const counts = cascade?.counts;

  return (
    <div className="pp">
      <div className="pp-controls">
        <label>
          <span>기준일</span>
          <input type="date" value={on} onChange={(e) => setOn(e.target.value)} />
        </label>
        <label>
          <span>계좌</span>
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            <option value="">전체</option>
            {(accounts.data || []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.broker_name} {a.masked_account_number}
              </option>
            ))}
          </select>
        </label>
        <label className="pp-check">
          <input
            type="checkbox"
            checked={onlyActive}
            onChange={(e) => setOnlyActive(e.target.checked)}
          />
          <span>기준일에 유효한 계획만</span>
        </label>
      </div>

      <AsyncState loading={loading} error={error} onRetry={reload}>
        {cascade && (
          <>
            <MetricRow>
              <MetricCard
                label="연투자계획"
                value={counts.annual}
                unit="건"
                hint={`${isoDate(cascade.as_of)} 기준`}
              />
              <MetricCard
                label="주계획 연결"
                value={counts.weekly_attached}
                unit={` / ${counts.weekly_total}`}
                hint="월계획 아래로 이어진 주계획"
              />
              <MetricCard
                label="끊긴 주계획"
                value={counts.weekly_orphan}
                unit="건"
                hint="상위 논리 없이 뜬 계획"
                tone={counts.weekly_orphan > 0 ? "warning" : "success"}
              />
            </MetricRow>

            <Panel
              title="계획 계층"
              meta={isoDate(cascade.as_of)}
              note="연·분기·월은 FK 로 이어지지만, 주계획은 종목에 직접 붙는다. 월계획이 종목을 가리키지 않으면 그 아래로 계층이 이어지지 않는다."
            >
              <CascadeTree tree={cascade.tree} orphans={cascade.orphan_weekly_plans} />
            </Panel>
          </>
        )}
      </AsyncState>
    </div>
  );
}
