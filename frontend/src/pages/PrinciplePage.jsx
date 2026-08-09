import { useState } from "react";

import AsyncState from "../components/AsyncState";
import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import Panel from "../components/Panel";
import {
  listInvestmentPrinciples,
  listMandatoryPrinciples,
  listMonthlyPrinciples,
  listQuarterlyPrinciples,
} from "../api/trading";
import { percent, price } from "../lib/format";
import { useAsyncAll } from "../lib/useAsync";
import "./PrinciplePage.css";

/**
 * 원칙 — 네 종류가 성격이 완전히 다르다. 그래서 한 화면에 두되 구획을 나눈다.
 *
 *   나의 필수원칙   협상 대상 아님. 순위가 있다.
 *   대가의 원칙     조건부. 그래서 '주의사항'이 없는 원칙은 반쪽이다.
 *   분기투자원칙    종목별 실적 카드(지표 18개). 얼마나 채웠는지가 곧 신뢰도다.
 *   월투자원칙      월계획을 종목에 잇는 이음매. 예상가·손절가가 여기 있다.
 */

const SECTIONS = [
  { key: "mandatory", label: "나의 필수원칙" },
  { key: "teacher", label: "대가의 원칙" },
  { key: "quarterly", label: "분기투자원칙" },
  { key: "monthly", label: "월투자원칙" },
];

function MetricGrid({ groups }) {
  if (!groups) return null;
  return (
    <div className="pr-metrics">
      {Object.entries(groups).map(([group, items]) => (
        <div className="pr-metric-group" key={group}>
          <h5>{group}</h5>
          <dl>
            {items.map((m) => (
              <div key={m.field} className={m.value == null ? "is-empty" : ""}>
                <dt>{m.label}</dt>
                <dd className="num">{m.value == null ? "—" : m.value.toLocaleString("ko-KR")}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

export default function PrinciplePage() {
  const [section, setSection] = useState("mandatory");
  const { data, error, loading, reload } = useAsyncAll(
    {
      mandatory: () => listMandatoryPrinciples(),
      teacher: () => listInvestmentPrinciples(),
      quarterly: () => listQuarterlyPrinciples(),
      monthly: () => listMonthlyPrinciples(),
    },
    []
  );

  return (
    <div className="pr">
      <nav className="pr-tabs" aria-label="원칙 종류">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            className={`pr-tab ${section === s.key ? "is-on" : ""}`}
            onClick={() => setSection(s.key)}
          >
            {s.label}
            {data?.[s.key] && <span className="pr-count num">{data[s.key].length}</span>}
          </button>
        ))}
      </nav>

      <AsyncState loading={loading} error={error} onRetry={reload}>
        {data && section === "mandatory" && (
          <Panel
            title="나의 필수원칙"
            meta={`${data.mandatory.length}개`}
            note="순위가 낮을수록 먼저 읽힌다. 홈 화면 맨 위에 걸리는 목록이 이것이다."
          >
            <ol className="pr-mandatory">
              {data.mandatory.map((p) => (
                <li key={p.id}>
                  <span className="pr-pri num">{p.priority ?? "-"}</span>
                  <span>{p.content}</span>
                </li>
              ))}
            </ol>
          </Panel>
        )}

        {data && section === "teacher" && (
          <Panel
            title="대가의 원칙"
            meta={`${data.teacher.length}개`}
            note="원칙은 늘 조건부다. 주의사항이 비어 있으면 어떤 상황에서 이 원칙이 오히려 해가 되는지를 모른 채 갖다 쓰게 된다."
          >
            <ul className="pr-teacher">
              {data.teacher.map((p) => (
                <li key={p.id} className={p.has_cautions ? "" : "is-incomplete"}>
                  <div className="pr-teacher-head">
                    <strong>{p.teacher_name || "출처 미상"}</strong>
                    <Badge row={p} field="principle_type" tone="accent" />
                    {p.source_detail?.name && (
                      <span className="pr-source">{p.source_detail.name}</span>
                    )}
                    {!p.has_cautions && <Badge tone="warning">주의사항 미기재</Badge>}
                  </div>
                  <p className="pr-content">{p.content}</p>
                  {p.rationale && (
                    <p className="pr-sub">
                      <span>근거</span> {p.rationale}
                    </p>
                  )}
                  {p.cautions && (
                    <p className="pr-sub is-caution">
                      <span>주의</span> {p.cautions}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </Panel>
        )}

        {data && section === "quarterly" && (
          <Panel
            title="분기투자원칙"
            meta={`${data.quarterly.length}개`}
            note="종목별 분기 실적 카드. 지표를 반쯤 채운 카드로 저평가/고평가를 판정하면 그 판정 자체가 반쪽이라, 채움 비율을 같이 보여 준다."
          >
            {data.quarterly.length === 0 ? (
              <p className="pr-empty">아직 분기 실적 카드가 없다.</p>
            ) : (
              <ul className="pr-quarterly">
                {data.quarterly.map((q) => (
                  <li key={q.id}>
                    <div className="pr-q-head">
                      <strong className="num">
                        {q.security_detail?.name} {q.security_detail?.symbol}
                      </strong>
                      <Badge
                        row={q}
                        field="valuation_type"
                        tone={
                          q.valuation_type === "UNDERVALUED"
                            ? "success"
                            : q.valuation_type === "OVERVALUED"
                              ? "danger"
                              : "muted"
                        }
                      />
                      <span
                        className={`pr-filled num ${q.filled_ratio < 0.6 ? "is-low" : ""}`}
                        title="18개 지표 중 채운 비율"
                      >
                        지표 {percent(q.filled_ratio)}
                      </span>
                      <span className="pr-q-price num">
                        예상 {price(q.predicted_price)} · 손절 {price(q.stop_loss_price)}
                      </span>
                    </div>
                    {q.performance_summary && (
                      <p className="pr-sub">
                        <span>실적</span> {q.performance_summary}
                      </p>
                    )}
                    <MetricGrid groups={q.metric_groups} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        )}

        {data && section === "monthly" && (
          <Panel
            title="월투자원칙"
            meta={`${data.monthly.length}개`}
            note="월계획이 종목에 닿는 유일한 통로다. 이게 없으면 계획 계층이 월에서 끊긴다."
          >
            <DataTable
              rows={data.monthly}
              empty="월투자원칙이 없다. 월계획이 종목에 닿지 않는 상태다."
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
                {
                  key: "direction",
                  label: "방향",
                  render: (r) => <Badge row={r} field="direction" tone="accent" />,
                },
                {
                  key: "predicted_price",
                  label: "예상가",
                  align: "right",
                  render: (r) => price(r.predicted_price),
                },
                {
                  key: "stop_loss_price",
                  label: "손절가",
                  align: "right",
                  render: (r) => price(r.stop_loss_price),
                },
                {
                  key: "upside_ratio",
                  label: "현재가 대비",
                  align: "right",
                  render: (r) =>
                    r.upside_ratio == null ? null : (
                      <span className={r.upside_ratio >= 0 ? "pos" : "neg"}>
                        {r.upside_ratio > 0 ? "+" : ""}
                        {r.upside_ratio}%
                      </span>
                    ),
                },
                { key: "rationale", label: "근거", render: (r) => r.rationale },
              ]}
            />
          </Panel>
        )}
      </AsyncState>
    </div>
  );
}
