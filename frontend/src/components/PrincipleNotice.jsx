import { listMandatoryPrinciples } from "../api/trading";
import { useAsync } from "../lib/useAsync";
import "./PrincipleNotice.css";

/**
 * 계획 작성 화면에 그 계층의 필수원칙을 **읽기만** 하도록 띄운다.
 *
 * 체크박스도 입력도 없다. 아직 하지 않은 일에 "했다/안 했다" 를 물을 수 없기 때문이다 —
 * 지켰는지 답할 수 있는 자리는 실제로 행동한 기록, 즉 이행뿐이다(그쪽은 `일`(DAY) 원칙의
 * 체크리스트가 맡는다).
 *
 * 0건이면 **아무것도 그리지 않는다.** 빈 상자를 남겨 두면 계획 폼마다 쓸모없는 칸이
 * 하나씩 붙고, 그 칸이 늘 비어 있으면 사용자는 곧 그 자리를 안 보게 된다.
 *
 * 접어 둔 채로 연다. 매번 펼쳐서 폼 위를 차지하면 몇 번 만에 읽지 않고 넘기게 되는데,
 * 그러면 띄운 의미가 없어진다.
 */
export default function PrincipleNotice({ periodType, label }) {
  const { data } = useAsync(
    () => (periodType ? listMandatoryPrinciples({ period_type: periodType }) : Promise.resolve([])),
    [periodType]
  );

  const list = data || [];
  // 로딩 중에도, 0건일 때도 자리를 만들지 않는다. 폼이 위아래로 흔들리지 않게.
  if (!list.length) return null;

  return (
    <details className="pn">
      <summary className="pn-head">
        <span className="pn-title">
          {label ? `${label} 필수원칙` : "필수원칙"}
          <span className="pn-count num">{list.length}</span>
        </span>
        <span className="pn-toggle">펼치기</span>
      </summary>
      <ol className="pn-list">
        {list.map((p) => (
          <li key={p.id} className="pn-item">
            <span className="pn-pri num">{p.priority ?? "-"}</span>
            <span className="pn-text">{p.content}</span>
          </li>
        ))}
      </ol>
    </details>
  );
}
