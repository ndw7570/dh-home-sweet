import { useMemo, useState } from "react";

import AsyncState from "../components/AsyncState";
import Badge, { TrendBadge } from "../components/Badge";
import EntityForm from "../components/EntityForm";
import Modal from "../components/Modal";
import Panel from "../components/Panel";
import {
  affectedSecurity,
  listMarketDirections,
  listNews,
  listSecurities,
  marketDirection,
  news as newsApi,
} from "../api/trading";
import {
  AFFECTED_SECURITY_FIELDS,
  MARKET_DIRECTION_FIELDS,
  NEWS_FIELDS,
} from "../forms/specs";
import { isoDate, todayISODate } from "../lib/format";
import { useAsyncAll } from "../lib/useAsync";
import { useMultiForm } from "../lib/useMultiForm";
import "./MarketPage.css";

/**
 * 시장 — "무엇 때문에 시장을 이렇게 보는가".
 *
 * 계층은 **시장방향 → 뉴스 → 종목** 세 단이다.
 *   시장방향  판단   "금리 때문에 시장을 이렇게 본다"
 *   뉴스      사실   그 판단을 떠받치는 개별 기사·사건
 *   종목      대상   그 기사가 실제로 건드리는 종목
 *
 * 예전에는 시장방향에 종목을 바로 걸었다. 그러면 "어느 기사를 보고 이 종목을
 * 떠올렸나" 가 사라져서, 판단이 틀렸을 때 판단 자체가 틀렸는지 근거로 삼은
 * 사실이 틀렸는지 갈라 볼 수 없다. 그 한 단을 되살린 화면이다.
 *
 * `factor_value`(수치)를 근거와 같은 행에 남기는 원칙은 두 계층에 똑같이 적용된다.
 * "금리가 부담된다" 같은 문장만 남기면 나중에 그 판단이 맞았는지 확인할 수 없다.
 */
