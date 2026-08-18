import { useEffect, useMemo, useState } from "react";

import AsyncState from "../components/AsyncState";
import DataTable from "../components/DataTable";
import EntityForm from "../components/EntityForm";
import { EditButton } from "../components/EntityModal";
import Modal from "../components/Modal";
import Panel from "../components/Panel";
import SplitTable from "../components/SplitTable";
import {
  getTradingStrategy,
  listPriceData,
  listSecurities,
  listTradingStrategies,
  priceData as priceDataApi,
  strategyMethod,
  tradingStrategy,
} from "../api/trading";
import {
  PRICE_DATA_FIELDS,
  STRATEGY_METHOD_FIELDS,
  TRADING_STRATEGY_FIELDS,
} from "../forms/specs";
import { dateTime, price } from "../lib/format";
import { useAsync, useAsyncAll } from "../lib/useAsync";
import { useMultiForm } from "../lib/useMultiForm";
import "./StrategyPage.css";

/**
 * 전략 — n차 분할표.
 *
 * 전략이 일별 가격데이터(`daily_security_price_data`)를 가리킨다는 게 이 화면의 요점이다.
 * '지금 가격 기준'이 아니라 '그때 그 가격 기준'으로 못박혀 있어서,
 * 나중에 왜 이 가격대에 분할을 걸었는지 되짚을 수 있다.
 */
const VIEW_TABS = [
  { key: "STRATEGY", label: "매수매도전략" },
  { key: "PRICE", label: "가격데이터" },
];

/**
 * 가격데이터의 고가·저가가 어디서 온 값인가.
 * 서버가 라벨을 주지 않는 코드값이라 여기서만 최소로 맵을 둔다(`format.js` 의 LEVEL_LABEL 과 같은 성격).
 * 비어 있으면 사람이 직접 적은 값이다.
 */
const PRICE_SOURCE_LABEL = {
  MINUTE: "당일 분봉",
  DAILY: "일봉 확정",
};

