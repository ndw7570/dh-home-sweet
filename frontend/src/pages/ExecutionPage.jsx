import { useMemo, useState } from "react";

import AsyncState from "../components/AsyncState";
import EntityForm from "../components/EntityForm";
import MetricCard, { MetricRow } from "../components/MetricCard";
import Modal from "../components/Modal";
import Panel from "../components/Panel";
import { fetchExecutionCompare, listSecurities, order } from "../api/trading";
import { ORDER_FIELDS } from "../forms/specs";
import {
  dateTime,
  dateWithWeekday,
  daysAgoISODate,
  isoDate,
  localISODateTimeInput,
  price,
  qty,
  todayISODate,
  won,
  LEVEL_LABEL,
} from "../lib/format";
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

/**
 * 행위종류는 색만으로 구분하지 않는다 — 기호가 먼저 읽히게 둔다.
 * (Badge.jsx 의 추세 배지와 같은 규칙. 색맹 대응이고, 흑백 출력에서도 갈린다.)
 */
const ACTION_MARK = {
  FILL: "●", // 체결 — 사실로 굳었다
  ORDER: "◐", // 주문 — 냈지만 아직 안 됐다
  PLAN: "○", // 계획 — 대조 대상에서 빠진다
  CANCEL: "✕",
  REJECT: "!",
};

const FLAG_LABEL = {
  NO_PLAN: "계획 없음",
  UNGROUNDED_PLAN: "상위 논리 없음",
  DIRECTION_MISMATCH: "방향 불일치",
  BELOW_STOP_LOSS: "손절 구간 매수",
  ABOVE_TARGET: "예상가 초과",
};

export default function ExecutionPage() {
  const [securityId, setSecurityId] = useState("");
  const [dateFrom, setDateFrom] = useState(() => daysAgoISODate(30));
  const [dateTo, setDateTo] = useState(todayISODate);

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

  /**
   * 이행을 **이행일별로** 묶는다.
   *
   * 계획은 하루 단위로 세우고(일계획), 이행도 하루 안에서 여러 번 일어난다.
   * 평평한 목록으로 두면 "그날 계획대로 했나" 를 사람이 눈으로 날짜를 세어 가며
   * 맞춰야 한다. 날짜가 그 질문의 단위라, 화면의 단위도 날짜여야 한다.
   *
   * 묶는 키는 서버가 판정에 실제로 쓴 `row.date` 다 — 화면에서 다시 계산하면
   * 시간대 때문에 서버 판정과 어긋난 날짜로 묶이는 일이 생긴다.
   * `row.date` 가 없는 건 목 데이터처럼 옛 응답 모양일 때뿐이라, 그때만 이행시각에서 뽑는다.
   */
  const dayGroups = useMemo(() => {
    const map = new Map();
    for (const row of compare?.rows || []) {
      const key = row.date || isoDate(row.order.executed_at) || "(날짜 없음)";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(row);
    }
    return Array.from(map, ([date, rows]) => ({
      date,
      rows,
      flagged: rows.filter((r) => r.flags.length > 0).length,
    }));
  }, [compare]);

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
                      executed_at: localISODateTimeInput(new Date()),
                    })
                  }
                  disabled={!securities.data?.length}
                  title={securities.data?.length ? undefined : "종목을 먼저 등록한다"}
                >
                  + 이행 기록
                </button>
              }
            >
              {dayGroups.length === 0 ? (
                <p className="ep-empty">이 기간에 이행 기록이 없다.</p>
              ) : (
                <div className="ep-days">
                  {dayGroups.map((g) => (
                    <section key={g.date} className="ep-day">
                      <div className="ep-day-head">
                        <strong className="ep-day-date num">{dateWithWeekday(g.date)}</strong>
                        <span className="ep-day-count num">이행 {g.rows.length}건</span>
                        {g.flagged > 0 ? (
                          <span className="ep-day-flagged num">표시 {g.flagged}건</span>
                        ) : (
                          <span className="ep-day-clean">표시 없음</span>
                        )}
                      </div>
                      <ul className="ep-rows">
                        {g.rows.map((row) => (
                          <OrderRow
                            key={row.order.id}
                            row={row}
                            onEdit={() => form.openEdit("ORDER", row.order.id)}
                          />
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
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

/**
 * 이행 한 건 + 그 건에 걸린 표시 + 무엇과 대조했는지.
 *
 * 대조 대상이 일계획일 때와 주(종목별)계획일 때를 라벨로 갈라 둔다.
 * 같은 "대조한 계획" 이어도 그날을 콕 집어 세운 계획과 그 주 전체를 덮는 계획은
 * 근거의 무게가 다르다. 그걸 뭉뚱그리면 준수율이 어디에 기대고 있는지 알 수 없다.
 */
function OrderRow({ row, onEdit }) {
  const { order, security, flags, matched_plans: plans } = row;

  return (
    <li className={`ep-row ${flags.length ? "is-flagged" : "is-clean"}`}>
      <div className="ep-row-head">
        <span className={`ep-side is-${(order.side || "").toLowerCase()}`}>
          {order.side_label || order.side || "?"}
        </span>
        <span className={`ep-action is-${(order.action_type || "").toLowerCase()}`}>
          <span className="ep-action-mark" aria-hidden="true">
            {ACTION_MARK[order.action_type] || "·"}
          </span>
          {order.action_type_label || order.action_type || "?"}
        </span>
        {security && (
          <strong className="num">
            {security.name} {security.symbol}
          </strong>
        )}
        <span className="num ep-nums">
          {qty(order.quantity)}주 × {price(order.limit_price)}
          {order.notional != null && ` = ${won(order.notional)}`}
        </span>
        <span className="num ep-when">{dateTime(order.executed_at)}</span>
        <button type="button" className="row-edit" onClick={onEdit}>
          수정
        </button>
      </div>

      {flags.length > 0 && (
        <ul className="ep-flags">
          {flags.map((f, i) => (
            <li key={i} className={`ep-flag is-${f.severity.toLowerCase()}`}>
              <span className="ep-flag-code">{FLAG_LABEL[f.code] || f.code}</span>
              {f.message}
            </li>
          ))}
        </ul>
      )}

      {plans.length > 0 ? (
        <div className="ep-plans">
          <span className="ep-plans-label">대조한 계획</span>
          {plans.map((p) => (
            <span key={`${p.level}-${p.id}`} className="ep-plan num">
              <span className={`ep-plan-lv is-${p.level.toLowerCase()}`}>
                {LEVEL_LABEL[p.level] || p.level}
              </span>
              {p.title}
              {p.predicted_price != null && ` · 예상 ${price(p.predicted_price)}`}
              {p.stop_loss_price != null && ` · 손절 ${price(p.stop_loss_price)}`}
            </span>
          ))}
        </div>
      ) : (
        <p className="ep-noplan">대조할 계획이 없다 — 일계획도, 주(종목별)계획도.</p>
      )}

      {order.remarks && <p className="ep-remarks">{order.remarks}</p>}
    </li>
  );
}
