import { useEffect, useMemo, useState } from "react";

import AsyncState from "../components/AsyncState";
import DataTable from "../components/DataTable";
import EntityForm from "../components/EntityForm";
import { EditButton } from "../components/EntityModal";
import Modal from "../components/Modal";
import Panel from "../components/Panel";
import PriceBandPanel from "../components/PriceBandPanel";
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
import { dateTime, dateWithWeekday, isoDate, price } from "../lib/format";
import { bandRatios, pct } from "../lib/priceBand";
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
/**
 * 전략 목록을 무엇으로 묶어 볼 것인가.
 *   일자별  같은 날 세운 전략을 나란히 본다. "그날 무엇을 대비했나" 가 단위다.
 *   종목별  한 종목의 전략이 시간에 따라 어떻게 바뀌었나를 본다.
 * 어느 쪽도 목록을 걸러 내지 않는다 — 묶는 방법만 바뀐다.
 */
const GROUP_TABS = [
  { key: "date", label: "일자별" },
  { key: "security", label: "종목별" },
];

const PRICE_SOURCE_LABEL = {
  MINUTE: "당일 분봉",
  DAILY: "일봉 확정",
};

export default function StrategyPage() {
  const [view, setView] = useState("STRATEGY");
  const [groupBy, setGroupBy] = useState("date");
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

  const securityById = useMemo(
    () => new Map((refs.data?.securities || []).map((s) => [s.id, s])),
    [refs.data]
  );

  /**
   * 전략을 묶는다. 기준일은 **전략의 기준시각**(`reference_at`) 이다 — 실제로 그날 대응하려고
   * 세운 것이라서다. 없으면 근거 스냅샷의 일자로 물러난다.
   */
  const groups = useMemo(() => {
    const map = new Map();
    for (const st of list.data || []) {
      const pd = st.price_data_detail;
      const key =
        groupBy === "security"
          ? pd?.security ?? "__none__"
          : isoDate(st.reference_at) || isoDate(pd?.price_at) || "__none__";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(st);
    }
    const label = (key) => {
      if (key === "__none__") return groupBy === "security" ? "종목 없음" : "기준일 없음";
      if (groupBy === "security") {
        const sec = securityById.get(key);
        return sec ? `${sec.name} (${sec.symbol})` : `종목 #${key}`;
      }
      return dateWithWeekday(key);
    };
    return Array.from(map, ([key, items]) => ({ key, label: label(key), items })).sort((a, b) =>
      // 일자는 최신이 위로, 종목은 이름순.
      groupBy === "date" ? String(b.key).localeCompare(String(a.key)) : a.label.localeCompare(b.label)
    );
  }, [list.data, groupBy, securityById]);

  const optionsMap = useMemo(
    () => ({
      securities: (refs.data?.securities || []).map((s) => ({
        value: s.id,
        label: `${s.name} (${s.symbol})`,
      })),
      // 가격데이터는 더 이상 드롭다운이 아니다 — 전략 폼이 종목·거래일 목록으로 직접
      // 고르고(`PriceDataPicker`), 원본 행은 아래 `ctx.priceRows` 로 넘어간다.
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
                    key: "current_price",
                    label: "현재가",
                    align: "right",
                    render: (r) => price(r.current_price),
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
              <div className="stp-grouptabs" role="group" aria-label="전략 묶는 기준">
                {GROUP_TABS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    className={`stp-grouptab ${groupBy === t.key ? "is-on" : ""}`}
                    aria-pressed={groupBy === t.key}
                    onClick={() => setGroupBy(t.key)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="panel-actions">
                <button className="btn is-sm" onClick={() => form.openCreate("STRATEGY")}>
                  + 전략
                </button>
              </div>
            </div>

            <nav className="stp-groups" aria-label="전략 목록">
              {groups.map((g) => (
                <section key={g.key} className="stp-group">
                  <h3 className="stp-group-head">
                    <span className="num">{g.label}</span>
                    <span className="stp-group-count num">{g.items.length}건</span>
                  </h3>
                  <div className="stp-list">
                    {g.items.map((s) => {
                      const pd = s.price_data_detail;
                      const r = bandRatios(pd);
                      const sec = pd ? securityById.get(pd.security) : null;
                      return (
                        <button
                          key={s.id}
                          className={`stp-item ${selectedId === s.id ? "is-on" : ""}`}
                          onClick={() => setSelectedId(s.id)}
                        >
                          <strong>{s.policy_name || `전략#${s.id}`}</strong>
                          <span className="stp-item-meta num">
                            {/* 묶은 기준은 머리에 이미 있으니 여기엔 나머지 축을 적는다. */}
                            {groupBy === "date"
                              ? sec?.name || s.sector || "종목 미지정"
                              : isoDate(s.reference_at) || "기준일 없음"}
                            {" · "}
                            {s.method_count}단계
                          </span>
                          {/* 변동폭 — 금액이 아니라 비율이라 다른 가격대의 전략과도 견줄 수 있다. */}
                          {r && (
                            <span className="stp-item-band num">
                              <span className="is-up">{pct(r.up, 1)}</span>
                              <span className="stp-item-tilde">~</span>
                              <span className="is-down">{pct(r.down, 1)}</span>
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </nav>

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
                    <PriceBandPanel
                      snapshot={detail.data.price_data_detail}
                      security={
                        detail.data.price_data_detail
                          ? securityById.get(detail.data.price_data_detail.security)
                          : null
                      }
                    />

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
            // 일자 목록은 종목**코드**로 봉을 조회한다. 셀렉트 옵션에는 라벨만 있어
            // 코드가 없으므로 종목 원본을 같이 넘긴다.
            ctx={{
              securities: refs.data?.securities || [],
              // 이미 떠 둔 스냅샷. 같은 날 같은 종목이면 새로 만들지 않고 이걸 재사용한다.
              priceRows: refs.data?.priceData || [],
            }}
            onSubmit={form.submit}
            onCancel={form.close}
            onDelete={form.isEdit ? form.remove : undefined}
          />
        </Modal>
      )}
    </div>
  );
}