export default function StrategyPage() {
  const [view, setView] = useState("STRATEGY");
  const [selectedId, setSelectedId] = useState(null);

  const list = useAsync(() => listTradingStrategies(), []);
  const refs = useAsyncAll(
    { securities: () => listSecurities(), priceData: () => listPriceData() },
    []
  );

  useEffect(() => {
    if (list.data?.length && !list.data.some((s) => s.id === selectedId)) {
      setSelectedId(list.data[0].id);
    }
  }, [list.data, selectedId]);

  const detail = useAsync(
    () => (selectedId ? getTradingStrategy(selectedId) : Promise.resolve(null)),
    [selectedId]
  );

  const reloadAll = async () => {
    await Promise.all([list.reload(), detail.reload(), refs.reload()]);
  };

  const kinds = useMemo(
    () => ({
      STRATEGY: { title: "매수매도전략", fields: TRADING_STRATEGY_FIELDS, api: tradingStrategy },
      METHOD: { title: "분할 단계", fields: STRATEGY_METHOD_FIELDS, api: strategyMethod },
      PRICE: { title: "가격데이터", fields: PRICE_DATA_FIELDS, api: priceDataApi },
    }),
    []
  );
  const form = useMultiForm(kinds, reloadAll);

  const securityLabelById = useMemo(() => {
    const map = new Map();
    (refs.data?.securities || []).forEach((s) => {
      map.set(s.id, `${s.name} (${s.symbol})`);
    });
    return map;
  }, [refs.data]);

  const optionsMap = useMemo(
    () => ({
      securities: (refs.data?.securities || []).map((s) => ({
        value: s.id,
        label: `${s.name} (${s.symbol})`,
      })),
      // 라벨은 ID · 종목 · 호가 · YY-MM-DD HH:MM 을 한 줄에 —
      // 전략을 세우던 그때가 언제·어느 종목·어느 가격이었는지 다 보여야 헷갈리지 않는다.
      // 연도가 빠지면 지난 해 것과 올해 것이 섞여도 눈에 안 잡힌다.
      priceData: (refs.data?.priceData || []).map((p) => {
        const sec = securityLabelById.get(p.security) || `#${p.security}`;
        const t = p.price_at ? new Date(p.price_at) : null;
        const when =
          t && !Number.isNaN(t.getTime())
            ? `${String(t.getFullYear()).slice(-2)}-${String(t.getMonth() + 1).padStart(
                2,
                "0"
              )}-${String(t.getDate()).padStart(2, "0")} ${String(t.getHours()).padStart(
                2,
                "0"
              )}:${String(t.getMinutes()).padStart(2, "0")}`
            : "—";
        return {
          value: p.id,
          label: `#${p.id}  ${sec}  ${price(p.quote_price)}원  ${when}`,
        };
      }),
      strategies: (list.data || []).map((s) => ({
        value: s.id,
        label: s.policy_name || `전략#${s.id}`,
      })),
    }),
    [refs.data, list.data, securityLabelById]
  );

  return (
    <div className="stp">
      {form.loadError && (
        <p className="stp-loaderr">원본을 불러오지 못했다 — {String(form.loadError.message)}</p>
      )}

      <div className="stp-viewtabs" role="tablist" aria-label="전략 보기 방식">
        {VIEW_TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={view === t.key}
            className={`stp-viewtab ${view === t.key ? "is-on" : ""}`}
            onClick={() => setView(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {view === "PRICE" && (
        <AsyncState loading={refs.loading} error={refs.error} onRetry={refs.reload}>
          {refs.data && (
            <Panel
              title="가격데이터"
              meta={`${(refs.data.priceData || []).length}건`}
              note="전략은 이 행을 가리켜 '그때 그 가격 기준'을 못박는다. 함부로 지우면 전략의 근거가 사라진다."
              actions={
                <button className="btn is-sm" onClick={() => form.openCreate("PRICE")}>
                  + 가격데이터
                </button>
              }
            >
              <DataTable
                rows={refs.data.priceData || []}
                empty="가격데이터가 없다. 전략을 세우려면 먼저 기준 가격을 남겨 둔다."
                columns={[
                  {
                    key: "security",
                    label: "종목",
                    render: (r) => securityLabelById.get(r.security) || `#${r.security}`,
                  },
                  {
                    key: "price_at",
                    label: "시각",
                    render: (r) => <span className="num">{dateTime(r.price_at)}</span>,
                  },
                  {
                    key: "high_price",
                    label: "고가",
                    align: "right",
                    render: (r) => price(r.high_price),
                  },
                  {
                    key: "low_price",
                    label: "저가",
                    align: "right",
                    render: (r) => price(r.low_price),
                  },
                  {
                    key: "quote_price",
                    label: "호가",
                    align: "right",
                    render: (r) => price(r.quote_price),
                  },
                  {
                    // 고가·저가가 어디서 온 값인지. 수집분을 뜬 것과 사람이 적은 것은
                    // 근거의 무게가 다른데, 숫자만 두면 둘이 구분되지 않는다.
                    key: "price_source",
                    label: "출처",
                    render: (r) =>
                      r.price_source ? (
                        <span className="pill">{PRICE_SOURCE_LABEL[r.price_source] || r.price_source}</span>
                      ) : (
                        <span className="pill">직접 입력</span>
                      ),
                  },
                  { key: "remarks", label: "비고" },
                  {
                    key: "_edit",
                    label: "",
                    align: "right",
                    width: 60,
                    render: (r) => <EditButton onClick={() => form.openEdit("PRICE", r.id)} />,
                  },
                ]}
              />
            </Panel>
          )}
        </AsyncState>
      )}

      {view === "STRATEGY" && (
      <AsyncState loading={list.loading} error={list.error} onRetry={list.reload}>
        {list.data && (
          <>
            <div className="stp-bar">
              <nav className="stp-list" aria-label="전략 목록">
                {list.data.map((s) => (
                  <button
                    key={s.id}
                    className={`stp-item ${selectedId === s.id ? "is-on" : ""}`}
                    onClick={() => setSelectedId(s.id)}
                  >
                    <strong>{s.policy_name || `전략#${s.id}`}</strong>
                    <span className="stp-item-meta num">
                      {s.sector || "업종 미지정"} · {s.method_count}단계
                    </span>
                  </button>
                ))}
              </nav>
              <div className="panel-actions">
                <button className="btn is-sm" onClick={() => form.openCreate("STRATEGY")}>
                  + 전략
                </button>
              </div>
            </div>

            {list.data.length === 0 ? (
              <Panel title="매수매도전략">
                <p className="stp-empty">
                  전략이 없다. 떨어지기 전에 몇 %에 얼마를 살지 적어 두지 않으면,
                  물타기는 계획이 아니라 반응이 된다.
                </p>
              </Panel>
            ) : (
              <AsyncState loading={detail.loading} error={detail.error} onRetry={detail.reload}>
                {detail.data && (
                  <Panel
                    title={detail.data.policy_name || `전략#${detail.data.id}`}
                    meta={dateTime(detail.data.reference_at)}
                    note="분할표를 미리 채워 두는 것이 규율의 실체다. 수량 비중의 합이 100%가 아니면 그 자리에 표시된다."
                    actions={
                      <div className="panel-actions">
                        <button
                          className="btn is-sm"
                          onClick={() => form.openEdit("STRATEGY", detail.data.id)}
                        >
                          전략 수정
                        </button>
                        <button
                          className="btn is-sm is-primary"
                          onClick={() =>
                            form.openCreate("METHOD", { strategy: detail.data.id })
                          }
                        >
                          + 분할 단계
                        </button>
                      </div>
                    }
                  >
                    {detail.data.price_data_detail ? (
                      <div className="stp-price">
                        <span className="stp-price-label">기준 가격데이터</span>
                        <span className="num">
                          고가 {price(detail.data.price_data_detail.high_price)} · 저가{" "}
                          {price(detail.data.price_data_detail.low_price)} · 호가{" "}
                          {price(detail.data.price_data_detail.quote_price)}
                        </span>
                        <span className="num stp-price-at">
                          {dateTime(detail.data.price_data_detail.price_at)}
                        </span>
                      </div>
                    ) : (
                      <p className="stp-noprice">
                        기준 가격데이터가 없다. 어느 가격을 보고 세운 분할인지 남지 않아,
                        나중에 이 표를 되짚을 근거가 없다.
                      </p>
                    )}

                    <SplitTable
                      methods={detail.data.methods}
                      onEditMethod={(m) => form.openEdit("METHOD", m.id)}
                    />
                  </Panel>
                )}
              </AsyncState>
            )}
          </>
        )}
      </AsyncState>
      )}

      {form.isOpen && (
        <Modal
          title={`${form.spec.title} ${form.isEdit ? "수정" : "추가"}`}
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
    </div>
  );
}
