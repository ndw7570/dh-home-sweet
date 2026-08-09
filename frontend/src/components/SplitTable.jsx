import "./SplitTable.css";

/**
 * n차 분할표.
 *
 * `trading_strategy_methods` 를 전략종류별로 묶어서 그린다.
 * 이 표를 **미리** 채워 두는 것이 규율의 실체다. 떨어진 뒤에 얼마를 더 살지
 * 정하면 그건 계획이 아니라 반응이다.
 *
 * 수량비율 합이 100 이 아니면 그 자리에 바로 표시한다 — 분할표는 합이 맞아야 계획이다.
 */
const TYPE_ORDER = ["BUY_SPLIT", "ADD_ON", "SELL_SPLIT", "TAKE_PROFIT", "STOP_LOSS"];

export default function SplitTable({ methods, onEditMethod }) {
  const groups = methods || {};
  const keys = Object.keys(groups).sort(
    (a, b) => (TYPE_ORDER.indexOf(a) + 99) % 99 - ((TYPE_ORDER.indexOf(b) + 99) % 99)
  );

  if (!keys.length) {
    return (
      <p className="st-empty">
        분할표가 비어 있다. 몇 %에 얼마를 살지 미리 적어 두지 않으면 물타기는 즉흥이 된다.
      </p>
    );
  }

  return (
    <div className="st">
      {keys.map((type) => {
        const rows = groups[type];
        const label = rows[0]?.strategy_type_label || type;
        const total = rows.reduce((sum, r) => sum + Number(r.quantity_ratio || 0), 0);
        const balanced = Math.abs(total - 100) < 0.01;

        return (
          <div className="st-group" key={type}>
            <div className="st-group-head">
              <h4>{label}</h4>
              <span className={`st-total num ${balanced ? "is-ok" : "is-off"}`}>
                수량 합 {total.toFixed(0)}%
                {!balanced && " — 100%가 아니다"}
              </span>
            </div>
            <table className="st-table">
              <thead>
                <tr>
                  <th>차수</th>
                  <th style={{ textAlign: "right" }}>기준가 대비</th>
                  <th style={{ textAlign: "right" }}>수량 비중</th>
                  <th>업종</th>
                  {onEditMethod && <th aria-label="수정" />}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="num">{r.step_no ?? "—"}차</td>
                    <td className="num st-price">
                      {r.price_ratio == null
                        ? "—"
                        : `${Number(r.price_ratio) > 0 ? "+" : ""}${Number(r.price_ratio).toFixed(1)}%`}
                    </td>
                    <td className="num">
                      {r.quantity_ratio == null ? "—" : `${Number(r.quantity_ratio).toFixed(0)}%`}
                    </td>
                    <td>{r.sector || "—"}</td>
                    {onEditMethod && (
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="row-edit"
                          onClick={() => onEditMethod(r)}
                        >
                          수정
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}
