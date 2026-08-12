import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { LEVEL_LABEL, localISODate } from "../lib/format";
import "./PlanTimetable.css";

/**
 * 계층형 타임라인 탐색기.
 *
 * 5개 행(연/분기/월/주/일)이 같은 한 해의 시간축을 공유한다.
 * 셀 하나를 누르면 그 구간과 겹치는 다른 계층의 셀들이 함께 밝아지고,
 * 아래 상세 패널에 그 구간에 걸린 계획 목록이 뜬다.
 *
 * "각 범주별로 어떤 계획이 있는가" 를 이 화면 하나에서 답한다.
 *   - 각 셀의 우상단 뱃지 = 그 셀의 계층에 걸린 계획 수
 *   - 셀 클릭 → 아래 패널에 계층 무관하게 그 시간에 걸친 계획 전부
 */

const LEVELS = [
  { key: "YEAR", label: "연" },
  { key: "QUARTER", label: "분기" },
  { key: "MONTH", label: "월" },
  { key: "WEEK", label: "주" },
  { key: "DAY", label: "일" },
];

const DAY_MS = 86400000;
const PX_PER_DAY = 20;

const toDate = (s) => (s ? new Date(`${s}T00:00:00`) : null);
// 로컬 자정에 만들어 둔 셀 경계는 로컬로 다시 찍어야 한다. toISOString() 은 UTC 라 KST 에선 하루가 밀린다.
const iso = (d) => localISODate(d);
const daysBetween = (a, b) => Math.round((b.getTime() - a.getTime()) / DAY_MS);

/**
 * 자식은 부모의 종목을 상속한다.
 * cascade_service 트리 구조상 DAY 노드에는 security 가 안 붙는다 (상위 WEEKLY_SECURITY 에만 붙음).
 * 상속 없이 그리면 일계획 행에 종목이 안 나와, "어느 종목의 일계획인지" 를 사용자가 알 수 없다.
 */
function flatten(tree, parentContext = { title: null, security: null }, acc = []) {
  (tree || []).forEach((n) => {
    const security = n.security || n.securities?.[0] || parentContext.security || null;
    acc.push({
      id: n.id,
      level: n.level,
      title: n.title,
      valid_from: n.valid_from,
      valid_until: n.valid_until,
      security,
      scenario_planning_label: n.scenario_planning_label,
      parentTitle: parentContext.title,
    });
    if (n.children?.length) flatten(n.children, { title: n.title, security }, acc);
  });
  return acc;
}

/**
 * 계층별로 "그 계획이 걸린 지점" 을 한 조각 문자열로.
 * 확대된 구간의 각 행 왼쪽에 붙어서 "이 계획이 언제 것인지" 를 라벨만 봐도 알 수 있게 한다.
 * 예: YEAR → 2026년, QUARTER → 3분기, MONTH → 8월, WEEK → 33주, DAY → 12일
 */
function periodLabelFor(level, validFrom) {
  const d = toDate(validFrom);
  if (!d) return null;
  switch (level) {
    case "YEAR":
      return `${d.getFullYear()}년`;
    case "QUARTER":
      return `${Math.floor(d.getMonth() / 3) + 1}분기`;
    case "MONTH":
      return `${d.getMonth() + 1}월`;
    case "WEEK":
    case "WEEKLY_SECURITY":
      return `${weekOfYearFor(d, d.getFullYear())}주`;
    case "DAY":
      return `${d.getDate()}일`;
    default:
      return null;
  }
}

/** 두 반열림구간 [aS, aE) 와 [bS, bE) 가 겹치나. */
function rangesOverlap(aS, aE, bS, bE) {
  return aS < bE && bS < aE;
}

/**
 * 특정 날짜가 그 해의 몇 번째 주인지. makeCells(WEEK) 와 같은 앵커(직전 일요일) 를 쓴다.
 * 두 계산이 어긋나면 행 라벨의 "n주" 와 셀 하이라이트가 달라져 사용자가 혼란스러워진다.
 */
function weekOfYearFor(date, year) {
  const anchor = new Date(year, 0, 1);
  anchor.setDate(anchor.getDate() - anchor.getDay());
  return Math.floor((date.getTime() - anchor.getTime()) / (7 * DAY_MS)) + 1;
}

/** 계획(valid_from ~ valid_until, 양끝 포함) 이 셀 [start, end) 와 겹치나. */
function planCoversCell(plan, cellStart, cellEnd) {
  return datesCoverCell(plan.valid_from, plan.valid_until, cellStart, cellEnd);
}
function datesCoverCell(from, until, cellStart, cellEnd) {
  const pf = toDate(from);
  const pu = toDate(until);
  if (!pf || !pu) return false;
  const puExclusive = new Date(pu.getTime() + DAY_MS);
  return rangesOverlap(pf, puExclusive, cellStart, cellEnd);
}

