import "./AsyncState.css";

/**
 * 로딩 / 에러 / 빈 상태를 한 군데서 처리한다.
 *
 * 로딩 중을 '데이터 없음' 으로 그리면 사용자는 실제로 계획이 없다고 믿는다.
 * 이 프로그램에서는 그 오해가 곧 잘못된 판단으로 이어지므로 셋을 반드시 구분한다.
 */
export default function AsyncState({ loading, error, empty, emptyText, onRetry, children }) {
  if (loading) return <p className="as as-loading">불러오는 중…</p>;

  if (error) {
    return (
      <div className="as as-error">
        <p className="as-error-msg">불러오지 못했다 — {String(error.message || error)}</p>
        <p className="as-error-hint">
          백엔드가 떠 있는지 확인한다. 화면만 보려면{" "}
          <code>frontend/.env.development</code> 의 <code>VITE_USE_MOCK=1</code> 을 쓴다.
        </p>
        {onRetry && (
          <button className="btn" onClick={onRetry}>
            다시 시도
          </button>
        )}
      </div>
    );
  }

  if (empty) return <p className="as as-empty">{emptyText || "아직 데이터가 없다."}</p>;

  return children;
}
