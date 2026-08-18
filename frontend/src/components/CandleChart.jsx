import { useEffect, useMemo, useRef, useState } from "react";

import {
  buildScale,
  indexAtRatio,
  niceTicks,
  normalize,
  tickStride,
  H,
  PAD_L,
  PAD_R,
  PAD_T,
  VOL_Y0,
  VOL_Y1,
  W,
} from "../lib/candleGeometry";
import { compactNum, price } from "../lib/format";
import "./CandleChart.css";

/**
 * 봉 차트 — 일봉/분봉 공용.
 *
 * ## 색은 KRX 관례를 따른다 (상승 빨강 · 하락 파랑)
 *
 * 이 앱의 추세 배지(`Badge.css` 의 `.is-up`)는 상승을 초록으로 쓴다. 여기서 그걸 따르지
 * 않는 이유가 둘이다.
 *   1. 국내 시세 화면은 예외 없이 빨강=상승이다. 캔들에서 그 관례를 뒤집으면 사용자는
 *      값을 읽기 전에 색부터 뒤집어 해석해야 한다.
 *   2. 초록/빨강 쌍은 색각이상(2형)에서 두 색이 붙는다 — 측정하면 ΔE 6.9(OKLab×100) 로
 *      "보조 표기가 있어야만 허용" 구간이다. 빨강/파랑은 ΔE 26.0 으로 여유 있게 갈린다.
 * 관례와 접근성이 같은 답을 가리켜서 이쪽으로 정했다. 추세 배지는 예측(판단)이고
 * 캔들은 시세(사실)라, 의미가 달라 나란히 놓여도 충돌로 읽히지 않는다.
 *
 * ## 축을 둘로 겹치지 않는다
 *
 * 가격과 거래량은 단위가 다르다. 한 격자에 y축 두 개를 얹으면 두 축의 정렬이 임의로
 * 정해지면서 데이터에 없는 상관을 만들어 낸다. 그래서 **패널을 위아래로 나누고 x축만
 * 공유한다** — 같은 날짜에서 세로로 내려 읽으면 되고, 눈금이 서로를 오염시키지 않는다.
 *
 * ## 툴팁은 값을 가두지 않는다
 *
 * 호버로만 읽히는 값은 없어야 해서 `표로 보기` 를 같이 단다. 키보드(←/→)로도 같은
 * 툴팁이 열린다.
 */

