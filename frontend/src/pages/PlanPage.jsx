import { useMemo, useState } from "react";

import AsyncState from "../components/AsyncState";
import CascadeTree from "../components/CascadeTree";
import EntityForm from "../components/EntityForm";
import MetricCard, { MetricRow } from "../components/MetricCard";
import Modal from "../components/Modal";
import Panel from "../components/Panel";
import PlanPerformanceChart from "../components/PlanPerformanceChart";
import PlanTimetable from "../components/PlanTimetable";
import {
  annualPlan,
  dailyPlan,
  fetchCascade,
  listAnnualPlans,
  listBrokerAccounts,
  listMonthlyPlans,
  listQuarterlyPlans,
  listSecurities,
  listWeeklyPlans,
  monthlyPlan,
  monthlyPrinciple,
  quarterlyPlan,
  weeklyPlan,
} from "../api/trading";
import {
  ANNUAL_PLAN_FIELDS,
  DAILY_PLAN_FIELDS,
  MONTHLY_PLAN_FIELDS,
  MONTHLY_PRINCIPLE_FIELDS,
  QUARTERLY_PLAN_FIELDS,
  WEEKLY_PLAN_FIELDS,
} from "../forms/specs";
import { isoDate } from "../lib/format";
import { useAsync, useAsyncAll } from "../lib/useAsync";
import { useMultiForm } from "../lib/useMultiForm";
import "./PlanPage.css";

/**
 * 계획 — 연 → 분기 → 월 → 주 → 일.
 *
 * 이 화면의 목적은 계획을 '보는' 것이 아니라 **끊긴 자리를 찾아 그 자리에서 고치는** 것이다.
 * 그래서 추가 버튼이 위쪽 툴바에만 있는 게 아니라, 트리의 각 노드에 붙어 있다.
 * 끊긴 월계획의 '+ 종목 연결' 버튼은 숨기지 않고 항상 보이게 둔다.
 */

const KIND_LABEL = {
  YEAR: "연투자계획",
  QUARTER: "분기투자계획",
  MONTH: "월투자계획",
  WEEK: "주투자계획",
  DAY: "일투자계획",
  MONTHLY_PRINCIPLE: "월투자원칙",
};

/** 트리 노드의 level → 새로 만들 때 채워 줄 부모 FK */
const PARENT_KEY = {
  QUARTER: "annual_plan",
  MONTH: "quarterly_plan",
  MONTHLY_PRINCIPLE: "monthly_plan",
  WEEK: "monthly_plan",
  DAY: "weekly_plan",
};

const VIEW_TABS = [
  { key: "cascade", label: "계층" },
  { key: "timetable", label: "타임테이블" },
  { key: "chart", label: "성과 그래프" },
];

