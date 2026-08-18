import { previewPriceData } from "../api/trading";
import { errorDetail } from "../lib/apiError";
import { localInputToISO, price } from "../lib/format";
import { useAsync } from "../lib/useAsync";
import "./PricePreview.css";

/**
 * 가격데이터를 저장하기 **전에** 무슨 값이 들어갈지 보여 준다.
 *
 * 가격데이터는 시세 저장소가 아니라 "전략을 세운 순간 무엇을 보고 있었나" 의 기록이다.
 * 한 번 만들어진 행은 수집이 아무리 돌아도 다시 바뀌지 않는다 — 근거 가격이 나중에 따라
 * 움직이면 "왜 이 가격대에 걸었지" 를 되짚을 수 없기 때문이다. 그래서 만드는 순간의 값이
 * 맞는지 여기서 한 번 확인시킨다. 저장하고 나서야 값을 알게 되면 틀린 기준일로 만든
 * 스냅샷을 지우고 다시 만드는 일이 반복된다.
 */

const SOURCE_LABEL = {
  MINUTE: "당일 분봉 집계",
  DAILY: "그날 일봉의 확정 고가·저가",
};

export default function PricePreview({ securityId, priceAt, manual, onManual }) {
  const { data, error, loading } = useAsync(
    () =>
      securityId
        ? previewPriceData({
            security_id: securityId,
            // 오프셋을 붙여 보낸다. `datetime-local` 원문을 그대로 넘기면 서버가
            // naive datetime 으로 파싱해 500 을 낸다.
            price_at: localInputToISO(priceAt),
          })
        : Promise.resolve(null),
    [securityId, priceAt]
  );

  // 직접 입력으로 넘어갔으면 미리보기는 더 이상 이 폼의 답이 아니다.
  if (manual) {
    return (
      <div className="pp is-manual">
        <p className="pp-manual-msg">
          고가·저가를 직접 입력하는 중이다. 아래 칸에 적은 값이 그대로 저장되고 자동 채움은
          건너뛴다.
        </p>
      </div>
    );
  }

  if (!securityId) {
    return (
      <div className="pp is-idle">
        <p className="pp-idle-msg">종목을 고르면 그 시점의 고가·저가를 미리 보여 준다.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pp is-idle">
        <p className="pp-idle-msg">수집된 시세를 확인하는 중…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pp is-none">
        <p className="pp-none-msg">시세를 확인하지 못했다 — {errorDetail(error)}</p>
        <button type="button" className="btn is-sm" onClick={onManual}>
          직접 입력하기
        </button>
      </div>
    );
  }

  /**
   * `price_source` 가 없으면 그 시점 시세가 수집되지 않았다는 뜻이다.
   * 이대로 저장하면 400 이라, 저장을 누르기 전에 여기서 길을 터 준다.
   */
  if (!data || data.price_source == null) {
    return (
      <div className="pp is-none">
        <p className="pp-none-msg">수집된 시세가 없습니다.</p>
        <p className="pp-none-hint">
          과거 일자는 일봉 수집이 필요하다(`kis_backfill_daily`). 또는 고가·저가를 직접
          입력한다.
        </p>
        <button type="button" className="btn is-sm" onClick={onManual}>
          직접 입력하기
        </button>
      </div>
    );
  }

  return (
    <div className="pp">
      <dl className="pp-rows">
        <div>
          <dt>고가</dt>
          <dd className="num">{price(data.high_price)}</dd>
        </div>
        <div>
          <dt>저가</dt>
          <dd className="num">{price(data.low_price)}</dd>
        </div>
        <div>
          <dt>출처</dt>
          <dd>{SOURCE_LABEL[data.price_source] || data.price_source}</dd>
        </div>
      </dl>
      <p className="pp-foot">
        저장하면 이 값이 그대로 굳는다. 나중에 시세가 갱신돼도 이 행은 안 바뀐다.
        <button type="button" className="pp-manual-link" onClick={onManual}>
          직접 입력하기
        </button>
      </p>
    </div>
  );
}
