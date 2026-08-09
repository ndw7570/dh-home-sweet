import AiFeedback from "../components/AiFeedback";
import AsyncState from "../components/AsyncState";
import Badge, { TrendBadge } from "../components/Badge";
import MetricCard, { MetricRow } from "../components/MetricCard";
import Panel from "../components/Panel";
import { fetchHomeBoard } from "../api/trading";
import { confidenceBar, isoDate, price, won } from "../lib/format";
import { useAsync } from "../lib/useAsync";
import "./HomePage.css";

/**
 * 홈 — 오늘의 규율.
 *
 * 순서가 곧 주장이다.
 *   1) 지금 해야 할 것 하나   (next_action)
 *   2) 협상 대상이 아닌 것    (필수원칙)
 *   3) 계획보다 먼저 오는 것  (경고)
 *   4) 오늘의 계획
 *   5) 세우다 만 자리         (빈칸)
 *   6) AI 의견
 *
 * 잔고를 맨 위에 두지 않는다. 잔고는 결과고, 이 화면은 행동을 다룬다.
 */

const GOTO_LABEL = {
  plan: "계획 화면으로",
  security: "종목 화면으로",
  execution: "이행 화면으로",
};

function NextAction({ action, onGo }) {
  if (!action) {
    return (
      <div className="hp-next is-clear">
        <span className="hp-next-kicker">지금 처리할 것</span>
        <p className="hp-next-msg">없다. 경고도 빈칸도 없고 오늘 계획도 서 있다.</p>
      </div>
    );
  }
  const tab = action.goto?.tab;
  return (
    <div className="hp-next">
      <span className="hp-next-kicker">지금 처리할 것</span>
      <p className="hp-next-msg">{action.message}</p>
      {tab && (
        <button className="btn is-primary is-block" onClick={() => onGo(tab)}>
          {GOTO_LABEL[tab] || "보러 가기"}
        </button>
      )}
    </div>
  );
}

function PlanCard({ plan, level }) {
  return (
    <li className="hp-plan">
      <div className="hp-plan-head">
        <span className={`hp-plan-level is-${level}`}>{level === "day" ? "일" : "주"}</span>
        <strong>{plan.title}</strong>
        <TrendBadge row={plan} />
        <Badge row={plan} field="scenario_planning" />
      </div>
      {plan.security && (
        <div className="hp-plan-sec num">
          {plan.security.name} {plan.security.symbol}
          {plan.security.current_price != null && (
            <span className="hp-plan-cur"> 현재 {price(plan.security.current_price)}</span>
          )}
        </div>
      )}
      <div className="hp-plan-nums num">
        {plan.confidence_score != null && <span>확신 {confidenceBar(plan.confidence_score)}</span>}
        {plan.predicted_price != null && <span>예상 {price(plan.predicted_price)}</span>}
        {plan.stop_loss_price != null && (
          <span className="hp-stop">손절 {price(plan.stop_loss_price)}</span>
        )}
        {plan.available_amount != null && <span>가용 {won(plan.available_amount)}</span>}
      </div>
      {plan.thesis && <p className="hp-plan-thesis">{plan.thesis}</p>}
    </li>
  );
}

export default function HomePage({ onGo }) {
  const { data, error, loading, reload } = useAsync(() => fetchHomeBoard(), []);

  return (
    <AsyncState loading={loading} error={error} onRetry={reload}>
      {data && (
        <div className="hp">
          <p className="hp-date num">{isoDate(data.as_of)}</p>

          <NextAction action={data.next_action} onGo={onGo} />

          <MetricRow>
            <MetricCard
              label="오늘 계획"
              value={data.counters.daily_plan_count}
              unit="건"
              hint={`주계획 ${data.counters.weekly_plan_count}건 아래`}
              tone={data.counters.daily_plan_count === 0 ? "warning" : undefined}
            />
            <MetricCard
              label="경고"
              value={data.counters.warning_count}
              unit="건"
              hint="담보·손절 — 계획보다 먼저 온다"
              tone={data.counters.warning_count > 0 ? "danger" : undefined}
            />
            <MetricCard
              label="빈칸"
              value={data.counters.gap_count}
              unit="건"
              hint="세우다 만 계획"
              tone={data.counters.gap_count > 0 ? "warning" : undefined}
            />
            <MetricCard
              label="오늘 이행"
              value={data.counters.order_count_today}
              unit="건"
              hint="이행 화면에서 계획과 대조된다"
            />
          </MetricRow>

          <Panel
            title="나의 필수원칙"
            note="협상 대상이 아니다. 화면 맨 위에 고정해 두는 이유다."
          >
            <ol className="hp-principles">
              {data.mandatory_principles.map((p) => (
                <li key={p.id}>
                  <span className="hp-pri num">{p.priority}</span>
                  {p.content}
                </li>
              ))}
            </ol>
          </Panel>

          {data.warnings.length > 0 && (
            <Panel
              title={`경고 ${data.warnings.length}건`}
              tone="danger"
              note="담보가 무너지면 규율을 지킬 기회 자체가 없어진다."
            >
              <ul className="hp-warnings">
                {data.warnings.map((w, i) => (
                  <li key={i} className={`hp-warn is-${w.severity.toLowerCase()}`}>
                    <div className="hp-warn-head">
                      <span className="hp-warn-kind">
                        {w.kind === "LOAN" ? "담보대출" : "손절가 도달"}
                      </span>
                      {w.security && (
                        <span className="num">
                          {w.security.name} {w.security.symbol}
                        </span>
                      )}
                    </div>
                    <ul className="hp-warn-reasons">
                      {w.reasons.map((r, j) => (
                        <li key={j}>{r}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          <Panel
            title="오늘의 계획"
            meta={`${data.plans.daily.length}일 · ${data.plans.weekly.length}주`}
          >
            {data.plans.daily.length === 0 && data.plans.weekly.length === 0 ? (
              <p className="hp-noplan">
                오늘 유효한 계획이 없다. 계획 없이 매매하면 남는 것은 결과뿐이다.
              </p>
            ) : (
              <ul className="hp-plans">
                {data.plans.daily.map((p) => (
                  <PlanCard key={`d${p.id}`} plan={p} level="day" />
                ))}
                {data.plans.weekly.map((p) => (
                  <PlanCard key={`w${p.id}`} plan={p} level="week" />
                ))}
              </ul>
            )}
          </Panel>

          {data.gaps.length > 0 && (
            <Panel
              title={`세우다 만 자리 ${data.gaps.length}건`}
              tone="warning"
              note="계획이 있는 것처럼 보이는데 실은 비어 있는 상태가 가장 위험하다."
            >
              <ul className="hp-gaps">
                {data.gaps.map((g, i) => (
                  <li key={i}>
                    <strong>{g.target.title}</strong>
                    <span className="hp-gap-msg"> {g.message}</span>
                  </li>
                ))}
              </ul>
              <button className="btn is-block" onClick={() => onGo("plan")}>
                계획 화면에서 채우기
              </button>
            </Panel>
          )}

          {data.ai_feedback.length > 0 && (
            <Panel title="유효한 AI 의견" meta={`${data.ai_feedback.length}건`}>
              <AiFeedback items={data.ai_feedback} compact />
            </Panel>
          )}
        </div>
      )}
    </AsyncState>
  );
}