/**
 * 확대된 구간에 걸리는 트리 부분만 남긴다.
 *   - 계층은 그대로 (YEAR > QUARTER > MONTH > WEEK > WEEKLY_SECURITY > DAY).
 *   - 자기 노드가 안 걸려도 자식 중 하나라도 걸리면 남긴다 (부모 없이는 자식만 뜬 것으로 보임).
 *   - 종목은 자식이 부모의 것을 상속 (DAY 는 WEEKLY_SECURITY 의 종목을 물려받는다).
 *   - 날짜가 없는 노드(WEEKLY_SECURITY) 는 부모의 유효기간으로 판단·표시.
 */
function buildVisibleTree(
  nodes,
  cellStart,
  cellEnd,
  parentSecurity = null,
  parentDates = null
) {
  const out = [];
  for (const n of nodes || []) {
    const security = n.security || n.securities?.[0] || parentSecurity;
    const from = n.valid_from || parentDates?.from || null;
    const until = n.valid_until || parentDates?.until || null;
    const dates = { from, until };
    const children = buildVisibleTree(n.children, cellStart, cellEnd, security, dates);
    const selfOverlaps = datesCoverCell(from, until, cellStart, cellEnd);
    if (!selfOverlaps && children.length === 0) continue;
    out.push({
      id: n.id,
      level: n.level,
      title: n.title,
      valid_from: from,
      valid_until: until,
      security,
      children,
    });
  }
  return out;
}

function makeCells(level, yearStart, yearEnd) {
  const cells = [];
  if (level === "YEAR") {
    cells.push({
      start: yearStart,
      end: yearEnd,
      label: `${yearStart.getFullYear()}년`,
      sub: null,
    });
  } else if (level === "QUARTER") {
    for (let q = 0; q < 4; q++) {
      const s = new Date(yearStart.getFullYear(), q * 3, 1);
      const e = new Date(yearStart.getFullYear(), q * 3 + 3, 1);
      cells.push({
        start: s,
        end: e,
        label: `Q${q + 1}`,
        sub: `${q * 3 + 1}월 – ${q * 3 + 3}월`,
      });
    }
  } else if (level === "MONTH") {
    for (let m = 0; m < 12; m++) {
      const s = new Date(yearStart.getFullYear(), m, 1);
      const e = new Date(yearStart.getFullYear(), m + 1, 1);
      cells.push({ start: s, end: e, label: `${m + 1}월`, sub: null });
    }
  } else if (level === "WEEK") {
    // 한국 관습대로 주는 일~토 로 묶는다. 그해 첫 날이 목요일이면 그 목요일이 속한
    // 주(직전 일요일 시작)를 1주로 잡고, 화면에는 해 안쪽으로 잘라 보여 준다.
    // 예: 2026-08-09(일) ~ 2026-08-15(토) 가 한 셀에 들어와야 한다.
    let cur = new Date(yearStart);
    cur.setDate(cur.getDate() - cur.getDay()); // 가장 최근 일요일로
    let n = 1;
    while (cur < yearEnd) {
      const nxt = new Date(cur.getTime() + 7 * DAY_MS);
      // 첫/마지막 셀은 해 경계에서 잘린다. "n주" 는 이 해에서의 몇 번째 주(연초주부터 카운트).
      const s = cur < yearStart ? new Date(yearStart) : new Date(cur);
      const e = nxt > yearEnd ? new Date(yearEnd) : nxt;
      cells.push({ start: s, end: e, label: `${n}주`, sub: null });
      cur = nxt;
      n++;
    }
  } else {
    // DAY
    let cur = new Date(yearStart);
    while (cur < yearEnd) {
      const e = new Date(cur.getTime() + DAY_MS);
      cells.push({
        start: new Date(cur),
        end: e,
        label: `${cur.getDate()}`,
        sub: cur.getDate() === 1 ? `${cur.getMonth() + 1}월` : null,
      });
      cur = e;
    }
  }
  return cells.map((c) => ({
    ...c,
    spanDays: Math.max(1, daysBetween(c.start, c.end)),
  }));
}

