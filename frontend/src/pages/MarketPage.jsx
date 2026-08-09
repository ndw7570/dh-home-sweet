import { useMemo } from "react";

import AsyncState from "../components/AsyncState";
import Badge, { TrendBadge } from "../components/Badge";
import EntityForm from "../components/EntityForm";
import Modal from "../components/Modal";
import Panel from "../components/Panel";
import {
  affectedSecurity,
  listMarketDirections,
  listSecurities,
  marketDirection,
} from "../api/trading";
import { AFFECTED_SECURITY_FIELDS, MARKET_DIRECTION_FIELDS } from "../forms/specs";
import { isoDate } from "../lib/format";
import { useAsyncAll } from "../lib/useAsync";
import { useMultiForm } from "../lib/useMultiForm";
import "./MarketPage.css";

/**
 * 시장 — "무엇 때문에 시장을 이렇게 보는가".
 *
 * `factor_value`(수치)를 근거와 같은 행에 남기는 것이 이 테이블의 핵심이다.
 * "금리가 부담된다" 같은 문장만 남기면 나중에 그 판단이 맞았는지 확인할 방법이 없다.
 * 숫자를 같이 적어 두면 그 숫자가 실제로 어떻게 움직였는지와 대조할 수 있다.
 */
export default function MarketPage() {
  const { data, error, loading, reload } = useAsyncAll(
    {
      directions: () => listMarketDirections(),
      securities: () => listSecurities(),
    },
    []
  );

  const kinds = useMemo(
    () => ({
      DIRECTION: { title: "시장방향", fields: MARKET_DIRECTION_FIELDS, api: marketDirection },
      AFFECTED: { title: "영향 종목", fields: AFFECTED_SECURITY_FIELDS, api: affectedSecurity },
    }),
    []
  );
  const form = useMultiForm(kinds, reload);

  const directions = data?.directions || [];
  const optionsMap = useMemo(
    () => ({
      securities: (data?.securities || []).map((s) => ({
        value: s.id,
        label: `${s.name} (${s.symbol})`,
      })),
      directions: directions.map((d) => ({
        value: d.id,
        label: `${d.factor_type_label || d.factor_type || "요인"} → ${
          d.direction_label || d.direction || "?"
        } (${isoDate(d.created_at)})`,
      })),
    }),
    [data, directions]
  );

  return (
    <AsyncState loading={loading} error={error} onRetry={reload}>
      {data && (
        <>
          {form.loadError && (
            <p className="mp-loaderr">원본을 불러오지 못했다 — {String(form.loadError.message)}</p>
          )}

          <Panel
            title="시장방향"
            meta={`${directions.length}건`}
            note="근거 없이 방향만 바꾸는 것은 서버가 막는다(rationale 필수). 방향 전환에는 항상 이유가 붙어 있어야 한다."
            actions={
              <div className="panel-actions">
                <button className="btn is-sm" onClick={() => form.openCreate("DIRECTION")}>
                  + 시장방향
                </button>
                <button
                  className="btn is-sm"
                  onClick={() => form.openCreate("AFFECTED")}
                  disabled={!directions.length || !data.securities.length}
                  title={directions.length ? undefined : "시장방향을 먼저 기록한다"}
                >
                  + 영향 종목
                </button>
              </div>
            }
          >
            {directions.length === 0 ? (
              <p className="mp-empty">
                아직 기록한 시장방향이 없다. 무엇 때문에 시장을 그렇게 보는지 적어 두지 않으면,
                나중에 그 판단이 맞았는지 확인할 방법이 없다.
              </p>
            ) : (
              <ul className="mp-list">
                {directions.map((d) => (
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
                      <button
                        type="button"
                        className="row-edit"
                        onClick={() => form.openEdit("DIRECTION", d.id)}
                      >
                        수정
                      </button>
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

          {form.isOpen && (
            <Modal
              title={`${form.spec.title} ${form.isEdit ? "수정" : "추가"}`}
              subtitle={
                form.kind === "AFFECTED"
                  ? "같은 시장방향에 같은 종목을 두 번 걸 수는 없다(서버가 막는다)."
                  : undefined
              }
              onClose={form.close}
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
        </>
      )}
    </AsyncState>
  );
}
