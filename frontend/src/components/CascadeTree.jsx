import { useState } from "react";

import Badge, { TrendBadge } from "./Badge";
import { confidenceBar, dateRange, price, won, LEVEL_LABEL } from "../lib/format";
import "./CascadeTree.css";

/**
 * 계획 5계층 트리 — 이 화면의 주인공.
 *
 * 연 → 분기 → 월 → 주 → 일. v0.0.2 부터 다섯 계층이 FK 로 곧게 이어진다.
 * 왼쪽 세로선이 계층의 깊이를 나타내고, 각 노드는 '무엇을 하기로 했는가'
 * 한 줄과 근거(thesis)를 갖는다.
 *
 * 중요한 것은 **근거가 빈 자리를 숨기지 않는 것**이다.
 *   - 월계획에 월원칙이 없어 종목에 안 닿으면 그 자리에 경고를 찍는다
 *   - 분기계획의 네 전략 문장 중 빈 것을 표시한다
 * 계획이 있는 것처럼 보이는데 실은 비어 있는 상태가 가장 위험하다.
 */

function StrategyCoverage({ coverage, strategies }) {
  const LABEL = { buy: "매수", sell: "매도", sideways: "횡보", stop_loss: "손절" };
  if (!coverage) return null;
  return (
    <div className="ct-coverage">
      {Object.entries(coverage).map(([key, filled]) => (
        <span
          key={key}
          className={`ct-cov ${filled ? "is-on" : "is-off"}`}
          title={filled ? strategies?.[key] : "아직 안 적었다"}
        >
          {LABEL[key]}
          {filled ? "" : " 미기재"}
        </span>
      ))}
    </div>
  );
}

/** 이 계층에서 '+' 를 눌렀을 때 무엇을 만드는가. */
const ADD_CHILD = {
  YEAR: { level: "QUARTER", label: "분기계획 추가" },
  QUARTER: { level: "MONTH", label: "월계획 추가" },
  // 월계획의 아래는 주계획이 아니라 **월투자원칙**이다. 그게 종목에 닿는 통로라,
  // 계층이 끊긴 자리를 고치려면 여기부터 채워야 한다.
  MONTH: { level: "MONTHLY_PRINCIPLE", label: "종목 연결 (월투자원칙)" },
  WEEK: { level: "DAY", label: "일계획 추가" },
};

function Node({ node, depth, defaultOpen, onEdit, onAddChild }) {
  const [open, setOpen] = useState(defaultOpen);
  const children = node.children || [];
  const hasChildren = children.length > 0;
  const addable = ADD_CHILD[node.level];

  // 월계획인데 종목이 안 달렸으면 아래로 계층이 이어지지 않는다.
  const brokenHere =
    node.level === "MONTH" && (!node.securities || node.securities.length === 0);

  return (
    <li className={`ct-node ct-l${depth}`}>
      <div className="ct-row">
        <button
          className={`ct-toggle ${hasChildren ? "" : "is-leaf"}`}
          onClick={() => hasChildren && setOpen((v) => !v)}
          aria-expanded={hasChildren ? open : undefined}
          disabled={!hasChildren}
        >
          {hasChildren ? (open ? "−" : "+") : "·"}
        </button>

        <div className="ct-main">
          <div className="ct-title-line">
            <span className={`ct-level ct-level-${node.level}`}>
              {LEVEL_LABEL[node.level]}
            </span>
            <strong className="ct-title">{node.title}</strong>
            {node.security && (
              <span className="ct-sec">
                {node.security.name}
                <span className="num"> {node.security.symbol}</span>
              </span>
            )}
            {node.status && <Badge row={node} field="status" />}
            {node.direction && <Badge row={node} field="direction" tone="accent" />}
            {node.predicted_trend && <TrendBadge row={node} />}
            {node.scenario_planning && <Badge row={node} field="scenario_planning" />}

            <span className="ct-tools">
              {onEdit && (
                <button type="button" className="row-edit" onClick={() => onEdit(node)}>
                  수정
                </button>
              )}
              {onAddChild && addable && (
                <button
                  type="button"
                  className={`row-edit ${brokenHere ? "is-urgent" : ""}`}
                  onClick={() => onAddChild(node, addable.level)}
                >
                  + {addable.label}
                </button>
              )}
            </span>
          </div>

          <div className="ct-meta num">
            <span>{dateRange(node.valid_from, node.valid_until)}</span>
            {node.confidence_score != null && (
              <span title={`확신도 ${node.confidence_score}/5`}>
                확신 {confidenceBar(node.confidence_score)}
              </span>
            )}
            {node.predicted_price != null && <span>예상 {price(node.predicted_price)}</span>}
            {node.stop_loss_price != null && (
              <span className="ct-stop">손절 {price(node.stop_loss_price)}</span>
            )}
            {node.risk_reward != null && <span>손익비 {node.risk_reward}</span>}
            {node.available_amount != null && (
              <span>가용 {won(node.available_amount)}</span>
            )}
          </div>

          {node.thesis && <p className="ct-thesis">{node.thesis}</p>}

          {node.level === "QUARTER" && (
            <StrategyCoverage
              coverage={node.strategy_coverage}
              strategies={node.strategies}
            />
          )}

          {node.securities?.length > 0 && (
            <div className="ct-securities">
              {node.securities.map((s) => (
                <span key={s.id} className="ct-sec-chip">
                  {s.name} <span className="num">{s.symbol}</span>
                </span>
              ))}
            </div>
          )}

          {brokenHere && (
            <p className="ct-broken">
              월투자원칙이 없어 이 계획이 종목에 닿지 않는다. 여기서 계층이 끊긴다.
            </p>
          )}
        </div>
      </div>

      {hasChildren && open && (
        <ul className="ct-children">
          {children.map((child) => (
            <Node
              key={`${child.level}-${child.id}`}
              node={child}
              depth={depth + 1}
              defaultOpen
              onEdit={onEdit}
              onAddChild={onAddChild}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function CascadeTree({ tree, onEdit, onAddChild }) {
  if (!tree?.length) {
    return (
      <p className="ct-empty">
        이 날짜에 유효한 연투자계획이 없다. 계획 계층은 연계획에서 시작한다.
      </p>
    );
  }

  return (
    <div className="ct">
      <ul className="ct-root">
        {tree.map((node) => (
          <Node
            key={`YEAR-${node.id}`}
            node={node}
            depth={0}
            defaultOpen
            onEdit={onEdit}
            onAddChild={onAddChild}
          />
        ))}
      </ul>
    </div>
  );
}
