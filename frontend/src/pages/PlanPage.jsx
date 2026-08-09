import { useEffect, useState } from "react";

import MetricCard from "../components/MetricCard";
import TimelineChart from "../components/TimelineChart";
import { fetchTimeline, listPlans, listScenarios, updateScenario } from "../api/planner";
import { manwon, percent } from "../lib/format";
import "./PlanPage.css";

/**
 * 계획 — 대시보드형. 여기서는 밀도가 필요하다.
 *
 * 시나리오 가정을 바꾸면 기존 예상선을 고치는 게 아니라 새 예상 배치를 쌓는다.
 * (backend/asset_planning/services/projection_service.snapshot_projection)
 * 그래서 이 화면의 저장 버튼 문구는 "수정"이 아니라 "예상 다시 세우기"다.
 */
export default function PlanPage() {
  const [plan, setPlan] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [timeline, setTimeline] = useState(null);
  const [status, setStatus] = useState("loading");
  const [draft, setDraft] = useState({});

  useEffect(() => {
    let alive = true;
    listPlans({ status: "ACTIVE" })
      .then(async (plans) => {
        const p = Array.isArray(plans) ? plans[0] : plans;
        if (!alive) return;
        setPlan(p || null);
        const [sc, tl] = await Promise.all([
          listScenarios(p?.plan_id),
          fetchTimeline({ plan_id: p?.plan_id }),
        ]);
        if (!alive) return;
        setScenarios(sc || []);
        setTimeline(tl);
        setStatus("ready");
      })
      .catch(() => alive && setStatus("error"));
    return () => {
      alive = false;
    };
  }, []);

  if (status === "loading") return <div className="placeholder">불러오는 중입니다…</div>;
  if (status === "error")
    return <div className="placeholder">계획을 불러오지 못했습니다.</div>;
  if (!plan)
    return (
      <div className="placeholder">
        <p>아직 계획이 없습니다.</p>
        <p className="placeholder-sub">
          계획이 있어야 실적을 비교할 대상이 생깁니다. 목표 금액과 기간부터 정해 주세요.
        </p>
        <button className="btn is-primary" style={{ marginTop: 16 }}>
          계획 만들기
        </button>
      </div>
    );

  const onDraft = (id, field, value) =>
    setDraft((d) => ({ ...d, [id]: { ...(d[id] || {}), [field]: value } }));

  const reproject = async (s) => {
    const patch = draft[s.scenario_id];
    if (!patch) return;
    await updateScenario(s.scenario_id, patch);
    setScenarios((list) =>
      list.map((x) => (x.scenario_id === s.scenario_id ? { ...x, ...patch } : x))
    );
    setDraft((d) => ({ ...d, [s.scenario_id]: undefined }));
    setTimeline(await fetchTimeline({ plan_id: plan.plan_id }));
  };

  return (
    <div className="plan">
      <div className="section-head">
        <h2>{plan.title}</h2>
        <span className="meta">
          {plan.start_date} ~ {plan.end_date}
        </span>
      </div>

      <div className="plan-metrics">
        <MetricCard label="목표 순자산" value={manwon(plan.target_net_worth)} />
        <MetricCard label="월 적립액" value={manwon(plan.monthly_contribution)} />
        <MetricCard
          label="남은 기간"
          value={`${monthsLeft(plan.end_date)}개월`}
          sub={plan.period_type === "MONTH" ? "월 단위 회고" : "분기 단위 회고"}
        />
      </div>

      <div className="card plan-chart">
        <TimelineChart data={timeline} />
      </div>

      <div className="section-head">
        <h2>시나리오</h2>
        <span className="meta">가정을 바꾸면 예상선이 새로 쌓입니다</span>
      </div>

      <div className="scenario-grid">
        {scenarios.map((s) => {
          const d = draft[s.scenario_id] || {};
          const rate = d.expected_return_rate ?? s.expected_return_rate;
          const contrib = d.contribution_amount ?? s.contribution_amount;
          const dirty = Boolean(draft[s.scenario_id]);
          return (
            <div key={s.scenario_id} className={`scenario ${s.is_primary ? "is-primary" : ""}`}>
              <div className="scenario-head">
                <span className="scenario-label">{s.label}</span>
                {s.is_primary && <span className="pill is-accent">기준</span>}
              </div>

              <label className="field">
                <span>연 기대수익률</span>
                <input
                  type="number"
                  step="0.01"
                  value={rate ?? ""}
                  onChange={(e) =>
                    onDraft(s.scenario_id, "expected_return_rate", Number(e.target.value))
                  }
                />
                <em className="num">{percent(rate, 1)}</em>
              </label>

              <label className="field">
                <span>월 적립 가정액</span>
                <input
                  type="number"
                  step="100000"
                  value={contrib ?? ""}
                  onChange={(e) =>
                    onDraft(s.scenario_id, "contribution_amount", Number(e.target.value))
                  }
                />
                <em className="num">{manwon(contrib)}</em>
              </label>

              <button
                className="btn is-block"
                disabled={!dirty}
                onClick={() => reproject(s)}
              >
                예상 다시 세우기
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function monthsLeft(endDate) {
  if (!endDate) return 0;
  const end = new Date(endDate);
  const now = new Date();
  return Math.max(
    0,
    (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth())
  );
}
