import { useMemo, useState } from "react";

import { LEVEL_LABEL } from "../lib/format";
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
const iso = (d) => d.toISOString().slice(0, 10);
const daysBetween = (a, b) => Math.round((b.getTime() - a.getTime()) / DAY_MS);

function flatten(tree, parentTitle = null, acc = []) {
  (tree || []).forEach((n) => {
    acc.push({
      id: n.id,
      level: n.level,
      title: n.title,
      valid_from: n.valid_from,
      valid_until: n.valid_until,
      security: n.security || n.securities?.[0] || null,
      scenario_planning_label: n.scenario_planning_label,
      parentTitle,
    });
    if (n.children?.length) flatten(n.children, n.title, acc);
  });
  return acc;
}

/** 두 반열림구간 [aS, aE) 와 [bS, bE) 가 겹치나. */
function rangesOverlap(aS, aE, bS, bE) {
  return aS < bE && bS < aE;
}

/** 계획(valid_from ~ valid_until, 양끝 포함) 이 셀 [start, end) 와 겹치나. */
function planCoversCell(plan, cellStart, cellEnd) {
  const pf = toDate(plan.valid_from);
  const pu = toDate(plan.valid_until);
  if (!pf || !pu) return false;
  const puExclusive = new Date(pu.getTime() + DAY_MS);
  return rangesOverlap(pf, puExclusive, cellStart, cellEnd);
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
    let cur = new Date(yearStart);
    let n = 1;
    while (cur < yearEnd) {
      const nxt = new Date(cur.getTime() + 7 * DAY_MS);
      const e = nxt > yearEnd ? yearEnd : nxt;
      cells.push({ start: new Date(cur), end: e, label: `${n}주`, sub: null });
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
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [selected, setSelected] = useState(null); // { level, index }
  const [hovered, setHovered] = useState(null);   // { start, end }

  const yearStart = useMemo(() => new Date(year, 0, 1), [year]);
  const yearEnd = useMemo(() => new Date(year + 1, 0, 1), [year]);
  const yearDays = daysBetween(yearStart, yearEnd);
  const totalPx = yearDays * PX_PER_DAY;

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

  // 선택 구간에 걸친 모든 계획(계층 무관) 을 상세 패널에 모은다.
  const selectedCellPlans = useMemo(() => {
    if (!selectedRange) return [];
    return plans
      .filter((p) => planCoversCell(p, selectedRange.start, selectedRange.end))
      .sort(
        (a, b) =>
          LEVELS.findIndex((l) => l.key === a.level) -
          LEVELS.findIndex((l) => l.key === b.level)
      );
  }, [plans, selectedRange]);

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
              setYear(currentYear);
              setSelected(null);
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

      <div className="tt-scroll">
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
          {selectedCellPlans.length === 0 ? (
            <p className="tt-detail-empty">이 구간에 걸린 계획이 없다.</p>
          ) : (
            <ul className="tt-detail-list">
              {selectedCellPlans.map((p) => (
                <li
                  key={`${p.level}-${p.id}`}
                  className="tt-detail-item"
                >
                  <span className={`tt-detail-lv tt-lv-${p.level}`}>
                    {LEVEL_LABEL[p.level]}
                  </span>
                  <button
                    type="button"
                    className="tt-detail-name"
                    onClick={() => onEdit?.(p)}
                  >
                    {p.title}
                  </button>
                  {p.security && (
                    <span className="tt-detail-sec num">
                      {p.security.name} {p.security.symbol}
                    </span>
                  )}
                  <span className="num tt-detail-when">
                    {p.valid_from} ~ {p.valid_until}
                  </span>
                </li>
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