export default function PlanPage() {
  const [on, setOn] = useState(() => new Date().toISOString().slice(0, 10));
  const [accountId, setAccountId] = useState("");
  const [onlyActive, setOnlyActive] = useState(true);
  const [view, setView] = useState("cascade");

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

  // 폼의 FK 셀렉트를 채울 목록. 계획 조회와 별개로 한 번씩만 읽는다.
  const refs = useAsyncAll(
    {
      accounts: () => listBrokerAccounts(),
      securities: () => listSecurities(),
      annualPlans: () => listAnnualPlans(),
      quarterlyPlans: () => listQuarterlyPlans(),
      monthlyPlans: () => listMonthlyPlans(),
      weeklyPlans: () => listWeeklyPlans(),
    },
    []
  );

  const kinds = useMemo(
    () => ({
      YEAR: { title: KIND_LABEL.YEAR, fields: ANNUAL_PLAN_FIELDS, api: annualPlan },
      QUARTER: { title: KIND_LABEL.QUARTER, fields: QUARTERLY_PLAN_FIELDS, api: quarterlyPlan, wide: true },
      MONTH: { title: KIND_LABEL.MONTH, fields: MONTHLY_PLAN_FIELDS, api: monthlyPlan },
      WEEK: { title: KIND_LABEL.WEEK, fields: WEEKLY_PLAN_FIELDS, api: weeklyPlan },
      DAY: { title: KIND_LABEL.DAY, fields: DAILY_PLAN_FIELDS, api: dailyPlan },
      MONTHLY_PRINCIPLE: {
        title: KIND_LABEL.MONTHLY_PRINCIPLE,
        fields: MONTHLY_PRINCIPLE_FIELDS,
        api: monthlyPrinciple,
      },
    }),
    []
  );

  const reloadAll = async () => {
    await Promise.all([reload(), refs.reload()]);
  };
  const form = useMultiForm(kinds, reloadAll);

  const optionsMap = useMemo(
    () => ({
      accounts: (refs.data?.accounts || []).map((a) => ({
        value: a.id,
        label: `${a.broker_name || "증권사"} ${a.masked_account_number || ""}`.trim(),
      })),
      securities: (refs.data?.securities || []).map((s) => ({
        value: s.id,
        label: `${s.name} (${s.symbol})`,
      })),
      annualPlans: (refs.data?.annualPlans || []).map((p) => ({ value: p.id, label: p.title })),
      quarterlyPlans: (refs.data?.quarterlyPlans || []).map((p) => ({ value: p.id, label: p.title })),
      monthlyPlans: (refs.data?.monthlyPlans || []).map((p) => ({
        value: p.id,
        label: `${p.title} [${p.scenario_planning_label || p.scenario_planning}]`,
      })),
      weeklyPlans: (refs.data?.weeklyPlans || []).map((p) => ({ value: p.id, label: p.title })),
    }),
    [refs.data]
  );

  const cascade = data?.cascade;
  const counts = cascade?.counts;

  const handleAddChild = (node, childLevel) => {
    const key = PARENT_KEY[childLevel];
    form.openCreate(childLevel, key ? { [key]: node.id } : null);
  };

  /**
   * 저장은 됐는데 지금 필터로는 트리에 안 나오는 경우를 잡아서 알려 준다.
   *
   * 기준일 밖의 기간으로 계획을 세우면 트리에서 사라진다. 그걸 말 안 해 주면
   * 저장이 안 된 줄 알고 같은 계획을 또 만들게 된다.
   */
  const [notice, setNotice] = useState(null);

  const submitWithNotice = async (payload) => {
    const res = await form.submit(payload);
    const saved = res?.saved;
    if (!res?.created || !saved?.valid_from || !saved?.valid_until) return res;

    const outOfRange = onlyActive && !(saved.valid_from <= on && on <= saved.valid_until);
    if (outOfRange) {
      setNotice({
        message: `저장했다. 다만 기간이 ${saved.valid_from} ~ ${saved.valid_until} 라 기준일(${on})에는 유효하지 않아 아래 트리에 안 나온다.`,
        jumpTo: saved.valid_from,
      });
    }
    return res;
  };

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
            {(refs.data?.accounts || []).map((a) => (
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

      <div className="pp-viewtabs" role="tablist" aria-label="계획 보기 방식">
        {VIEW_TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={view === t.key}
            className={`pp-viewtab ${view === t.key ? "is-on" : ""}`}
            onClick={() => setView(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {form.loadError && (
        <p className="pp-loaderr">원본을 불러오지 못했다 — {String(form.loadError.message)}</p>
      )}

      {notice && (
        <div className="pp-notice">
          <span>{notice.message}</span>
          <span className="pp-notice-actions">
            <button
              className="btn is-sm"
              onClick={() => {
                setOn(notice.jumpTo);
                setNotice(null);
              }}
            >
              그 날짜로 이동
            </button>
            <button
              className="btn is-sm"
              onClick={() => {
                setOnlyActive(false);
                setNotice(null);
              }}
            >
              필터 끄기
            </button>
            <button className="btn is-sm" onClick={() => setNotice(null)}>
              닫기
            </button>
          </span>
        </div>
      )}

      {view === "chart" ? (
        <PlanPerformanceChart accountId={accountId} />
      ) : (
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
                  label="주계획"
                  value={counts.weekly_total}
                  unit="건"
                  hint="월계획 아래로 FK 로 이어진 주계획"
                />
              </MetricRow>

              {view === "cascade" && (
                <Panel
                  title="계획 계층"
                  meta={isoDate(cascade.as_of)}
                  note="연 → 분기 → 월 → 주 → 일 을 FK 로 곧게 따라간다. 월계획이 월원칙(종목 연결)을 갖지 않으면 근거가 비어 있다는 경고가 그 자리에 뜬다."
                  actions={
                    <div className="panel-actions">
                      <button className="btn is-sm" onClick={() => form.openCreate("YEAR")}>
                        + 연계획
                      </button>
                      <button className="btn is-sm" onClick={() => form.openCreate("WEEK")}>
                        + 주계획
                      </button>
                    </div>
                  }
                >
                  {form.loading && <p className="pp-loading">원본을 읽는 중…</p>}
                  <CascadeTree
                    tree={cascade.tree}
                    onEdit={(node) => form.openEdit(node.level, node.id)}
                    onAddChild={handleAddChild}
                  />
                </Panel>
              )}

              {view === "timetable" && (
                <Panel
                  title="계획 타임테이블"
                  meta={isoDate(cascade.as_of)}
                  note="시간 축으로 본다. 상단에서 확대 수준(연/분기/월/주/일)을 바꾸면 컬럼 폭이 바뀌고, 각 계층의 계획이 자기 유효 구간만큼 막대로 표시된다. 막대를 누르면 원본을 연다."
                >
                  <PlanTimetable
                    tree={cascade.tree}
                    onEdit={(node) => form.openEdit(node.level, node.id)}
                  />
                </Panel>
              )}
            </>
          )}
        </AsyncState>
      )}

      {form.isOpen && (
        <Modal
          title={`${form.spec.title} ${form.isEdit ? "수정" : "추가"}`}
          subtitle={
            form.kind === "MONTHLY_PRINCIPLE"
              ? "월계획을 종목에 잇는 행이다. 이걸 만들면 그 종목의 주계획이 이 월계획 아래로 붙는다."
              : undefined
          }
          onClose={form.close}
          wide={form.spec.wide}
        >
          <EntityForm
            fields={form.spec.fields}
            instance={form.instance}
            optionsMap={optionsMap}
            onSubmit={submitWithNotice}
            onCancel={form.close}
            onDelete={form.isEdit ? form.remove : undefined}
          />
        </Modal>
      )}
    </div>
  );
}
