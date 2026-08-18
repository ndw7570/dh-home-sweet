import { useState } from "react";

import { dateWithWeekday, isoDate, price } from "../lib/format";
import { applyBand, bandRatios, ladderRows, pct } from "../lib/priceBand";
import "./PriceBandPanel.css";

/**
 * 전략의 근거를 **금액이 아니라 비율**로 읽는 자리.
 *
 * 스냅샷의 고가·저가를 금액 그대로 보면 그 전략은 그때 그 가격대에서만 쓸 수 있다.
 * 30만원일 때 세운 "고가 306,500 / 저가 287,500" 은 주가가 10만원이 되면 아무 의미가 없다.
 * 남겨야 하는 것은 **현재가에서 얼마나 벌어졌는가** 다.
 *
 *   고가 240만 · 저가 160만 · 현재가 200만  →  +20% / -20%
 *   그 비율을 나중에 100만원에 대면          →  120만 ~ 80만
 *
 * 그래서 아래쪽 `씌울 현재가` 는 고칠 수 있게 둔다. 기본값은 지금 시세지만, "1년 뒤
 * 100만원이 되면" 같은 가정을 그 자리에서 넣어 봐야 이 비율이 쓸모가 있다.
 * 스냅샷 자체는 바뀌지 않는다 — 바뀌는 것은 비율을 씌우는 대상이다.
 */
