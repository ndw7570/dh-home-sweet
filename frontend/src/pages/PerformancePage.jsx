import { useMemo, useState } from "react";

import AiFeedback from "../components/AiFeedback";
import AsyncState from "../components/AsyncState";
import DataTable from "../components/DataTable";
import EntityForm from "../components/EntityForm";
import { EditButton } from "../components/EntityModal";
import MetricCard, { MetricRow } from "../components/MetricCard";
import Modal from "../components/Modal";
import Panel from "../components/Panel";
import {
  fetchAiDigest,
  fetchPerformanceSummary,
  listAiFeedback,
  listPerformanceRecords,
  listSecurities,
  performanceRecord,
} from "../api/trading";
import { PERFORMANCE_RECORD_FIELDS } from "../forms/specs";
import { isoDate, localISODate, rate, todayISODate, won } from "../lib/format";
import { useAsyncAll } from "../lib/useAsync";
import { useMultiForm } from "../lib/useMultiForm";
import "./PerformancePage.css";

/**
 * 성과 — "벌었는가"가 아니라 "시장보다 잘했는가 / 그 과정에서 얼마나 깨졌는가".
 *
 * 비용을 항목별로 쪼개 보여 주는 것이 이 화면의 목적이다.
 * 수익률이 낮을 때 판단이 틀린 것인지 비용이 갉아먹은 것인지 갈라 보지 못하면,
 * 고쳐야 할 곳을 못 찾는다.
 *
 * AI 의견을 같은 화면 아래에 둔 이유: 성과는 사후 판정이고, AI 피드백도 사후 판정이다.
 * 둘을 나란히 놓아야 어느 쪽이 맞았는지 볼 수 있다.
 */

const PERIODS = [
  { value: "", label: "전체" },
  { value: "MONTH", label: "월" },
  { value: "QUARTER", label: "분기" },
  { value: "YEAR", label: "연" },
];

const yearAgo = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 1);
  return localISODate(d);
};