export default function PlanTimetable({ tree, onEdit }) {
  const today = useMemo(() => new Date(), []);
  const currentYear = today.getFullYear();
  const [year, setYear] = useState(currentYear);
  const [selected, setSelected] = useState(null); // { level, index }
  const [hovered, setHovered] = useState(null);   // { start, end }
  const scrollRef = useRef(null);

  const yearStart = useMemo(() => new Date(year, 0, 1), [year]);
  const yearEnd = useMemo(() => new Date(year + 1, 0, 1), [year]);
  const yearDays = daysBetween(yearStart, yearEnd);
  const totalPx = yearDays * PX_PER_DAY;

  const isCurrentYear = year === currentYear;

  // 오늘 위치로 스크롤. 화면 왼쪽에서 1/3 지점에 오게 두면 앞뒤 맥락이 함께 보인다.
  const scrollToToday = () => {
    const el = scrollRef.current;
    if (!el || !isCurrentYear) return;
    const dayIdx = daysBetween(yearStart, new Date(currentYear, today.getMonth(), today.getDate()));
    const target = Math.max(0, dayIdx * PX_PER_DAY - el.clientWidth / 3);
    el.scrollTo({ left: target, behavior: "smooth" });
  };
  // 최초 마운트/연도 변경 시엔 즉시(부드러운 애니메이션 없이) 오늘 위치로.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || !isCurrentYear) return;
    const dayIdx = daysBetween(yearStart, new Date(currentYear, today.getMonth(), today.getDate()));
    el.scrollLeft = Math.max(0, dayIdx * PX_PER_DAY - el.clientWidth / 3);
    // year 만 의존 — currentYear/today 는 세션 내 고정.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);
  useEffect(() => {
    // tree 가 늦게 도착해도 오늘 위치가 유지되도록 한 번 더 맞춘다.
    const el = scrollRef.current;
    if (!el || !isCurrentYear) return;
    if (el.scrollLeft === 0) {
      const dayIdx = daysBetween(yearStart, new Date(currentYear, today.getMonth(), today.getDate()));
      el.scrollLeft = Math.max(0, dayIdx * PX_PER_DAY - el.clientWidth / 3);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree]);

  const plans = useMemo(() => flatten(tree), [tree]);

  // 연도 후보. 계획들이 걸친 연도 + 현재 연도.
  const availableYears = useMemo(() => {
    const set = new Set([currentYear]);
    plans.forEach((p) => {
      const s = toDate(p.valid_from);
      const e = toDate(p.valid_until);
      if (s) set.add(s.getFullYear());
      if (e) set.add(e.getFullYear());
    });
    return Array.from(set).sort();
  }, [plans, currentYear]);

  const rows = useMemo(
    () =>
      LEVELS.map((L) => ({
        ...L,
        cells: makeCells(L.key, yearStart, yearEnd),
        // 각 셀의 뱃지는 그 계층에 속한 계획만 센다.
        plans: plans.filter((p) => p.level === L.key),
      })),
    [plans, yearStart, yearEnd]
  );

  const selectedRange = useMemo(() => {
    if (!selected) return null;
    const row = rows.find((r) => r.key === selected.level);
    const cell = row?.cells[selected.index];
    if (!cell) return null;
    return {
      start: cell.start,
      end: cell.end,
      label: `${row.label} ${cell.label}${cell.sub ? ` (${cell.sub})` : ""}`,
    };
  }, [selected, rows]);

  const highlight = hovered || selectedRange;

  // 확대된 구간에 걸리는 계층 트리 그대로 (평평하게 펴지 않는다).
  // 월 안에 주/종목별/일 이 어떻게 매달려 있는지가 상세 패널에 나타나야 한다.
  const visibleTree = useMemo(() => {
    if (!selectedRange) return [];
    return buildVisibleTree(tree, selectedRange.start, selectedRange.end);
  }, [tree, selectedRange]);

  // 헤더 칩용 종목 요약 — 트리 전체에서 걸린 종목만 중복 없이 뽑는다.
  const visibleSecurities = useMemo(() => {
    const seen = new Set();
    const out = [];
    const walk = (nodes) => {
      for (const n of nodes || []) {
        const s = n.security;
        if (s?.id && !seen.has(s.id)) {
          seen.add(s.id);
          out.push(s);
        }
        walk(n.children);
      }
    };
    walk(visibleTree);
    return out;
  }, [visibleTree]);

  // 주 계층에서 펼침/접힘. 기본은 펼침(모두 보이는 상태).
  // 주 안에 종목별·일이 여러 개 매달릴 수 있어, 개관을 원할 때 접을 수 있게 둔다.
  const [collapsed, setCollapsed] = useState(() => new Set());
  const toggleCollapsed = (id) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const rangeDays = selectedRange
    ? daysBetween(selectedRange.start, selectedRange.end)
    : 0;

  return (
    <div className="tt">
      <div className="tt-toolbar">
        <div className="tt-legend">
          <span className="tt-legend-item">
            <span className="tt-legend-swatch is-related" /> 관련 구간
          </span>
          <span className="tt-legend-item">
            <span className="tt-legend-swatch is-selected" /> 선택 구간
          </span>
          <span className="tt-legend-item">
            <span className="tt-legend-swatch is-hasplans" /> 계획 있음
          </span>
        </div>
        <div className="tt-year-picker">
          <button
            type="button"
            className="btn is-sm"
            onClick={() => {
              if (year !== currentYear) setYear(currentYear);
              setSelected(null);
              // 연도 변경이면 layoutEffect 가 처리, 같은 해면 여기서 스크롤.
              if (year === currentYear) scrollToToday();
            }}
          >
            오늘
          </button>
          <select
            value={year}
            onChange={(e) => {
              setYear(Number(e.target.value));
              setSelected(null);
            }}
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}년
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="tt-scroll" ref={scrollRef}>
        <div className="tt-grid">
          {rows.map((row) => (
            <div key={row.key} className={`tt-row tt-row-${row.key}`}>
              <div className="tt-row-label">
                <span>{row.label}</span>
              </div>
              <div
                className="tt-row-cells"
                style={{ width: `${totalPx}px` }}
                onMouseLeave={() => setHovered(null)}
              >
                {row.cells.map((cell, i) => {
                  const cellPlans = row.plans.filter((p) =>
                    planCoversCell(p, cell.start, cell.end)
                  );
                  const isSelected =
                    selected?.level === row.key && selected?.index === i;
                  const isRelated =
                    !isSelected &&
                    highlight &&
                    rangesOverlap(cell.start, cell.end, highlight.start, highlight.end);
                  return (
                    <button
                      key={i}
                      type="button"
                      className={
                        "tt-cell " +
                        `tt-cell-${row.key} ` +
                        (isSelected ? "is-selected " : "") +
                        (isRelated ? "is-related " : "") +
                        (cellPlans.length ? "has-plans " : "")
                      }
                      style={{ width: `${cell.spanDays * PX_PER_DAY}px` }}
                      onMouseEnter={() =>
                        setHovered({ start: cell.start, end: cell.end })
                      }
                      onClick={() =>
                        setSelected((cur) =>
                          cur?.level === row.key && cur?.index === i
                            ? null
                            : { level: row.key, index: i }
                        )
                      }
                      title={`${row.label} ${cell.label} · 계획 ${cellPlans.length}건`}
                    >
                      <span className="tt-cell-label">{cell.label}</span>
                      {cell.sub && <span className="tt-cell-sub">{cell.sub}</span>}
                      {cellPlans.length > 0 && (
                        <span className="tt-cell-count num">{cellPlans.length}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedRange ? (
        <div className="tt-detail">
          <div className="tt-detail-head">
            <span className="tt-detail-badge">확대된 구간</span>
            <strong className="tt-detail-title">{selectedRange.label}</strong>
            <span className="tt-detail-range num">
              {iso(selectedRange.start)} ~{" "}
              {iso(new Date(selectedRange.end.getTime() - DAY_MS))}
              <span className="tt-detail-days"> · {rangeDays}일</span>
            </span>
            <button
              type="button"
              className="row-edit tt-detail-close"
              onClick={() => setSelected(null)}
            >
              × 닫기
            </button>
          </div>
          {/* 확대된 구간에 걸린 종목 요약 — 트리 전체에서 뽑는다. */}
          {visibleSecurities.length > 0 && (
            <div className="tt-detail-secs">
              <span className="tt-detail-secs-label">종목</span>
              {visibleSecurities.map((s) => (
                <span key={s.id} className="tt-detail-sec-chip">
                  {s.name}
                  <span className="tt-detail-sec-chip-sym num">{s.symbol}</span>
                </span>
              ))}
            </div>
          )}
          {visibleTree.length === 0 ? (
            <p className="tt-detail-empty">이 구간에 걸린 계획이 없다.</p>
          ) : (
            <ul className="tt-detail-list">
              {visibleTree.map((node) => (
                <RenderNode
                  key={`${node.level}-${node.id}`}
                  node={node}
                  collapsed={collapsed}
                  onToggle={toggleCollapsed}
                  onEdit={onEdit}
                />
              ))}
            </ul>
          )}
        </div>
      ) : (
        <p className="tt-hint">셀을 눌러 그 구간에 걸린 계획을 본다.</p>
      )}
    </div>
  );
}

/**
 * 재귀 렌더. 들여쓰기는 없다 — 모든 행이 같은 왼쪽 정렬.
 * WEEK 노드는 `WeekBlock` 로 넘어가 "종목별 모음 / 일별 모음" 두 소그룹으로 나뉜다.
 * 다른 계층(Y/Q/M/D)은 그냥 한 줄로 찍고 자식으로 내려간다.
 */
function RenderNode({ node, collapsed, onToggle, onEdit }) {
  if (node.level === "WEEK") {
    return (
      <WeekBlock
        node={node}
        collapsed={collapsed}
        onToggle={onToggle}
        onEdit={onEdit}
      />
    );
  }
  return (
    <>
      <PlanRow node={node} onEdit={onEdit} />
      {node.children?.map((c) => (
        <RenderNode
          key={`${c.level}-${c.id}`}
          node={c}
          collapsed={collapsed}
          onToggle={onToggle}
          onEdit={onEdit}
        />
      ))}
    </>
  );
}

/**
 * 한 주 블록 = 주전체계획 다음에 종목별(WEEKLY_SECURITY) 들이 이어지고,
 * 각 종목별 밑에 그 종목의 일계획이 이어진다. 별도 "모음" 헤더는 두지 않는다.
 *   - 주 토글: 그 아래 종목별 전부(그리고 각 종목별의 일계획들) 을 통째로 감춘다.
 *   - 종목별 토글: 자기 아래 일계획만 감춘다.
 * 들여쓰기는 없고, level 배지와 접기 아이콘으로 계층을 구분한다.
 */
function WeekBlock({ node, collapsed, onToggle, onEdit }) {
  const secs = (node.children || []).filter((c) => c.level === "WEEKLY_SECURITY");
  const weekKey = `w-${node.id}`;
  const weekOpen = !collapsed.has(weekKey);

  return (
    <>
      <PlanRow
        node={node}
        onEdit={onEdit}
        leading={
          <Toggle
            open={weekOpen}
            onClick={() => onToggle(weekKey)}
            aria-label={weekOpen ? "주 접기" : "주 펼치기"}
          />
        }
      />
      {weekOpen &&
        secs.map((s) => (
          <SecurityBlock
            key={`ws-${s.id}`}
            node={s}
            collapsed={collapsed}
            onToggle={onToggle}
            onEdit={onEdit}
          />
        ))}
    </>
  );
}

/** 종목별(WEEKLY_SECURITY) + 그 아래 일계획들. 자기 토글로 일계획들을 감춘다. */
function SecurityBlock({ node, collapsed, onToggle, onEdit }) {
  const dailies = (node.children || []).filter((c) => c.level === "DAY");
  const secKey = `ws-${node.id}`;
  const secOpen = !collapsed.has(secKey);
  const hasDailies = dailies.length > 0;
  return (
    <>
      <PlanRow
        node={node}
        onEdit={onEdit}
        leading={
          hasDailies ? (
            <Toggle
              open={secOpen}
              onClick={() => onToggle(secKey)}
              aria-label={secOpen ? "종목 일계획 접기" : "종목 일계획 펼치기"}
            />
          ) : null
        }
      />
      {secOpen &&
        dailies.map((d) => (
          <PlanRow key={`wd-${d.id}`} node={d} onEdit={onEdit} />
        ))}
    </>
  );
}

function Toggle({ open, onClick, "aria-label": ariaLabel }) {
  return (
    <button
      type="button"
      className="tt-detail-toggle"
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {open ? "▼" : "▶"}
    </button>
  );
}

/** 계획 한 줄. 토글 자리가 필요하면 leading 으로 넣어 다른 행과 폭을 맞춘다. */
function PlanRow({ node, onEdit, leading = null }) {
  const period = periodLabelFor(node.level, node.valid_from);
  return (
    <li className="tt-detail-item">
      {leading || <span className="tt-detail-toggle is-spacer" aria-hidden="true" />}
      <span className={`tt-detail-lv tt-lv-${node.level}`}>
        {LEVEL_LABEL[node.level]}
      </span>
      {period && <span className="tt-detail-period num">{period}</span>}
      {node.security && (
        <span className="tt-detail-sec num">
          {node.security.name}
          <span className="tt-detail-sec-sym"> {node.security.symbol}</span>
        </span>
      )}
      <button
        type="button"
        className="tt-detail-name"
        onClick={() => onEdit?.(node)}
      >
        {node.title || "(제목 없음)"}
      </button>
      <span className="num tt-detail-when">
        {node.valid_from} ~ {node.valid_until}
      </span>
    </li>
  );
}
