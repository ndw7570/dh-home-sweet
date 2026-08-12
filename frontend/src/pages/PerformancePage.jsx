import { Fragment, useMemo, useState } from "react";

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
  fetchPlanExecution,
  listAiFeedback,
  listPerformanceRecords,
  listSecurities,
  performanceRecord,
} from "../api/trading";
import { PERFORMANCE_RECORD_FIELDS } from "../forms/specs";
import { isoDate, localISODate, rate, todayISODate, won } from "../lib/format";
import { useAsync, useAsyncAll } from "../lib/useAsync";
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

const VIEW_TABS = [
  { key: "summary", label: "성과" },
  { key: "plan", label: "계획 대비 이행" },
];

const BUCKETS = [
  { key: "DAY", label: "일별" },
  { key: "WEEK", label: "주별" },
];

export default function PerformancePage() {
  const [periodType, setPeriodType] = useState("");
  const [dateFrom, setDateFrom] = useState(yearAgo);
  const [dateTo, setDateTo] = useState(todayISODate);
  const [view, setView] = useState("summary");
  const [bucket, setBucket] = useState("DAY");

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

  /**
   * 계획 대비 이행 집계. 이 탭일 때만 부른다 — 성과 탭에서는 쓰지 않는 조회다.
   * 일별/주별은 서버가 접어서 내려 준다(주 경계를 화면에서 다시 계산하면
   * 계획 화면의 주 구분과 어긋난다).
   */
  const planExec = useAsync(
    () =>
      view === "plan"
        ? fetchPlanExecution({ bucket, date_from: dateFrom, date_to: dateTo })
        : Promise.resolve(null),
    [view, bucket, dateFrom, dateTo]
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
        {/* 기간유형은 성과 기록(performance_records)의 구분이라 계획 대비 이행과 상관없다. */}
        {view === "summary" && (
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
        )}
        <label>
          <span>시작</span>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </label>
        <label>
          <span>종료</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </label>
      </div>

      <div className="pf-viewtabs" role="tablist" aria-label="성과 보기 방식">
        {VIEW_TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={view === t.key}
            className={`pf-viewtab ${view === t.key ? "is-on" : ""}`}
            onClick={() => setView(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {view === "plan" && (
        <PlanExecution
          state={planExec}
          bucket={bucket}
          onBucket={setBucket}
          dateFrom={dateFrom}
          dateTo={dateTo}
        />
      )}

      <AsyncState loading={view === "plan" ? false : loading} error={error} onRetry={reload}>
        {view === "summary" && perf && (
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

const pctText = (v) => (v == null ? "—" : `${v}%`);
/** 예상가 대비 괴리는 부호가 뜻을 가진다. +면 예상가보다 비싸게 산 것이다. */
const gapText = (v) => (v == null ? "—" : `${v > 0 ? "+" : ""}${v}%`);

/**
 * 계획 대비 이행 — 하루/한 주를 한 줄로 접어 숫자만 본다.
 *
 * 이행 화면(`/execution/compare/`)이 건별로 보여 주는 것을 여기서는 구간으로 접는다.
 * 건별로는 "이 매매가 계획 안이었나" 를, 여기서는 "그날 전체로 계획대로 했나" 를 묻는다.
 *
 * 일별과 주별에서 보이는 칸이 다르다. 가용금액이 종목별 **주**계획에 있어서
 * 집행률은 주 단위에서만 성립한다. 일별에도 같은 칸을 만들어 주 예산을 하루에
 * 갖다 대면 매일 "예산의 20%" 같은 숫자가 나오는데, 그건 사실이 아니다.
 */
function PlanExecution({ state, bucket, onBucket, dateFrom, dateTo }) {
  const data = state.data;
  const t = data?.totals;
  const isWeek = bucket === "WEEK";
  const headline = isWeek ? t?.execution_rate : t?.planned_ratio;

  return (
    <>
      <div className="pf-buckets" role="tablist" aria-label="집계 단위">
        {BUCKETS.map((b) => (
          <button
            key={b.key}
            role="tab"
            aria-selected={bucket === b.key}
            className={`pf-bucket ${bucket === b.key ? "is-on" : ""}`}
            onClick={() => onBucket(b.key)}
          >
            {b.label}
          </button>
        ))}
      </div>

      <AsyncState loading={state.loading} error={state.error} onRetry={state.reload}>
        {data && (
          <>
            <MetricRow>
              <MetricCard
                label="계획 이행률"
                value={t.fulfillment_rate == null ? "—" : t.fulfillment_rate}
                unit={t.fulfillment_rate == null ? "" : "%"}
                hint={`이행 ${t.fulfilled} · 미이행 ${t.broken}${
                  t.undecidable ? ` · 판정 불가 ${t.undecidable}` : ""
                } (예측추세별 규칙)`}
                tone={
                  t.fulfillment_rate == null
                    ? undefined
                    : t.fulfillment_rate >= 80
                      ? "success"
                      : t.fulfillment_rate >= 50
                        ? "warning"
                        : "danger"
                }
              />
              <MetricCard
                label={isWeek ? "집행률" : "계획 안에서 한 비율"}
                value={headline == null ? "—" : headline}
                unit={headline == null ? "" : "%"}
                hint={
                  isWeek
                    ? `쓰기로 한 ${won(t.available_amount)} 중 산 금액`
                    : "이행 중 그날 계획에 걸린 것의 비율"
                }
                tone={
                  isWeek && t.execution_rate != null && t.execution_rate > 100
                    ? "danger"
                    : undefined
                }
              />
              <MetricCard
                label="규율 준수율"
                value={t.discipline_rate == null ? "—" : t.discipline_rate}
                unit={t.discipline_rate == null ? "" : "%"}
                hint={`표시된 이행 ${t.flagged_count}건 / 전체 ${t.order_count}건`}
                tone={
                  t.discipline_rate == null
                    ? undefined
                    : t.discipline_rate >= 80
                      ? "success"
                      : t.discipline_rate >= 50
                        ? "warning"
                        : "danger"
                }
              />
              <MetricCard
                label="예상가 대비"
                value={gapText(t.avg_price_gap_pct)}
                hint="매수 체결가가 전망(예상가격)보다 위면 +"
                tone={
                  t.avg_price_gap_pct == null
                    ? undefined
                    : t.avg_price_gap_pct > 2
                      ? "warning"
                      : undefined
                }
              />
              <MetricCard
                label="목표체결가 대비"
                value={gapText(t.avg_target_gap_pct)}
                hint="걸겠다고 한 자리보다 위에서 샀으면 +"
                tone={
                  t.avg_target_gap_pct == null
                    ? undefined
                    : t.avg_target_gap_pct > 0
                      ? "warning"
                      : "success"
                }
              />
            </MetricRow>

            <Panel
              title={isWeek ? "주별 계획 대비 이행" : "일별 계획 대비 이행"}
              meta={`${isoDate(dateFrom)} ~ ${isoDate(dateTo)} · ${data.buckets.length}${
                isWeek ? "주" : "일"
              }`}
              note={
                isWeek
                  ? "돈의 단위는 주다. 가용금액이 종목별 주계획에 있어서 '쓰기로 한 돈 중 얼마나 썼나'는 주 단위에서만 성립한다. 줄을 펼치면 종목별로 갈린다."
                  : "하루가 판단의 단위다. 계획만 있고 이행이 없던 날, 이행만 있고 계획이 없던 날이 이 표에서 갈린다. 줄을 펼치면 종목별로 갈린다. 집행률은 주 예산이라 여기 없다 — 주별에서 본다."
              }
            >
              <BucketTable buckets={data.buckets} isWeek={isWeek} />
            </Panel>

            <Panel
              title="일계획 이행 판정"
              meta={`${data.verdicts.length}건 · 계획 없이 움직인 구간 ${t.planless_bucket_count}${
                isWeek ? "주" : "일"
              }`}
              note={`예측추세마다 '지켰다'의 뜻이 다르다. 상승은 매수합 > 매도합, 하락은 매도합 > 매수합, 횡보는 두 합의 차가 평균의 ${data.sideways_tolerance_pct}% 이내, 변동성 확대는 아무것도 안 했거나 손절가 위에서 정리한 경우다. 주문은 안 세고 체결만 센다 — 걸어만 두고 안 된 주문은 하지 않은 것과 같다.`}
            >
              <VerdictList rows={data.verdicts} />
            </Panel>
          </>
        )}
      </AsyncState>
    </>
  );
}

const VERDICT_TONE = { FULFILLED: "is-ok", BROKEN: "is-broken", UNDECIDABLE: "is-unknown" };

/**
 * 계획 한 건씩의 판정. 미이행이 위로 온다 — 고칠 것이 먼저 보여야 한다.
 * 판정만 던지지 않고 **이유를 그대로** 찍는다. 왜 미이행인지 모르면 고칠 수가 없다.
 *
 * ⚠ 이 컴포넌트와 "계획 이행률" 카드, 표의 "이행 판정" 칸은 **잠정**이다.
 * 백엔드 `fulfillment_service` 가 통째로 빠질 수 있고(횡보 기준 재설계 대기),
 * 그러면 여기 셋과 CSS 의 `.pe-verdict*` 도 같이 지운다.
 * 사정은 `backend/trading_discipline/services/fulfillment_service.py` 상단과
 * `docs/handoff.md` 참조.
 */
function VerdictList({ rows }) {
  if (!rows?.length) {
    return <p className="dt-empty">이 기간에 판정할 일계획이 없다.</p>;
  }
  return (
    <ul className="pe-verdicts">
      {rows.map((v) => (
        <li key={v.plan_id} className="pe-verdict">
          <div className="pe-verdict-head">
            <span className={`pe-verdict-mark ${VERDICT_TONE[v.verdict]}`}>
              {v.verdict_label}
            </span>
            <span className="num pe-verdict-date">{isoDate(v.date)}</span>
            {v.security && (
              <strong className="num">
                {v.security.name} {v.security.symbol}
              </strong>
            )}
            <span className="pe-verdict-trend">{v.predicted_trend_label}</span>
            <span className="pe-verdict-title">{v.title}</span>
            <span className="num pe-verdict-nums">
              매수 {won(v.buy_amount)} · 매도 {won(v.sell_amount)}
            </span>
          </div>
          <p className="pe-verdict-reason">{v.reason}</p>
          {(v.target_fill_price != null || v.predicted_price != null) && (
            <p className="pe-verdict-prices num">
              {v.target_fill_price != null && (
                <span>
                  목표체결가 {won(v.target_fill_price)}
                  {v.target_gap_buy_pct != null && (
                    <em className={v.target_gap_buy_pct > 0 ? "neg" : "pos"}>
                      {" "}
                      매수 {gapText(v.target_gap_buy_pct)}
                    </em>
                  )}
                  {v.target_gap_sell_pct != null && (
                    <em className={v.target_gap_sell_pct < 0 ? "neg" : "pos"}>
                      {" "}
                      매도 {gapText(v.target_gap_sell_pct)}
                    </em>
                  )}
                </span>
              )}
              {v.predicted_price != null && <span>예상가 {won(v.predicted_price)}</span>}
              {v.stop_loss_price != null && <span>손절가 {won(v.stop_loss_price)}</span>}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * 구간 표. 줄을 펼치면 그 구간의 **종목별** 내역이 같은 칸 구성으로 딸려 나온다.
 *
 * 구간 합계만 보면 "그날 준수율 50%" 까지는 알아도 어느 종목에서 샜는지를 모른다.
 * 고칠 곳을 찾으려면 종목까지 내려가야 해서, 접기/펼치기로 두 층을 한 표에 둔다.
 *
 * DataTable 을 안 쓴 이유는 하나다 — 그 컴포넌트는 한 행에 한 줄만 그린다.
 */
function BucketTable({ buckets, isWeek }) {
  const [open, setOpen] = useState(() => new Set());
  const toggle = (key) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const allOpen = buckets.length > 0 && open.size >= buckets.length;
  const toggleAll = () => setOpen(allOpen ? new Set() : new Set(buckets.map((b) => b.key)));

  if (!buckets.length) {
    return <p className="dt-empty">이 기간에는 계획도 이행도 없다.</p>;
  }

  return (
    <>
      <div className="pe-tools">
        <button type="button" className="row-edit" onClick={toggleAll}>
          {allOpen ? "모두 접기" : "모두 펼치기"}
        </button>
      </div>
      <div className="dt-scroll">
        <table className="dt pe">
          <thead>
            <tr>
              <th scope="col">구간</th>
              <th scope="col" className="ta-r">계획</th>
              {isWeek && <th scope="col" className="ta-r">가용금액</th>}
              <th scope="col" className="ta-r">이행</th>
              <th scope="col" className="ta-r">매수 체결</th>
              <th scope="col" className="ta-r">매도 체결</th>
              {isWeek && <th scope="col" className="ta-r">집행률</th>}
              <th scope="col" className="ta-r">이행 판정</th>
              <th scope="col" className="ta-r">계획 안</th>
              <th scope="col" className="ta-r">준수율</th>
              <th scope="col" className="ta-r">예상가 대비</th>
              <th scope="col" className="ta-r">목표가 대비</th>
            </tr>
          </thead>
          <tbody>
            {buckets.map((b) => {
              const isOpen = open.has(b.key);
              return (
                <Fragment key={b.key}>
                  <Row
                    row={b}
                    isWeek={isWeek}
                    head={
                      <button
                        type="button"
                        className="pe-toggle"
                        onClick={() => toggle(b.key)}
                        aria-expanded={isOpen}
                        aria-label={isOpen ? "종목별 접기" : "종목별 펼치기"}
                      >
                        <span aria-hidden="true">{isOpen ? "▼" : "▶"}</span>
                        <span className="num">{b.label}</span>
                        <span className="pe-seccount">종목 {b.securities.length}</span>
                      </button>
                    }
                  />
                  {isOpen &&
                    b.securities.map((s) => (
                      <Row
                        key={`${b.key}-${s.security ? s.security.id : "none"}`}
                        row={s}
                        isWeek={isWeek}
                        sub
                        head={<span className="pe-sec num">{s.label}</span>}
                      />
                    ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

/** 구간 줄과 종목 줄이 같은 칸 구성이라 한 컴포넌트로 둘 다 그린다. */
function Row({ row, isWeek, sub, head }) {
  const { plan, execution: ex, compare: c, fulfillment: f } = row;
  const noPlan = plan.daily_count === 0 && !plan.security_plan_count;

  return (
    <tr className={sub ? "pe-sub" : "pe-main"}>
      <td>{head}</td>
      <td className="num ta-r">
        {noPlan ? (
          <span className="pf-noplan">계획 없음</span>
        ) : (
          <>
            일 {plan.daily_count}
            {isWeek && plan.security_plan_count != null && ` · 종목 ${plan.security_plan_count}`}
          </>
        )}
      </td>
      {isWeek && (
        <td className="num ta-r">
          {plan.available_amount == null ? "—" : won(plan.available_amount)}
        </td>
      )}
      <td className="num ta-r">
        {ex.total_count === 0 ? "—" : `체결 ${ex.fill_count} · 주문 ${ex.order_count}`}
      </td>
      <td className="num ta-r">{ex.buy_amount == null ? "—" : won(ex.buy_amount)}</td>
      <td className="num ta-r">{ex.sell_amount == null ? "—" : won(ex.sell_amount)}</td>
      {isWeek && (
        <td className="num ta-r">
          {c.execution_rate == null ? (
            "—"
          ) : (
            <span
              className={c.execution_rate > 100 ? "neg" : undefined}
              title="매수 체결금액 ÷ 가용금액"
            >
              {pctText(c.execution_rate)}
            </span>
          )}
        </td>
      )}
      <td className="num ta-r">
        {!f || f.fulfilled + f.broken + f.undecidable === 0 ? (
          "—"
        ) : (
          <span
            className={f.broken > 0 ? "neg" : "pos"}
            title={`이행 ${f.fulfilled} · 미이행 ${f.broken} · 판정 불가 ${f.undecidable}`}
          >
            {f.rate == null ? "판정 불가" : `${f.rate}%`}
            <span className="pe-fmini"> ({f.fulfilled}/{f.fulfilled + f.broken})</span>
          </span>
        )}
      </td>
      <td className="num ta-r">
        {c.planned_ratio == null ? (
          "—"
        ) : (
          <span
            className={c.planned_ratio < 100 ? "neg" : undefined}
            title={`계획에 걸린 이행 ${c.planned_count}건 / ${ex.total_count}건`}
          >
            {pctText(c.planned_ratio)}
          </span>
        )}
      </td>
      <td className="num ta-r">
        {c.discipline_rate == null ? (
          "—"
        ) : (
          <span
            className={c.discipline_rate < 100 ? "neg" : "pos"}
            title={`표시된 이행 ${c.flagged_count}건`}
          >
            {pctText(c.discipline_rate)}
          </span>
        )}
      </td>
      <td className="num ta-r">
        {c.avg_price_gap_pct == null ? (
          "—"
        ) : (
          <span className={c.avg_price_gap_pct > 0 ? "neg" : "pos"}>
            {gapText(c.avg_price_gap_pct)}
          </span>
        )}
      </td>
      <td className="num ta-r">
        {c.avg_target_gap_pct == null ? (
          "—"
        ) : (
          <span
            className={c.avg_target_gap_pct > 0 ? "neg" : "pos"}
            title="매수 체결가 ÷ 목표체결가"
          >
            {gapText(c.avg_target_gap_pct)}
          </span>
        )}
      </td>
    </tr>
  );
}