export default function PriceBandPanel({ snapshot, security }) {
  const ratios = bandRatios(snapshot);
  const livePrice = security?.current_price == null ? null : Number(security.current_price);
  // 빈 문자열이면 "지금 시세를 쓴다" 는 뜻. 사용자가 지우고 다시 칠 수 있어야 한다.
  const [assumed, setAssumed] = useState("");
  // 분할 계단. 30% 는 흔히 쓰는 기본값일 뿐이고 여기서 바꾼다.
  const [side, setSide] = useState("buy");
  const [splitPct, setSplitPct] = useState("30");
  // 계단을 어느 기준으로 읽을 것인가. `side` 는 한쪽 구간, `even` 은 고저 전체 100%.
  const [splitMode, setSplitMode] = useState("side");

  if (!snapshot) {
    return (
      <p className="pb-none">
        기준 가격데이터가 없다. 어느 가격을 보고 세운 분할인지 남지 않아, 나중에 이 표를
        되짚을 근거가 없다.
      </p>
    );
  }

  const typed = assumed.trim() === "" ? null : Number(assumed.replace(/,/g, ""));
  const base = Number.isFinite(typed) ? typed : livePrice;
  const projected = applyBand(base, ratios);

  return (
    <div className="pb">
      <div className="pb-head">
        <span className="pb-label">기준 가격데이터</span>
        <span className="num pb-when">{dateWithWeekday(isoDate(snapshot.price_at))}</span>
        {security && (
          <span className="pb-sec num">
            {security.name} ({security.symbol})
          </span>
        )}
      </div>

      <div className="pb-snapshot">
        <div>
          <dt>고가</dt>
          <dd className="num">{price(snapshot.high_price)}</dd>
          <dd className="num pb-pct is-up">{pct(ratios?.up)}</dd>
        </div>
        <div className="is-base">
          <dt>현재가</dt>
          <dd className="num">{price(snapshot.current_price)}</dd>
          <dd className="num pb-pct">기준</dd>
        </div>
        <div>
          <dt>저가</dt>
          <dd className="num">{price(snapshot.low_price)}</dd>
          <dd className="num pb-pct is-down">{pct(ratios?.down)}</dd>
        </div>
        <div className="pb-width">
          <dt>폭</dt>
          <dd className="num">{ratios?.width == null ? "—" : `${ratios.width.toFixed(2)}%p`}</dd>
          <dd className="pb-pct">고가~저가</dd>
        </div>
      </div>

      {!ratios ? (
        <p className="pb-warn">
          현재가가 없어 비율을 낼 수 없다. 이 스냅샷은 금액으로만 읽어야 한다.
        </p>
      ) : (
        <div className="pb-project">
          <label className="pb-input">
            <span>이 비율을 씌울 현재가</span>
            <input
              type="text"
              inputMode="numeric"
              className="ff-input num"
              value={assumed}
              placeholder={livePrice == null ? "가격 입력" : price(livePrice)}
              onChange={(e) => setAssumed(e.target.value.replace(/[^\d.-]/g, ""))}
            />
          </label>

          <div className="pb-project-out">
            {base == null ? (
              <span className="pb-project-idle">
                씌울 가격이 없다. 지금 시세가 안 잡히니 값을 직접 넣는다.
              </span>
            ) : (
              <>
                <span className="pb-project-band num">
                  <strong className="is-up">{price(projected.high)}</strong>
                  <span className="pb-tilde">~</span>
                  <strong className="is-down">{price(projected.low)}</strong>
                </span>
                <span className="pb-project-base num">
                  {price(base)} 기준
                  {typed == null && security?.price_at
                    ? ` · 지금 시세`
                    : typed != null
                      ? " · 가정값"
                      : ""}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {projected && (
        <SplitLadder
          projected={projected}
          mode={splitMode}
          onMode={setSplitMode}
          side={side}
          onSide={setSide}
          pctValue={splitPct}
          onPct={setSplitPct}
        />
      )}
    </div>
  );
}

/**
 * 분할 계단 — 구간을 비중만큼씩 잘라 어디서 몇 번에 담을지.
 *
 * 비율(`-4.01%`)만으로는 주문을 낼 수 없다. 실제로 필요한 것은 **얼마에 사느냐**고,
 * 그건 구간을 몇 조각으로 자르느냐에 달렸다. 30% 로 잡으면 세 번에 90% 까지 가고
 * 나머지를 바닥에서 한 번 더 담는다.
 *
 * 기준이 둘이지만 **화면은 하나다.** 컨트롤도 컬럼도 같고, 바뀌는 것은 `배분`·`누적`을
 * 무엇에 대고 재느냐뿐이다 — 한쪽 구간(상승·하락분)이냐 고저 전체(정비율)냐.
 * 기준마다 다른 표를 두면 탭을 오갈 때 같은 값을 다른 자리에서 찾게 된다.
 */
function SplitLadder({ projected, mode, onMode, side, onSide, pctValue, onPct }) {
  const data = ladderRows({
    high: projected.high,
    low: projected.low,
    base: projected.base,
    ratioPct: Number(pctValue),
    side,
    mode,
  });
  const buying = side !== "sell";
  const tone = buying ? "is-down" : "is-up";

  return (
    <div className="pb-split">
      <div className="pb-split-head">
        <span className="pb-split-modes" role="group" aria-label="계단 기준">
          {[
            { key: "side", label: "상승·하락분" },
            { key: "even", label: "정비율" },
          ].map((o) => (
            <button
              key={o.key}
              type="button"
              className={`pb-side ${mode === o.key ? "is-on" : ""}`}
              aria-pressed={mode === o.key}
              onClick={() => onMode(o.key)}
            >
              {o.label}
            </button>
          ))}
        </span>
        <span className="pb-split-side" role="group" aria-label="분할 방향">
          {[
            { key: "buy", label: "매수" },
            { key: "sell", label: "매도" },
          ].map((o) => (
            <button
              key={o.key}
              type="button"
              className={`pb-side ${side === o.key ? "is-on" : ""}`}
              aria-pressed={side === o.key}
              onClick={() => onSide(o.key)}
            >
              {o.label}
            </button>
          ))}
        </span>
        <label className="pb-split-pct">
          <span>비중</span>
          <input
            type="number"
            min="1"
            max="100"
            step="1"
            className="ff-input num"
            value={pctValue}
            onChange={(e) => onPct(e.target.value)}
          />
          <span>%</span>
        </label>
        <span className="pb-split-span num">
          {data
            ? `${price(projected.base)} → ${price(data.target)} (${price(data.span)})` +
              // 정비율은 이쪽이 전체에서 몇 %인지가 곧 의미다. 반대편 몫도 같이 적어
              // 두면 "합쳐서 100%" 가 표를 옮기지 않고도 확인된다.
              (mode === "even" && data.share != null
                ? ` · 전체의 ${data.share.toFixed(1)}% (반대편 ${data.otherShare.toFixed(1)}%)`
                : "")
            : ""}
        </span>
      </div>

      {!data ? (
        <p className="pb-split-none">
          {mode === "even"
            ? "고가·저가·현재가가 모두 있어야 전체 대비로 잴 수 있다."
            : "구간과 비중(1~100)이 있어야 계단을 낼 수 있다."}
        </p>
      ) : (
        <table className="pb-split-table">
          <thead>
            <tr>
              <th scope="col">단계</th>
              <th scope="col">배분</th>
              <th scope="col">누적</th>
              <th scope="col">차이</th>
              <th scope="col">현재가 대비</th>
              <th scope="col">가격</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => (
              <tr key={r.step} className={r.isEdge ? "is-edge" : ""}>
                <td>{r.step}차</td>
                <td className={`num ${tone}`}>
                  {`${buying ? "-" : "+"}${r.incPct.toFixed(2)}%p`}
                </td>
                <td className="num pb-cum">{r.cumPct.toFixed(2)}%</td>
                <td className={`num ${tone}`}>{price(r.delta)}</td>
                <td className={`num ${tone}`}>{pct(r.pctOfBase)}</td>
                <td className="num pb-split-price">{price(r.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
