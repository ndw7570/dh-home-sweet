import { useState } from "react";

import Badge, { TrendBadge } from "./Badge";
import { confidenceBar, dateRange, price, won, LEVEL_LABEL } from "../lib/format";
import "./CascadeTree.css";

/**
 * 계획 계층 트리 — 이 화면의 주인공.
 *
 * 연 → 분기 → 월 → 주(기간) → 주(종목별) → 일. v0.0.3 부터 주계획이
 * 두 계층으로 나뉘었다. 주계획(WEEK) 은 기간만 잡고, 그 아래 종목별
 * 계획(WEEKLY_SECURITY) 이 예상가·손절가·가용금액을 가진다.
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

/**
 * 이 계층에서 만들 수 있는 것 두 가지 — 하위 계획, 그리고 투자원칙(있는 계층만).
 * 예전엔 MONTH 만 원칙 추가 버튼이 있고 나머지는 하위계획만 있어서, 어느 계층에서
 * 무엇이 되는지 사람이 매번 기억해야 했다. 두 슬롯을 모든 노드에 통일해 둔다.
 *   - child: 이 계층 아래로 이어지는 계획
 *   - principle: 이 계층의 투자원칙 (종목에 닿는 통로)
 */
const NODE_ACTIONS = {
  YEAR: {
    child: { level: "QUARTER", label: "분기계획" },
    // 연투자원칙 모델은 없다.
  },
  QUARTER: {
    child: { level: "MONTH", label: "월계획" },
    principle: { level: "QUARTERLY_PRINCIPLE", label: "분기투자원칙" },
  },
  MONTH: {
    child: { level: "WEEK", label: "주계획" },
    principle: { level: "MONTHLY_PRINCIPLE", label: "월투자원칙" },
  },
  WEEK: {
    child: { level: "WEEKLY_SECURITY", label: "종목별 주계획" },
  },
  WEEKLY_SECURITY: {
    child: { level: "DAY", label: "일계획" },
  },
};

function Node({ node, depth, defaultOpen, onEdit, onAddChild, onEditPrinciple }) {
  const [open, setOpen] = useState(defaultOpen);
  const children = node.children || [];
  const hasChildren = children.length > 0;
  const actions = NODE_ACTIONS[node.level];

  // 월계획인데 종목이 안 달렸으면 아래로 계층이 이어지지 않는다.
  // 이 경고는 원칙 추가 버튼 쪽으로 강조를 옮긴다 — 사용자가 채워야 할 자리가 거기다.
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
            {node.title && <strong className="ct-title">{node.title}</strong>}
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
              {onAddChild && actions?.child && (
                <button
                  type="button"
                  className="row-edit"
                  onClick={() => onAddChild(node, actions.child.level)}
                >
                  + {actions.child.label} 추가
                </button>
              )}
              {onAddChild && actions?.principle && (
                <button
                  type="button"
                  className={`row-edit ${brokenHere ? "is-urgent" : ""}`}
                  onClick={() => onAddChild(node, actions.principle.level)}
                >
                  + {actions.principle.label} 추가
                </button>
              )}
            </span>
          </div>

          <div className="ct-meta num">
            {(node.valid_from || node.valid_until) && (
              <span>{dateRange(node.valid_from, node.valid_until)}</span>
            )}
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
              {node.securities.map((s) => {
                // 월/분기 chip 이 같은 모양이면 어느 계층 원칙인지 눈으로 구분이 안 된다.
                // 분기는 "실적 카드" 라는 성격을 접두어로, 톤은 살짝 다른 컬러로 준다.
                const isQ = node.level === "QUARTER";
                const chipClass = `ct-sec-chip ${isQ ? "is-quarter" : ""}`;
                const inner = (
                  <>
                    {isQ && <span className="ct-sec-chip-tag">실적</span>}
                    {s.name} <span className="num">{s.symbol}</span>
                  </>
                );
                return s.principle_id && onEditPrinciple ? (
                  <button
                    key={s.id}
                    type="button"
                    className={`${chipClass} is-clickable`}
                    onClick={() => onEditPrinciple(s.principle_id, node.level)}
                    title={isQ ? "분기투자원칙 수정" : "월투자원칙 수정"}
                  >
                    {inner}
                  </button>
                ) : (
                  <span key={s.id} className={chipClass}>
                    {inner}
                  </span>
                );
              })}
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
              onEditPrinciple={onEditPrinciple}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function CascadeTree({ tree, onEdit, onAddChild, onEditPrinciple }) {
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
            onEditPrinciple={onEditPrinciple}
          />
        ))}
      </ul>
    </div>
  );
}
