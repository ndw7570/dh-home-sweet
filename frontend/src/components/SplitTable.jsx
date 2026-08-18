import "./SplitTable.css";

/**
 * n차 분할표 — 방법에 딸린 `trading_strategies` 를 전략종류별로 묶어서 그린다.
 *
 * 이 표를 **미리** 채워 두는 것이 규율의 실체다. 떨어진 뒤에 얼마를 더 살지 정하면
 * 그건 계획이 아니라 반응이다.
 *
 * 두 가지를 그 자리에서 표시한다.
 *   **수량 합**   100 이 아니면 계획이 덜 짜인 것이다.
 *   **밴드 대비** 기준가 대비 %가 그날 실제 변동폭(`band`) 안인지 밖인지. 밖이라고 틀린 건
 *                 아니다 — 그날보다 큰 움직임을 가정한 계단이라, 구분만 해 준다.
 */
const TYPE_ORDER = ["BUY_SPLIT", "ADD_ON", "SELL_SPLIT", "TAKE_PROFIT", "STOP_LOSS"];

export default function SplitTable({ strategies, band, onEditStep }) {
  const groups = strategies || {};
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

  /** 그날 실제 변동폭 밖으로 나간 계단인가. 밴드를 모르면 판정하지 않는다. */
  const outsideBand = (ratio) => {
    if (!band || ratio == null) return false;
    const n = Number(ratio);
    if (!Number.isFinite(n)) return false;
    if (n < 0) return band.down != null && n < band.down;
    if (n > 0) return band.up != null && n > band.up;
    return false;
  };

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
              {band && (
                <span className="st-band num" title="그날 가격데이터의 실제 변동폭">
                  밴드 {band.down == null ? "—" : `${band.down.toFixed(2)}%`} ~{" "}
                  {band.up == null ? "—" : `+${band.up.toFixed(2)}%`}
                </span>
              )}
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
                  {onEditStep && <th aria-label="수정" />}
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
                      {outsideBand(r.price_ratio) && (
                        <span
                          className="st-outside"
                          title="그날 실제 변동폭 밖이다 — 더 큰 움직임을 가정한 계단"
                        >
                          밴드 밖
                        </span>
                      )}
                    </td>
                    <td className="num">
                      {r.quantity_ratio == null ? "—" : `${Number(r.quantity_ratio).toFixed(0)}%`}
                    </td>
                    <td>{r.sector || "—"}</td>
                    {onEditStep && (
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="row-edit"
                          onClick={() => onEditStep(r)}
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