export default function CandleChart({
  rows,
  kind = "day", // "day" | "minute"
  emptyText = "수집된 시세가 없습니다.",
  emptyHint,
  label,
}) {
  const points = useMemo(() => normalize(rows, kind), [rows, kind]);
  const [active, setActive] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const plotRef = useRef(null);

  // 종목이나 구간이 바뀌면 이전 봉을 가리키던 커서를 버린다.
  useEffect(() => setActive(null), [points]);

  const scale = useMemo(() => buildScale(points), [points]);

  if (!points.length) {
    return (
      <div className="cc-empty">
        <p className="cc-empty-msg">{emptyText}</p>
        {emptyHint && <p className="cc-empty-hint">{emptyHint}</p>}
      </div>
    );
  }

  const priceTicks = niceTicks(scale.lo, scale.hi, 4);
  const last = points[points.length - 1];
  const first = points[0];
  // 구간 전체의 방향. 마지막 종가에 붙는 직접 라벨 하나만 색을 갖는다.
  const trendUp = last.c >= first.o;

  // x축 글자는 다 찍으면 겹친다. 폭에 맞춰 솎아 낸다.
  const tickEvery = tickStride(points.length);

  const pickFromPointer = (e) => {
    const box = plotRef.current?.getBoundingClientRect();
    if (!box || !box.width) return;
    setActive(indexAtRatio((e.clientX - box.left) / box.width, scale, points.length));
  };

  const onKey = (e) => {
    const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (step) {
      e.preventDefault();
      setActive((i) => {
        const next = (i == null ? points.length - 1 : i) + step;
        return Math.max(0, Math.min(points.length - 1, next));
      });
      return;
    }
    if (e.key === "Home") { e.preventDefault(); setActive(0); }
    if (e.key === "End") { e.preventDefault(); setActive(points.length - 1); }
    if (e.key === "Escape") setActive(null);
  };

  const cur = active == null ? null : points[active];

  return (
    <div className="cc">
      <div
        className="cc-plot"
        ref={plotRef}
        tabIndex={0}
        role="img"
        aria-label={`${label || "봉"} 차트 — ${points.length}개. 좌우 화살표로 값을 읽는다.`}
        onPointerMove={pickFromPointer}
        onPointerLeave={() => setActive(null)}
        onKeyDown={onKey}
        onFocus={() => setActive((i) => (i == null ? points.length - 1 : i))}
        onBlur={() => setActive(null)}
      >
        <svg viewBox={`0 0 ${W} ${H}`} className="cc-svg" aria-hidden="true">
          {/* 격자 — 실선 헤어라인, 표면에서 한 단계만 떨어진 회색. 데이터보다 뒤에 있어야 한다. */}
          {priceTicks.map((t) => (
            <g key={`g${t}`}>
              <line
                className="cc-grid"
                x1={PAD_L}
                x2={W - PAD_R}
                y1={scale.y(t)}
                y2={scale.y(t)}
              />
              <text className="cc-tick num" x={PAD_L - 8} y={scale.y(t) + 3} textAnchor="end">
                {price(t)}
              </text>
            </g>
          ))}
          <line className="cc-grid" x1={PAD_L} x2={W - PAD_R} y1={VOL_Y1} y2={VOL_Y1} />
          <text className="cc-tick num" x={PAD_L - 8} y={VOL_Y0 + 8} textAnchor="end">
            {compactNum(scale.maxVol)}
          </text>
          <text className="cc-axis-name" x={PAD_L - 8} y={VOL_Y1} textAnchor="end">
            거래량
          </text>

          {/* 봉. 몸통은 시가~종가, 꼬리는 고가~저가. 이웃과는 2px 여백으로 갈린다. */}
          {points.map((p, i) => {
            const up = p.c > p.o;
            const flat = p.c === p.o;
            const tone = flat ? "is-flat" : up ? "is-up" : "is-down";
            const x = scale.x(i);
            const top = scale.y(Math.max(p.o, p.c));
            const bottom = scale.y(Math.min(p.o, p.c));
            const volH = Math.max(VOL_Y1 - scale.vy(p.v), p.v > 0 ? 1 : 0);
            return (
              <g key={p.key} className={`cc-candle ${tone} ${active === i ? "is-active" : ""}`}>
                <line className="cc-wick" x1={x} x2={x} y1={scale.y(p.h)} y2={scale.y(p.l)} />
                <rect
                  className="cc-body"
                  x={x - scale.body / 2}
                  y={top}
                  width={scale.body}
                  // 시가=종가(보합)면 높이가 0 이라 아무것도 안 그려진다. 1 을 깔아 선으로 남긴다.
                  height={Math.max(1, bottom - top)}
                />
                <rect
                  className="cc-vol"
                  x={x - scale.body / 2}
                  y={VOL_Y1 - volH}
                  width={scale.body}
                  height={volH}
                  rx={Math.min(2, scale.body / 2)}
                />
              </g>
            );
          })}

          {/* 마지막 종가 하나만 직접 라벨. 모든 봉에 숫자를 붙이면 아무도 안 읽는다. */}
          <g className={`cc-lastmark ${trendUp ? "is-up" : "is-down"}`}>
            <line
              className="cc-lastline"
              x1={PAD_L}
              x2={W - PAD_R}
              y1={scale.y(last.c)}
              y2={scale.y(last.c)}
            />
            <text className="cc-lastlabel num" x={W - PAD_R} y={scale.y(last.c) - 5} textAnchor="end">
              {price(last.c)}
            </text>
          </g>

          {/* x축 — 겹치지 않을 만큼만 솎아서 찍는다. */}
          {points.map((p, i) =>
            i % tickEvery === 0 || i === points.length - 1 ? (
              <text
                key={`x${p.key}`}
                className="cc-tick num"
                x={scale.x(i)}
                y={H - 6}
                textAnchor="middle"
              >
                {p.short}
              </text>
            ) : null
          )}

          {/* 십자선은 x 를 찾는다. 사용자는 날짜를 겨냥하지 2px 선을 겨냥하지 않는다. */}
          {cur && (
            <line
              className="cc-cross"
              x1={scale.x(active)}
              x2={scale.x(active)}
              y1={PAD_T}
              y2={VOL_Y1}
            />
          )}
        </svg>

        {cur && (
          <div
            className={`cc-tip ${scale.x(active) > W * 0.6 ? "is-left" : ""}`}
            style={{ left: `${(scale.x(active) / W) * 100}%` }}
            role="status"
          >
            <span className="cc-tip-when">{cur.long}</span>
            <dl className="cc-tip-rows">
              <div>
                <dt>시가</dt>
                <dd className="num">{price(cur.o)}</dd>
              </div>
              <div>
                <dt>고가</dt>
                <dd className="num">{price(cur.h)}</dd>
              </div>
              <div>
                <dt>저가</dt>
                <dd className="num">{price(cur.l)}</dd>
              </div>
              <div>
                <dt>종가</dt>
                <dd className="num cc-tip-strong">{price(cur.c)}</dd>
              </div>
              <div>
                <dt>거래량</dt>
                <dd className="num">{compactNum(cur.v)}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>

      <div className="cc-foot">
        {/* 색이 뜻을 나르므로 범례는 늘 있다. 글자는 본문색이고 색은 옆의 표식이 진다. */}
        <span className="cc-legend">
          <span className="cc-key is-up" aria-hidden="true" />
          상승
          <span className="cc-key is-down" aria-hidden="true" />
          하락
          <span className="cc-key is-flat" aria-hidden="true" />
          보합
        </span>
        <span className="cc-foot-hint">봉에 커서를 올리거나 ←/→ 로 값을 읽는다</span>
        <button
          type="button"
          className="row-edit"
          aria-expanded={showTable}
          onClick={() => setShowTable((s) => !s)}
        >
          {showTable ? "표 접기" : "표로 보기"}
        </button>
      </div>

      {/* 표는 차트의 쌍둥이다 — 호버로만 읽히는 값이 없어야 한다. */}
      {showTable && (
        <div className="cc-table-scroll">
          <table className="cc-table">
            <thead>
              <tr>
                <th scope="col">{kind === "minute" ? "시각" : "일자"}</th>
                <th scope="col">시가</th>
                <th scope="col">고가</th>
                <th scope="col">저가</th>
                <th scope="col">종가</th>
                <th scope="col">거래량</th>
              </tr>
            </thead>
            <tbody>
              {[...points].reverse().map((p) => (
                <tr key={p.key}>
                  <td>{p.long}</td>
                  <td className="num">{price(p.o)}</td>
                  <td className="num">{price(p.h)}</td>
                  <td className="num">{price(p.l)}</td>
                  <td className="num">{price(p.c)}</td>
                  <td className="num">{p.v.toLocaleString("ko-KR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