export default function MarketPage() {
  const { data, error, loading, reload } = useAsyncAll(
    {
      directions: () => listMarketDirections(),
      news: () => listNews(),
      securities: () => listSecurities(),
    },
    []
  );

  const kinds = useMemo(
    () => ({
      DIRECTION: { title: "시장방향", fields: MARKET_DIRECTION_FIELDS, api: marketDirection },
      NEWS: { title: "뉴스", fields: NEWS_FIELDS, api: newsApi },
      AFFECTED: { title: "영향 종목", fields: AFFECTED_SECURITY_FIELDS, api: affectedSecurity },
    }),
    []
  );
  const form = useMultiForm(kinds, reload);

  const directions = data?.directions || [];
  const newsList = data?.news || [];

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
      // 뉴스 라벨엔 상위 시장방향을 앞에 붙인다 — 내용만으로는 어느 판단 밑인지 모른다.
      news: newsList.map((n) => {
        const parent = n.market_direction_detail;
        const head = (n.content || "").trim().split("\n")[0] || `뉴스 #${n.id}`;
        const prefix = parent
          ? `[${parent.factor_type_label || parent.factor_type || "요인"}] `
          : "";
        return { value: n.id, label: `${prefix}${head.slice(0, 40)}` };
      }),
    }),
    [data, directions, newsList]
  );

  /**
   * 예상 영향 구간으로 뉴스를 좁혀 본다.
   *
   * "지금 어떤 기사가 아직 영향권인가" 가 이 필터가 답하는 질문이다. 기사가 난 날이
   * 아니라 **영향이 먹히는 구간**으로 거른다 — 한 달 전 금리 결정이 지금도 살아 있고,
   * 어제 실적 기사는 이미 끝났을 수 있다.
   *
   * 이미 받아 온 트리를 화면에서 거른다. 서버(`/news/?impact_on=…`)도 같은 필터를
   * 받지만, 이 화면은 시장방향까지 묶어 그리므로 다시 받아 오지 않고 여기서 자른다.
   */
  const [impactOn, setImpactOn] = useState("");

  const inImpact = (n) => {
    if (!impactOn) return true;
    const from = n.expected_impact_from;
    const until = n.expected_impact_until;
    // 구간을 안 적은 뉴스는 판정할 수 없다 — 숨기지 않고 남긴다. 안 적었다는 사실
    // 자체가 채워야 할 자리라, 필터를 걸었다고 사라지면 영영 안 보인다.
    if (!from || !until) return true;
    return from <= impactOn && impactOn <= until;
  };

  const filterNews = (items) => (items || []).filter(inImpact);

  /** 필터로 가려진 뉴스가 몇 건인지 — 얼마나 잘랐는지 말해 주지 않으면 오해한다. */
  const hiddenByFilter = useMemo(() => {
    if (!impactOn) return 0;
    return newsList.filter((n) => !inImpact(n)).length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newsList, impactOn]);

  /** 어느 시장방향에도 안 걸린 뉴스 — 숨기지 않고 따로 모아 보여 준다. */
  const orphanNews = useMemo(
    () => newsList.filter((n) => !n.market_direction).filter(inImpact),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [newsList, impactOn]
  );

  /**
   * 접힌 시장방향의 id 집합.
   *
   * 기본은 펼침이다 — 처음 온 사람에게 빈 목록처럼 보이면 안 된다. 다만 방향 하나에
   * 기사가 쌓이면 세로로 끝없이 길어져서, 접었을 때도 판단에 필요한 것(요인·방향·
   * 수치·뉴스 수·종목 수)은 머리줄에 남겨 둔다. 접어도 훑을 수는 있어야 한다.
   */
  const [collapsed, setCollapsed] = useState(() => new Set());
  const toggle = (id) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allCollapsed = directions.length > 0 && collapsed.size >= directions.length;
  const toggleAll = () =>
    setCollapsed(allCollapsed ? new Set() : new Set(directions.map((d) => d.id)));

  return (
    <AsyncState loading={loading} error={error} onRetry={reload}>
      {data && (
        <>
          {form.loadError && (
            <p className="mp-loaderr">원본을 불러오지 못했다 — {String(form.loadError.message)}</p>
          )}

          <div className="mp-controls">
            <label>
              <span>영향 기준일</span>
              <input
                type="date"
                value={impactOn}
                onChange={(e) => setImpactOn(e.target.value)}
              />
            </label>
            <button
              type="button"
              className="btn is-sm"
              onClick={() => setImpactOn(todayISODate())}
            >
              오늘
            </button>
            {impactOn && (
              <>
                <button type="button" className="btn is-sm" onClick={() => setImpactOn("")}>
                  해제
                </button>
                <span className="mp-controls-note">
                  이 날짜가 예상 영향 구간 안인 뉴스만 본다
                  {hiddenByFilter > 0 && ` · ${hiddenByFilter}건 가려짐`}
                  {" · 구간 미정인 뉴스는 남긴다"}
                </span>
              </>
            )}
          </div>

          <Panel
            title="시장방향"
            meta={`${directions.length}건 · 뉴스 ${newsList.length}건`}
            note="시장방향 → 뉴스 → 종목. 종목은 시장방향에 바로 걸리지 않고 항상 뉴스를 거친다. 어느 기사를 보고 그 종목을 떠올렸는지가 남아야, 판단이 틀렸을 때 판단이 틀린 건지 근거가 틀린 건지 갈라 볼 수 있다. 근거 없이 방향만 바꾸는 것은 서버가 막는다(rationale 필수)."
            actions={
              <div className="panel-actions">
                {directions.length > 1 && (
                  <button className="btn is-sm" onClick={toggleAll}>
                    {allCollapsed ? "모두 펼치기" : "모두 접기"}
                  </button>
                )}
                <button className="btn is-sm" onClick={() => form.openCreate("DIRECTION")}>
                  + 시장방향
                </button>
                <button
                  className="btn is-sm"
                  onClick={() => form.openCreate("NEWS")}
                  disabled={!directions.length}
                  title={directions.length ? undefined : "시장방향을 먼저 기록한다"}
                >
                  + 뉴스
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
                {directions.map((d) => {
                  const open = !collapsed.has(d.id);
                  return (
                    <li key={d.id} className={`mp-item ${open ? "" : "is-collapsed"}`}>
                      <div className="mp-head">
                        <Toggle
                          open={open}
                          onClick={() => toggle(d.id)}
                          label={open ? "접기" : "펼치기"}
                        />
                        <Badge row={d} field="factor_type" tone="accent" />
                        <TrendBadge row={d} field="direction" />
                        {d.factor_value != null && (
                          <span className="mp-value num" title="이 판단의 근거가 된 수치">
                            {d.factor_value}
                          </span>
                        )}
                        {/* 접었을 때도 훑을 수 있어야 한다 — 하위 규모는 머리줄에 남긴다. */}
                        <span className="mp-counts num">
                          뉴스 {d.news_count ?? 0} · 종목 {d.affected_count ?? 0}
                        </span>
                        <span className="mp-date num">{isoDate(d.created_at)}</span>
                        <span className="mp-tools">
                          <button
                            type="button"
                            className="row-edit"
                            onClick={() => form.openEdit("DIRECTION", d.id)}
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            className="row-edit"
                            onClick={() => form.openCreate("NEWS", { market_direction: d.id })}
                          >
                            + 뉴스 추가
                          </button>
                        </span>
                      </div>

                      {/* 접으면 머리줄만 남는다. 판단 문장(content)은 접힌 상태에서도
                          한 줄로 흘려 보여 준다 — 요인 배지만으로는 어느 건인지 모른다. */}
                      {!open && d.content && <p className="mp-peek">{d.content}</p>}

                      {open && (
                        <>
                          {d.content && <p className="mp-content">{d.content}</p>}
                          {d.rationale && (
                            <p className="mp-sub">
                              <span>근거</span> {d.rationale}
                            </p>
                          )}

                          {d.affected_targets && (
                            <div className="mp-affected">
                              <span className="mp-affected-label">영향 대상</span>
                              {Object.entries(d.affected_targets).map(([key, values]) => (
                                <span key={key} className="mp-chip is-loose">
                                  {key}:{" "}
                                  {Array.isArray(values) ? values.join(", ") : String(values)}
                                </span>
                              ))}
                            </div>
                          )}

                          <NewsList
                            items={filterNews(d.news_items)}
                            filtered={Boolean(impactOn)}
                            onEditNews={(id) => form.openEdit("NEWS", id)}
                            onAddSecurity={(id) => form.openCreate("AFFECTED", { news: id })}
                            hasSecurities={Boolean(data.securities?.length)}
                          />
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          {orphanNews.length > 0 && (
            <Panel
              title="시장방향에 안 걸린 뉴스"
              meta={`${orphanNews.length}건`}
              note="위 계층 없이 떠 있는 기사다. 어느 판단을 떠받치는지 정해 주지 않으면 이 기록은 아무것도 설명하지 못한다."
            >
              <ul className="mp-list">
                {orphanNews.map((n) => (
                  <li key={n.id} className="mp-item is-orphan">
                    <div className="mp-head">
                      <Badge row={n} field="factor_type" tone="accent" />
                      <TrendBadge row={n} field="direction" />
                      <span className="mp-date num">{isoDate(n.created_at)}</span>
                      <span className="mp-tools">
                        <button
                          type="button"
                          className="row-edit"
                          onClick={() => form.openEdit("NEWS", n.id)}
                        >
                          수정
                        </button>
                      </span>
                    </div>
                    {n.content && <p className="mp-content">{n.content}</p>}
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {form.isOpen && (
            <Modal
              title={`${form.spec.title} ${form.isEdit ? "수정" : "추가"}`}
              subtitle={
                form.kind === "AFFECTED"
                  ? "종목은 뉴스 아래에 붙는다. 같은 뉴스에 같은 종목을 두 번 걸 수는 없다(서버가 막는다)."
                  : form.kind === "NEWS"
                  ? "시장방향을 떠받치는 개별 사실이다. 판단과 같은 축(방향·요인·수치)으로 적어야 나중에 둘을 나란히 놓고 볼 수 있다."
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

/** 접기/펼치기 삼각형. PlanTimetable 의 것과 같은 기호를 쓴다(화면 간 일관). */
function Toggle({ open, onClick, label }) {
  return (
    <button type="button" className="mp-toggle" onClick={onClick} aria-label={label}>
      {open ? "▼" : "▶"}
    </button>
  );
}

/** 한 방향 아래 뉴스가 이보다 많으면 접어 두고 "더 보기"로 연다. */
const NEWS_PREVIEW = 5;

/**
 * 한 시장방향 아래의 뉴스들, 각 뉴스 아래의 종목들.
 * 뉴스가 하나도 없으면 그 자리에 경고를 찍는다 — 근거 없이 방향만 있는 상태다.
 */
function NewsList({ items, filtered, onEditNews, onAddSecurity, hasSecurities }) {
  const [showAll, setShowAll] = useState(false);

  if (!items?.length) {
    // 필터 때문에 비었을 때와 애초에 없을 때는 다른 상황이다. 같은 경고를 띄우면
    // 기간을 좁혀 놓고 "근거가 없다"고 잘못 읽는다.
    return filtered ? (
      <p className="mp-news-nosec">이 기준일에 영향권인 뉴스가 없다.</p>
    ) : (
      <p className="mp-broken">
        이 방향을 떠받치는 뉴스가 없다. 판단만 있고 근거가 될 사실이 없으면 나중에 되짚을 수 없다.
      </p>
    );
  }

  // 방향 하나에 기사가 수십 건 쌓이면 그 방향만으로 화면이 다 찬다.
  // 최근 것부터 몇 건만 두고 나머지는 접어 둔다(서버가 최신순으로 내려 준다).
  const hidden = Math.max(0, items.length - NEWS_PREVIEW);
  const shown = showAll || !hidden ? items : items.slice(0, NEWS_PREVIEW);

  return (
    <ul className="mp-news">
      {shown.map((n) => (
        <li key={n.id} className="mp-news-item">
          <div className="mp-news-head">
            <span className="mp-news-lv">뉴스</span>
            {n.factor_type_label && (
              <span className="mp-news-factor">{n.factor_type_label}</span>
            )}
            <TrendBadge row={n} field="direction" />
            {n.factor_value != null && <span className="mp-value num">{n.factor_value}</span>}
            {/* 예상 영향 구간. 지금 영향권이면 강조한다 — 아직 살아 있는 근거인지가
                이 화면에서 제일 먼저 알고 싶은 것이다. */}
            <span
              className={`mp-impact num ${n.is_impact_current ? "is-live" : ""} ${
                n.expected_impact_from ? "" : "is-undecided"
              }`}
              title={
                n.expected_impact_days
                  ? `예상 영향 ${n.expected_impact_days}일`
                  : "예상 영향 구간을 안 적었다"
              }
            >
              {n.is_impact_current && <span className="mp-impact-dot" aria-hidden="true">●</span>}
              {n.impact_period_label || "영향 기간 미정"}
            </span>
            <span className="mp-date num">{isoDate(n.created_at)}</span>
            <span className="mp-tools">
              <button type="button" className="row-edit" onClick={() => onEditNews(n.id)}>
                수정
              </button>
              <button
                type="button"
                className="row-edit"
                onClick={() => onAddSecurity(n.id)}
                disabled={!hasSecurities}
                title={hasSecurities ? undefined : "종목을 먼저 등록한다"}
              >
                + 종목 연결
              </button>
            </span>
          </div>

          {n.content && <p className="mp-news-content">{n.content}</p>}
          {n.rationale && (
            <p className="mp-sub">
              <span>근거</span> {n.rationale}
            </p>
          )}

          {n.affected_securities?.length > 0 ? (
            <div className="mp-affected">
              <span className="mp-affected-label">영향 종목</span>
              {n.affected_securities.map((s) => (
                <span key={s.id} className="mp-chip num">
                  {s.name} {s.symbol}
                </span>
              ))}
            </div>
          ) : (
            <p className="mp-news-nosec">아직 연결한 종목이 없다.</p>
          )}
        </li>
      ))}

      {hidden > 0 && (
        <li className="mp-news-more">
          <button type="button" className="row-edit" onClick={() => setShowAll((v) => !v)}>
            {showAll ? "최근 " + NEWS_PREVIEW + "건만 보기" : `나머지 ${hidden}건 더 보기`}
          </button>
        </li>
      )}
    </ul>
  );
}
