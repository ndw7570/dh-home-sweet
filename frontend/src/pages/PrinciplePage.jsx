import { useMemo, useState } from "react";

import AsyncState from "../components/AsyncState";
import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import EntityForm from "../components/EntityForm";
import { EditButton } from "../components/EntityModal";
import Modal from "../components/Modal";
import Panel from "../components/Panel";
import {
  investmentPrinciple,
  listInvestmentPrinciples,
  listMandatoryPrinciples,
  listMonthlyPlans,
  listMonthlyPrinciples,
  listPrincipleSources,
  listQuarterlyPlans,
  listQuarterlyPrinciples,
  listSecurities,
  mandatoryPrinciple,
  monthlyPrinciple,
  principleSource,
  quarterlyPrinciple,
} from "../api/trading";
import {
  INVESTMENT_PRINCIPLE_FIELDS,
  MANDATORY_PRINCIPLE_FIELDS,
  MONTHLY_PRINCIPLE_FIELDS,
  PRINCIPLE_SOURCE_FIELDS,
  QUARTERLY_PRINCIPLE_FIELDS,
} from "../forms/specs";
import { percent, price, LEVEL_LABEL } from "../lib/format";
import { useAsyncAll } from "../lib/useAsync";
import { useMultiForm } from "../lib/useMultiForm";
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
  { key: "mandatory", label: "나의 필수원칙", kind: "MANDATORY", addLabel: "+ 필수원칙" },
  { key: "teacher", label: "대가의 원칙", kind: "TEACHER", addLabel: "+ 대가 원칙" },
  { key: "quarterly", label: "분기투자원칙", kind: "QUARTERLY", addLabel: "+ 분기 실적 카드" },
  { key: "monthly", label: "월투자원칙", kind: "MONTHLY", addLabel: "+ 월투자원칙" },
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
      sources: () => listPrincipleSources(),
      securities: () => listSecurities(),
      quarterlyPlans: () => listQuarterlyPlans(),
      monthlyPlans: () => listMonthlyPlans(),
    },
    []
  );

  const kinds = useMemo(
    () => ({
      MANDATORY: { title: "나의 필수원칙", fields: MANDATORY_PRINCIPLE_FIELDS, api: mandatoryPrinciple },
      TEACHER: { title: "대가의 원칙", fields: INVESTMENT_PRINCIPLE_FIELDS, api: investmentPrinciple },
      SOURCE: { title: "원칙 소스", fields: PRINCIPLE_SOURCE_FIELDS, api: principleSource },
      QUARTERLY: {
        title: "분기투자원칙",
        fields: QUARTERLY_PRINCIPLE_FIELDS,
        api: quarterlyPrinciple,
        wide: true,
      },
      MONTHLY: { title: "월투자원칙", fields: MONTHLY_PRINCIPLE_FIELDS, api: monthlyPrinciple },
    }),
    []
  );
  const form = useMultiForm(kinds, reload);

  const optionsMap = useMemo(
    () => ({
      sources: (data?.sources || []).map((s) => ({ value: s.id, label: s.name || `소스#${s.id}` })),
      securities: (data?.securities || []).map((s) => ({
        value: s.id,
        label: `${s.name} (${s.symbol})`,
      })),
      quarterlyPlans: (data?.quarterlyPlans || []).map((p) => ({ value: p.id, label: p.title })),
      monthlyPlans: (data?.monthlyPlans || []).map((p) => ({
        value: p.id,
        label: `${p.title} [${p.scenario_planning_label || p.scenario_planning}]`,
      })),
    }),
    [data]
  );

  const current = SECTIONS.find((s) => s.key === section);

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

      {form.loadError && (
        <p className="pr-loaderr">원본을 불러오지 못했다 — {String(form.loadError.message)}</p>
      )}

      <AsyncState loading={loading} error={error} onRetry={reload}>
        {data && section === "mandatory" && (
          <Panel
            title="나의 필수원칙"
            meta={`${data.mandatory.length}개`}
            note="순위가 낮을수록 먼저 읽힌다. 홈 화면 맨 위에 걸리는 목록이 이것이다."
            actions={
              <button className="btn is-sm" onClick={() => form.openCreate("MANDATORY")}>
                {current.addLabel}
              </button>
            }
          >
            {data.mandatory.length === 0 ? (
              <p className="pr-empty">
                필수원칙이 하나도 없다. 홈 화면 맨 위가 비어 있다는 뜻이다.
              </p>
            ) : (
              <ol className="pr-mandatory">
                {data.mandatory.map((p) => (
                  <li key={p.id}>
                    <span className="pr-pri num">{p.priority ?? "-"}</span>
                    <span className="pr-mandatory-text">{p.content}</span>
                    {/*
                      적용기간. 어느 화면에서 이 원칙이 튀어나오는지가 목록에서 보여야
                      한다 — 비어 있으면 어디에도 안 나온다는 뜻이라 그것도 적어 준다.
                      `일` 은 입력을 요구하는 유일한 기간이라 따로 강조한다.
                    */}
                    <span className="pr-scope">
                      {(p.period_types || []).length === 0 ? (
                        <span className="pr-scope-none" title="적용기간을 안 골라 어느 화면에도 나오지 않는다">
                          미설정
                        </span>
                      ) : (
                        p.period_types.map((t) => (
                          <span
                            key={t}
                            className={`pr-scope-tag ${t === "DAY" ? "is-day" : ""}`}
                            title={
                              t === "DAY"
                                ? "이행을 기록할 때마다 지켰는지 묻는다"
                                : "해당 계획 작성 화면에 표시된다"
                            }
                          >
                            {LEVEL_LABEL[t] || t}
                          </span>
                        ))
                      )}
                    </span>
                    <EditButton onClick={() => form.openEdit("MANDATORY", p.id)} />
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        )}

        {data && section === "teacher" && (
          <Panel
            title="대가의 원칙"
            meta={`${data.teacher.length}개`}
            note="원칙은 늘 조건부다. 주의사항이 비어 있으면 어떤 상황에서 이 원칙이 오히려 해가 되는지를 모른 채 갖다 쓰게 된다."
            actions={
              <div className="panel-actions">
                <button className="btn is-sm" onClick={() => form.openCreate("SOURCE")}>
                  + 소스
                </button>
                <button className="btn is-sm" onClick={() => form.openCreate("TEACHER")}>
                  {current.addLabel}
                </button>
              </div>
            }
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
                    <span className="pr-spacer" />
                    <EditButton onClick={() => form.openEdit("TEACHER", p.id)} />
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
            actions={
              <button
                className="btn is-sm"
                onClick={() => form.openCreate("QUARTERLY")}
                disabled={!data.securities.length}
                title={data.securities.length ? undefined : "종목을 먼저 등록한다"}
              >
                {current.addLabel}
              </button>
            }
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
                      <EditButton onClick={() => form.openEdit("QUARTERLY", q.id)} />
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
            actions={
              <button
                className="btn is-sm"
                onClick={() => form.openCreate("MONTHLY")}
                disabled={!data.securities.length}
                title={data.securities.length ? undefined : "종목을 먼저 등록한다"}
              >
                {current.addLabel}
              </button>
            }
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
                {
                  key: "_edit",
                  label: "",
                  align: "right",
                  width: 60,
                  render: (r) => <EditButton onClick={() => form.openEdit("MONTHLY", r.id)} />,
                },
              ]}
            />
          </Panel>
        )}
      </AsyncState>

      {form.isOpen && (
        <Modal
          title={`${form.spec.title} ${form.isEdit ? "수정" : "추가"}`}
          onClose={form.close}
          wide={form.spec.wide}
        >
          <EntityForm
            fields={form.spec.fields}
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
