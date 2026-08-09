import { useMemo, useState } from "react";

import AsyncState from "../components/AsyncState";
import EntityForm from "../components/EntityForm";
import MetricCard, { MetricRow } from "../components/MetricCard";
import Modal from "../components/Modal";
import Panel from "../components/Panel";
import { fetchExecutionCompare, listSecurities, order } from "../api/trading";
import { ORDER_FIELDS } from "../forms/specs";
import { dateTime, price, qty, won } from "../lib/format";
import { useAsync, useAsyncAll } from "../lib/useAsync";
import { useMultiForm } from "../lib/useMultiForm";
import "./ExecutionPage.css";

/**
 * 이행 — 계획한 것과 실제로 한 것의 간극.
 *
 * `orders` 의 테이블 코멘트가 '주문'이 아니라 '이행'인 이유가 이 화면이다.
 * 서버는 위반이라고 단정하지 않고 표시(flag)만 한다. 계획 밖의 매매가 항상
 * 잘못은 아니다. 다만 그것이 계획 밖이었다는 사실이 기록에 남아야,
 * 나중에 그 결정이 좋았는지 나빴는지 갈라 볼 수 있다.
 *
 * 규율 준수율 하나가 이 프로그램이 답하려는 질문이다.
 */

const FLAG_LABEL = {
  NO_PLAN: "계획 없음",
  UNGROUNDED_PLAN: "상위 논리 없음",
  DIRECTION_MISMATCH: "방향 불일치",
  BELOW_STOP_LOSS: "손절 구간 매수",
  ABOVE_TARGET: "예상가 초과",
};

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

export default function ExecutionPage() {
  const [securityId, setSecurityId] = useState("");
  const [dateFrom, setDateFrom] = useState(() => daysAgo(30));
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));

  const securities = useAsync(() => listSecurities(), []);
  const { data, error, loading, reload } = useAsyncAll(
    {
      compare: () =>
        fetchExecutionCompare({
          security_id: securityId || undefined,
          date_from: dateFrom,
          date_to: dateTo,
        }),
    },
    [securityId, dateFrom, dateTo]
  );

  const kinds = useMemo(
    () => ({ ORDER: { title: "이행", fields: ORDER_FIELDS, api: order } }),
    []
  );
  const form = useMultiForm(kinds, reload);

  const optionsMap = useMemo(
    () => ({
      securities: (securities.data || []).map((s) => ({
        value: s.id,
        label: `${s.name} (${s.symbol})`,
      })),
    }),
    [securities.data]
  );

  const compare = data?.compare;
  const summary = compare?.summary;

  return (
    <div className="ep">
      <div className="ep-controls">
        <label>
          <span>종목</span>
          <select value={securityId} onChange={(e) => setSecurityId(e.target.value)}>
            <option value="">전체</option>
            {(securities.data || []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.symbol})
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
        {compare && (
          <>
            <MetricRow>
              <MetricCard
                label="규율 준수율"
                value={summary.discipline_rate == null ? "—" : summary.discipline_rate}
                unit={summary.discipline_rate == null ? "" : "%"}
                hint="표시 없이 넘어간 이행의 비율"
                tone={
                  summary.discipline_rate == null
                    ? undefined
                    : summary.discipline_rate >= 80
                      ? "success"
                      : summary.discipline_rate >= 50
                        ? "warning"
                        : "danger"
                }
              />
              <MetricCard
                label="이행 건수"
                value={summary.order_count}
                unit="건"
                hint="계획(PLAN) 행은 대조 대상에서 뺀다"
              />
              <MetricCard
                label="표시된 건"
                value={summary.flagged_count}
                unit="건"
                hint="계획과 어긋난 흔적"
                tone={summary.flagged_count > 0 ? "warning" : undefined}
              />
            </MetricRow>

            <Panel
              title="계획 대비 이행"
              meta={`${compare.date_from} ~ ${compare.date_to}`}
              note="표시(flag)는 판결이 아니라 기록이다. 계획 밖이었다는 사실이 남아 있어야 나중에 되짚을 수 있다."
              actions={
                <button
                  className="btn is-sm"
                  onClick={() =>
                    form.openCreate("ORDER", {
                      security: securityId || "",
                      action_type: "FILL",
                      executed_at: new Date().toISOString().slice(0, 16),
                    })
                  }
                  disabled={!securities.data?.length}
                  title={securities.data?.length ? undefined : "종목을 먼저 등록한다"}
                >
                  + 이행 기록
                </button>
              }
            >
              {compare.rows.length === 0 ? (
                <p className="ep-empty">이 기간에 이행 기록이 없다.</p>
              ) : (
                <ul className="ep-rows">
                  {compare.rows.map((row) => (
                    <li
                      key={row.order.id}
                      className={`ep-row ${row.flags.length ? "is-flagged" : "is-clean"}`}
                    >
                      <div className="ep-row-head">
                        <span className={`ep-side is-${(row.order.side || "").toLowerCase()}`}>
                          {row.order.side_label || row.order.side || "?"}
                        </span>
                        <span className="ep-action">{row.order.action_type_label}</span>
                        {row.security && (
                          <strong className="num">
                            {row.security.name} {row.security.symbol}
                          </strong>
                        )}
                        <span className="num ep-nums">
                          {qty(row.order.quantity)}주 × {price(row.order.limit_price)}
                          {row.order.notional != null && ` = ${won(row.order.notional)}`}
                        </span>
                        <span className="num ep-when">{dateTime(row.order.executed_at)}</span>
                        <button
                          type="button"
                          className="row-edit"
                          onClick={() => form.openEdit("ORDER", row.order.id)}
                        >
                          수정
                        </button>
                      </div>

                      {row.flags.length > 0 && (
                        <ul className="ep-flags">
                          {row.flags.map((f, i) => (
                            <li key={i} className={`ep-flag is-${f.severity.toLowerCase()}`}>
                              <span className="ep-flag-code">
                                {FLAG_LABEL[f.code] || f.code}
                              </span>
                              {f.message}
                            </li>
                          ))}
                        </ul>
                      )}

                      {row.matched_plans.length > 0 ? (
                        <div className="ep-plans">
                          <span className="ep-plans-label">대조한 주계획</span>
                          {row.matched_plans.map((p) => (
                            <span key={p.id} className="ep-plan num">
                              {p.title}
                              {p.predicted_price != null && ` · 예상 ${price(p.predicted_price)}`}
                              {p.stop_loss_price != null && ` · 손절 ${price(p.stop_loss_price)}`}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="ep-noplan">대조할 주계획이 없다.</p>
                      )}

                      {row.order.remarks && <p className="ep-remarks">{row.order.remarks}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </>
        )}
      </AsyncState>

      {form.isOpen && (
        <Modal
          title={`이행 ${form.isEdit ? "수정" : "기록"}`}
          subtitle="계획한 것과 실제로 한 것 사이의 간극이 이 표에서 드러난다. 계획 밖이었다면 비고에 왜 그랬는지 적어 둔다."
          onClose={form.close}
        >
          <EntityForm
            fields={ORDER_FIELDS}
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
