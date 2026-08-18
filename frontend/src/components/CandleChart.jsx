import { useEffect, useMemo, useRef, useState } from "react";

import {
  buildScale,
  indexAtRatio,
  niceTicks,
  normalize,
  tickStride,
  bandFor,
  panWindow,
  zoomWindow,
  MIN_BARS,
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
  // 캔들을 눌러 하루를 고르는 화면(전략의 기준 가격데이터)에서만 넘어온다.
  onPick,
  markedKeys,
  selectedKey,
}) {
  const points = useMemo(() => normalize(rows, kind), [rows, kind]);
  const [active, setActive] = useState(null);
  const [showTable, setShowTable] = useState(false);
  /** 보이는 구간 `{start, end}`. `null` 이면 전체다. */
  const [view, setView] = useState(null);
  const plotRef = useRef(null);
  /** 드래그로 좌우 이동 중인 상태. 클릭과 구분하려고 움직인 거리도 같이 든다. */
  const dragRef = useRef(null);
  /** 드래그 직후의 click 한 번을 삼킨다. */
  const suppressClickRef = useRef(false);

  const total = points.length;
  // 종목이나 구간이 바뀌면 커서도 확대도 처음으로 되돌린다.
  useEffect(() => {
    setActive(null);
    setView(null);
  }, [points]);

  const win = view ?? { start: 0, end: total };
  const visible = useMemo(
    () => points.slice(win.start, win.end),
    [points, win.start, win.end]
  );
  const zoomed = visible.length < total;

  /**
   * Ctrl(⌘)+휠 로 확대/축소, Shift+휠 로 좌우 이동.
   *
   * 브라우저의 기본 동작(페이지 확대·스크롤)을 막아야 해서 `passive: false` 로 직접 건다 —
   * React 의 onWheel 은 preventDefault 가 먹지 않는 경우가 있다.
   * **수식키 없이 굴리면 가로채지 않는다.** 차트 위에서 페이지가 안 스크롤되면
   * 긴 화면에서 갇힌 것처럼 느껴진다.
   */
  useEffect(() => {
    const el = plotRef.current;
    if (!el || total === 0) return undefined;
    const onWheel = (e) => {
      const wantsZoom = e.ctrlKey || e.metaKey;
      const wantsPan = e.shiftKey && !wantsZoom;
      if (!wantsZoom && !wantsPan) return;
      e.preventDefault();
      const box = el.getBoundingClientRect();
      if (!box.width) return;
      setView((prev) => {
        const cur = prev ?? { start: 0, end: total };
        const count = cur.end - cur.start;
        if (wantsPan) {
          const dir = Math.sign(e.deltaY || e.deltaX) || 1;
          return panWindow(cur, total, dir * Math.max(1, Math.round(count * 0.1)));
        }
        const anchor = indexAtRatio(
          (e.clientX - box.left) / box.width,
          { band: bandFor(count) },
          count
        );
        // 위로 굴리면 확대(구간을 좁힌다).
        return zoomWindow(cur, total, anchor, e.deltaY < 0 ? 0.8 : 1.25, MIN_BARS);
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [total]);

  const scale = useMemo(() => buildScale(visible), [visible]);

  if (!points.length) {
    return (
      <div className="cc-empty">
        <p className="cc-empty-msg">{emptyText}</p>
        {emptyHint && <p className="cc-empty-hint">{emptyHint}</p>}
      </div>
    );
  }

  const priceTicks = niceTicks(scale.lo, scale.hi, 4);
  // 보이는 구간의 첫·끝이다. 확대하면 이 둘도 같이 바뀐다 — 화면에 없는 봉의 종가를
  // 라벨로 달아 두면 그게 어디 것인지 알 수 없다.
  const last = visible[visible.length - 1];
  const first = visible[0];
  // 구간 전체의 방향. 마지막 종가에 붙는 직접 라벨 하나만 색을 갖는다.
  const trendUp = last.c >= first.o;

  // x축 글자는 다 찍으면 겹친다. 폭에 맞춰 솎아 낸다.
  const tickEvery = tickStride(visible.length);

  const marked = markedKeys instanceof Set ? markedKeys : new Set(markedKeys || []);
  const selectedIndex = selectedKey == null ? -1 : visible.findIndex((p) => p.key === selectedKey);
  /**
   * 비교의 기준이 되는 봉 — 고른 것이 있으면 그것, 없으면 지금 커서가 짚은 것.
   * 이 봉의 고가·저가를 가로 띠로 깔아 두면 다른 날이 그 구간에 드는지가 눈으로 잡힌다.
   * "고저 폭이 비슷한 날" 을 찾는 것이 이 차트로 하려는 일이다.
   */
  const bandPoint =
    selectedIndex >= 0 ? visible[selectedIndex] : active == null ? null : visible[active];

  const indexAt = (clientX) => {
    const box = plotRef.current?.getBoundingClientRect();
    if (!box || !box.width) return null;
    return indexAtRatio((clientX - box.left) / box.width, scale, visible.length);
  };

  /**
   * 커서를 옮기면 십자선, 확대된 상태에서 끌면 좌우 이동.
   * 확대하지 않았을 때는 끌 것이 없으므로 드래그를 시작하지 않는다.
   */
  const onPointerMove = (e) => {
    const drag = dragRef.current;
    if (drag) {
      const box = plotRef.current?.getBoundingClientRect();
      if (!box || !box.width) return;
      const dx = e.clientX - drag.x;
      if (Math.abs(dx) > 3) drag.moved = true;
      // 화면 픽셀 → 격자 단위 → 봉 개수. 끌어 온 방향과 반대로 구간이 움직인다.
      const bars = -((dx / box.width) * W) / scale.band;
      setView(panWindow(drag.win, total, bars));
      return;
    }
    const i = indexAt(e.clientX);
    if (i != null) setActive(i);
  };

  const onPointerDown = (e) => {
    if (!zoomed || e.button !== 0) return;
    dragRef.current = { x: e.clientX, win, moved: false };
    plotRef.current?.setPointerCapture?.(e.pointerId);
  };

  const endDrag = (e) => {
    if (!dragRef.current) return;
    plotRef.current?.releasePointerCapture?.(e.pointerId);
    // 끌어서 이동한 직후의 click 은 무시해야 한다 — 안 그러면 옮기기만 했는데 담긴다.
    const moved = dragRef.current.moved;
    dragRef.current = null;
    if (moved) suppressClickRef.current = true;
  };

  const onKey = (e) => {
    const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (step) {
      e.preventDefault();
      const from = active == null ? visible.length - 1 : active;
      const next = from + step;
      // 보이는 끝에 닿으면 커서를 붙들고 구간을 민다 — 확대한 채로도 전체를 훑을 수 있다.
      if (next < 0 || next > visible.length - 1) {
        setView(panWindow(win, total, step));
        return;
      }
      setActive(next);
      return;
    }
    if (e.key === "Home") { e.preventDefault(); setView(null); setActive(0); }
    if (e.key === "End") { e.preventDefault(); setView(null); setActive(total - 1); }
    // 키보드로도 확대/축소한다. 커서가 짚은 봉을 제자리에 두는 것은 휠과 같다.
    if (e.key === "+" || e.key === "=" || e.key === "-" || e.key === "_") {
      e.preventDefault();
      const anchor = active == null ? Math.floor(visible.length / 2) : active;
      setView(zoomWindow(win, total, anchor, e.key === "-" || e.key === "_" ? 1.25 : 0.8, MIN_BARS));
      return;
    }
    if (e.key === "Escape") {
      if (zoomed) setView(null);
      else setActive(null);
    }
    // 커서가 짚은 봉을 그대로 고른다. 마우스 없이도 같은 일을 할 수 있어야 한다.
    if ((e.key === "Enter" || e.key === " ") && onPick && active != null) {
      e.preventDefault();
      onPick(visible[active]);
    }
  };

  const cur = active == null ? null : visible[active];

  return (
    <div className="cc">
      <div
        className={`cc-plot ${onPick ? "is-pickable" : ""} ${zoomed ? "is-zoomed" : ""}`}
        ref={plotRef}
        tabIndex={0}
        role={onPick ? "application" : "img"}
        aria-label={
          onPick
            ? `${label || "봉"} 차트 — ${total}개 중 ${visible.length}개 표시. 좌우 화살표로 옮기고 Enter 로 고른다. +/- 로 확대·축소.`
            : `${label || "봉"} 차트 — ${total}개 중 ${visible.length}개 표시. 좌우 화살표로 값을 읽고 +/- 로 확대·축소한다.`
        }
        onPointerMove={onPointerMove}
        onPointerDown={onPointerDown}
        // 끌기 시작할 때 브라우저가 기본 드래그(글자·SVG 고스트)를 걸지 않도록 막는다.
        // CSS 의 user-select 만으로는 파이어폭스에서 고스트가 남는다.
        onDragStart={(e) => e.preventDefault()}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClick={(e) => {
          if (suppressClickRef.current) {
            suppressClickRef.current = false;
            return;
          }
          if (!onPick) return;
          const i = indexAt(e.clientX);
          if (i != null) onPick(visible[i]);
        }}
        onPointerLeave={() => {
          if (!dragRef.current) setActive(null);
        }}
        onKeyDown={onKey}
        // 커서는 **보이는 구간** 안의 인덱스다. 전체 길이를 쓰면 확대했을 때 범위 밖을 짚는다.
        onFocus={() => setActive((i) => (i == null ? visible.length - 1 : i))}
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

          {/*
            기준 봉의 고가~저가 구간을 가로로 깔아 둔다. 데이터보다 뒤에 그려야
            비교 대상(캔들)이 띠 위에 얹혀 보인다 — 순서를 바꾸면 띠가 봉을 덮는다.
          */}
          {bandPoint && (
            <g className="cc-band">
              <rect
                x={PAD_L}
                width={W - PAD_R - PAD_L}
                y={scale.y(bandPoint.h)}
                height={Math.max(1, scale.y(bandPoint.l) - scale.y(bandPoint.h))}
              />
              <line
                className="cc-band-edge"
                x1={PAD_L}
                x2={W - PAD_R}
                y1={scale.y(bandPoint.h)}
                y2={scale.y(bandPoint.h)}
              />
              <line
                className="cc-band-edge"
                x1={PAD_L}
                x2={W - PAD_R}
                y1={scale.y(bandPoint.l)}
                y2={scale.y(bandPoint.l)}
              />
            </g>
          )}

          {/* 봉. 몸통은 시가~종가, 꼬리는 고가~저가. 이웃과는 2px 여백으로 갈린다. */}
          {visible.map((p, i) => {
            const up = p.c > p.o;
            const flat = p.c === p.o;
            const tone = flat ? "is-flat" : up ? "is-up" : "is-down";
            const x = scale.x(i);
            const top = scale.y(Math.max(p.o, p.c));
            const bottom = scale.y(Math.min(p.o, p.c));
            const volH = Math.max(VOL_Y1 - scale.vy(p.v), p.v > 0 ? 1 : 0);
            return (
              <g
                key={p.key}
                className={`cc-candle ${tone} ${active === i ? "is-active" : ""} ${
                  p.key === selectedKey ? "is-picked" : ""
                }`}
              >
                {/* 고른 봉은 세로 띠로 세워 둔다 — 캔들 하나만 굵게 해서는 80개 중에서 안 찾아진다. */}
                {p.key === selectedKey && (
                  <rect
                    className="cc-picked-band"
                    x={x - scale.band / 2}
                    y={PAD_T}
                    width={scale.band}
                    height={VOL_Y1 - PAD_T}
                  />
                )}
                {/* 이미 스냅샷을 떠 둔 날. 같은 날을 두 번 담지 않도록 표시만 남긴다. */}
                {marked.has(p.key) && (
                  <circle className="cc-marked" cx={x} cy={VOL_Y1 + 5} r={2.2} />
                )}
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
          {visible.map((p, i) =>
            i % tickEvery === 0 || i === visible.length - 1 ? (
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
              {/*
                고저 폭 — 이 차트에서 날짜를 고르는 기준이 대개 이 값이다.
                절대폭만으로는 가격대가 다른 날끼리 비교가 안 되므로 저가 대비 비율도 같이 낸다.
              */}
              <div className="cc-tip-range">
                <dt>고저폭</dt>
                <dd className="num">
                  {price(cur.h - cur.l)}
                  <span className="cc-tip-pct">
                    {cur.l > 0 ? ` (${(((cur.h - cur.l) / cur.l) * 100).toFixed(1)}%)` : ""}
                  </span>
                </dd>
              </div>
            </dl>
            {onPick && (
              <p className="cc-tip-pick">
                {cur.key === selectedKey ? "고른 날" : "눌러서 이 날 담기"}
              </p>
            )}
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
        <span className="cc-foot-hint">
          {zoomed
            ? `${first.short} ~ ${last.short} · ${visible.length}/${total}봉`
            : "Ctrl+휠 확대 · Shift+휠 이동"}
        </span>
        {zoomed && (
          <button type="button" className="row-edit" onClick={() => setView(null)}>
            전체 보기
          </button>
        )}
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
