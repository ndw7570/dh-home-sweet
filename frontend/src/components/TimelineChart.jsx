import { useMemo, useState } from "react";
import "./TimelineChart.css";

/**
 * 이 프로그램의 시그니처.
 *
 * 하나의 시간축에 네 가지를 겹쳐 그린다.
 *   - 실선(teal)   : 일어난 일 (AssetSnapshot)
 *   - 파선(gray)   : 그때 내가 봤던 미래 (ProjectionSnapshot, 지우지 않는다)
 *   - 점선(coral)  : 지금 보는 미래 (Scenario 3갈래)
 *   - 점(teal)     : 일지가 달린 날
 *
 * props 는 GET /api/planner/timeline/ 응답을 그대로 받는다.
 */

const W = 720;
const H = 260;
const PAD = { top: 16, right: 56, bottom: 26, left: 8 };

const toTime = (d) => new Date(d).getTime();

export default function TimelineChart({ data, height = H, onSelectMark }) {
  const [hover, setHover] = useState(null);

  const geom = useMemo(() => {
    if (!data) return null;
    const { actual = [], past_projections = [], scenarios = [], today } = data;

    const all = [
      ...actual,
      ...past_projections.flatMap((p) => p.points),
      ...scenarios.flatMap((s) => s.points),
    ];
    if (!all.length) return null;

    const xs = all.map((p) => toTime(p.date ?? p.target_date));
    const ys = all.map((p) => Number(p.value ?? p.projected_value));
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const padY = (maxY - minY) * 0.12 || 1;

    const innerW = W - PAD.left - PAD.right;
    const innerH = height - PAD.top - PAD.bottom;
    const sx = (t) => PAD.left + ((t - minX) / (maxX - minX || 1)) * innerW;
    const sy = (v) =>
      PAD.top + innerH - ((v - (minY - padY)) / (maxY + padY - (minY - padY) || 1)) * innerH;

    const path = (points) =>
      points
        .map((p, i) => {
          const x = sx(toTime(p.date ?? p.target_date));
          const y = sy(Number(p.value ?? p.projected_value));
          return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
        })
        .join(" ");

    const actualByDate = new Map(actual.map((p) => [p.date, Number(p.value)]));

    return {
      sx,
      sy,
      path,
      todayX: today ? sx(toTime(today)) : null,
      baselineY: height - PAD.bottom,
      marks: (data.journal_marks || [])
        .map((m) => {
          const value = actualByDate.get(m.date);
          if (value == null) return null;
          return { ...m, x: sx(toTime(m.date)), y: sy(value) };
        })
        .filter(Boolean),
    };
  }, [data, height]);

  if (!geom) {
    return (
      <div className="timeline-empty">
        아직 그릴 기록이 없습니다. 자산 스냅샷을 하나 남기면 여기서 선이 시작됩니다.
      </div>
    );
  }

  const { path, todayX, baselineY, marks } = geom;

  return (
    <div className="timeline">
      <svg
        className="timeline-svg"
        viewBox={`0 0 ${W} ${height}`}
        role="img"
        aria-label="과거 실적과 예상 흐름을 잇는 시간축"
      >
        <line
          className="tl-axis"
          x1={PAD.left}
          y1={baselineY}
          x2={W - PAD.right}
          y2={baselineY}
        />

        {todayX != null && (
          <>
            <line className="tl-today" x1={todayX} y1={PAD.top} x2={todayX} y2={baselineY} />
            <text className="tl-today-label" x={todayX} y={baselineY + 18} textAnchor="middle">
              오늘
            </text>
          </>
        )}

        {/* 과거에 세운 예상 — 최신 예상으로 덮어쓰지 않고 그대로 남긴다 */}
        {(data.past_projections || []).map((p) => (
          <path key={p.projected_on} className="tl-past" d={path(p.points)} />
        ))}

        {/* 현재 시나리오 부채꼴 */}
        {(data.scenarios || []).map((s) => (
          <g key={s.type}>
            <path
              className={`tl-scenario ${s.type === "BASE" ? "is-base" : ""}`}
              d={path(s.points)}
            />
            <text
              className="tl-scenario-label"
              x={W - PAD.right + 8}
              y={geom.sy(Number(s.points[s.points.length - 1].value)) + 4}
            >
              {s.label}
            </text>
          </g>
        ))}

        {/* 실적 */}
        <path className="tl-actual" d={path(data.actual || [])} />

        {/* 일지 마커 */}
        {marks.map((m) => (
          <circle
            key={m.entry_id}
            className="tl-mark"
            cx={m.x}
            cy={m.y}
            r={hover === m.entry_id ? 6 : 4}
            tabIndex={0}
            role="button"
            aria-label={`${m.date} 일지 열기`}
            onMouseEnter={() => setHover(m.entry_id)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(m.entry_id)}
            onBlur={() => setHover(null)}
            onClick={() => onSelectMark?.(m)}
            onKeyDown={(e) => e.key === "Enter" && onSelectMark?.(m)}
          />
        ))}
      </svg>

      <ul className="timeline-legend">
        <li>
          <i className="lg-line is-actual" />
          실적
        </li>
        <li>
          <i className="lg-line is-past" />
          과거에 세운 예상
        </li>
        <li>
          <i className="lg-line is-scenario" />
          현재 시나리오
        </li>
        <li>
          <i className="lg-dot" />
          일지
        </li>
      </ul>
    </div>
  );
}