export default function PerformancePage() {
  const [periodType, setPeriodType] = useState("");
  const [dateFrom, setDateFrom] = useState(yearAgo);
  const [dateTo, setDateTo] = useState(todayISODate);

  const { data, error, loading, reload } = useAsyncAll(
    {
      perf: () =>
        fetchPerformanceSummary({
          period_type: periodType || undefined,
          date_from: dateFrom,
          date_to: dateTo,
        }),
      aiDigest: () => fetchAiDigest(),
      aiFeedback: () => listAiFeedback(),
      records: () => listPerformanceRecords({ no_page: 1 }),
      securities: () => listSecurities(),
    },
    [periodType, dateFrom, dateTo]
  );

  const kinds = useMemo(
    () => ({
      RECORD: { title: "성과 기록", fields: PERFORMANCE_RECORD_FIELDS, api: performanceRecord, wide: true },
    }),
    []
  );
  const form = useMultiForm(kinds, reload);

  const optionsMap = useMemo(
    () => ({
      securities: (data?.securities || []).map((s) => ({
        value: s.id,
        label: `${s.name} (${s.symbol})`,
      })),
    }),
    [data]
  );

  const perf = data?.perf;
  const t = perf?.totals;
  const maxCost = Math.max(1, ...(perf?.cost_breakdown || []).map((c) => c.value || 0));

  return (
    <div className="pf">
      <div className="pf-controls">
        <label>
          <span>기간유형</span>
          <select value={periodType} onChange={(e) => setPeriodType(e.target.value)}>
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>시작</span>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </label>
        <label>
          <span>종료</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </label>
      </div>

      <AsyncState loading={loading} error={error} onRetry={reload}>
        {perf && (
          <>
            <MetricRow>
              <MetricCard
                label="순손익"
                value={won(t.net_profit)}
                hint={`성과 기록 ${t.record_count}건`}
                tone={t.net_profit > 0 ? "success" : t.net_profit < 0 ? "danger" : undefined}
              />
              <MetricCard
                label="수익률"
                value={rate(t.return_rate)}
                hint={`벤치마크 ${rate(t.benchmark_return_rate)}`}
              />
              <MetricCard
                label="초과수익"
                value={rate(t.excess_return)}
                hint="음수면 시장을 이기지 못한 것이다"
                tone={
                  t.excess_return == null
                    ? undefined
                    : t.excess_return >= 0
                      ? "success"
                      : "danger"
                }
              />
              <MetricCard
                label="비용이 먹은 비율"
                value={t.cost_bite_pct == null ? "—" : t.cost_bite_pct}
                unit={t.cost_bite_pct == null ? "" : "%"}
                hint="번 돈 대비 비용. 크면 매매 빈도부터 의심한다"
                tone={t.cost_bite_pct > 20 ? "warning" : undefined}
              />
            </MetricRow>

            <Panel
              title="비용 분해"
              meta={won(t.cost_total)}
              note="이자·수수료·세금·기타를 따로 세우면, 수익률이 낮은 이유가 판단 때문인지 비용 때문인지 갈라 볼 수 있다."
            >
              <ul className="pf-costs">
                {perf.cost_breakdown.map((c) => (
                  <li key={c.field}>
                    <span className="pf-cost-label">{c.label}</span>
                    <span className="pf-cost-bar">
                      <span
                        className="pf-cost-fill"
                        style={{ width: `${((c.value || 0) / maxCost) * 100}%` }}
                      />
                    </span>
                    <span className="pf-cost-value num">{won(c.value)}</span>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title="종목별" meta={`${perf.by_security.length}종목`}>
              <DataTable
                rows={perf.by_security}
                rowKey="security_id"
                empty="이 기간에 성과 기록이 없다."
                columns={[
                  {
                    key: "name",
                    label: "종목",
                    render: (r) => (
                      <span className="num">
                        {r.name} {r.symbol}
                      </span>
                    ),
                  },
                  {
                    key: "net_profit",
                    label: "순손익",
                    align: "right",
                    render: (r) => (
                      <span className={r.net_profit >= 0 ? "pos" : "neg"}>
                        {won(r.net_profit)}
                      </span>
                    ),
                  },
                  {
                    key: "return_rate",
                    label: "수익률",
                    align: "right",
                    render: (r) => rate(r.return_rate),
                  },
                  {
                    key: "benchmark_return_rate",
                    label: "벤치마크",
                    align: "right",
                    render: (r) => rate(r.benchmark_return_rate),
                  },
                  {
                    key: "excess_return",
                    label: "초과수익",
                    align: "right",
                    render: (r) =>
                      r.excess_return == null ? null : (
                        <span className={r.excess_return >= 0 ? "pos" : "neg"}>
                          {rate(r.excess_return)}
                        </span>
                      ),
                  },
                  { key: "record_count", label: "기록", align: "right" },
                ]}
              />
            </Panel>

            <Panel
              title="성과 기록"
              meta={`${data.records.length}건`}
              note="이 테이블이 위의 집계 재료다. 기간이 조회 범위와 겹치기만 하면 집계에 들어간다(진행 중인 이번 달도 포함)."
              actions={
                <button
                  className="btn is-sm"
                  onClick={() =>
                    form.openCreate("RECORD", { period_start: dateFrom, period_end: dateTo })
                  }
                >
                  + 성과 기록
                </button>
              }
            >
              <DataTable
                rows={data.records}
                empty="성과 기록이 없다."
                columns={[
                  {
                    key: "security",
                    label: "종목",
                    render: (r) =>
                      r.security_detail ? (
                        <span className="num">
                          {r.security_detail.name} {r.security_detail.symbol}
                        </span>
                      ) : null,
                  },
                  { key: "period_type", label: "기간", render: (r) => r.period_type_label },
                  {
                    key: "period",
                    label: "구간",
                    render: (r) => (
                      <span className="num">
                        {isoDate(r.period_start)} ~ {isoDate(r.period_end)}
                      </span>
                    ),
                  },
                  {
                    key: "net_profit",
                    label: "순손익",
                    align: "right",
                    render: (r) => (
                      <span className={r.net_profit >= 0 ? "pos" : "neg"}>{won(r.net_profit)}</span>
                    ),
                  },
                  {
                    key: "return_rate",
                    label: "수익률",
                    align: "right",
                    render: (r) => rate(r.return_rate),
                  },
                  {
                    key: "total_cost",
                    label: "비용",
                    align: "right",
                    render: (r) => won(r.total_cost),
                  },
                  {
                    key: "_edit",
                    label: "",
                    align: "right",
                    width: 60,
                    render: (r) => <EditButton onClick={() => form.openEdit("RECORD", r.id)} />,
                  },
                ]}
              />
            </Panel>

            <Panel
              title="AI 피드백"
              meta={
                data.aiDigest
                  ? `유효 ${data.aiDigest.valid_count} · 만료 ${data.aiDigest.expired_count}`
                  : undefined
              }
              note="valid_until 이 지난 의견은 흐리게 표시된다. AI 의견에는 유통기한이 있다."
            >
              <AiFeedback items={data.aiFeedback} />
            </Panel>
          </>
        )}
      </AsyncState>

      {form.isOpen && (
        <Modal
          title={`성과 기록 ${form.isEdit ? "수정" : "추가"}`}
          onClose={form.close}
          wide
        >
          <EntityForm
            fields={PERFORMANCE_RECORD_FIELDS}
            instance={form.instance}
            optionsMap={optionsMap}
            onSubmit={form.submit}
            onCancel={form.close}
            onDelete={form.isEdit ? form.remove : undefined}
          />
        </Modal>
      )}
    </div>
  );
}
