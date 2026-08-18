import CandleDatePicker from "./CandleDatePicker";
import PriceDataPicker from "./PriceDataPicker";
import PricePreview from "./PricePreview";
import { optionsFor } from "../lib/useChoices";

/**
 * 금액 입력은 한국식 세 자리 콤마로 늘 보인다 (100000 → "100,000").
 * 저장 시엔 EntityForm.toPayload 가 콤마를 떼고 숫자로 바꾼다.
 * 여기서는 표시/입력만 관리한다 — 상태에는 콤마 없는 원문만 넣는다.
 *
 * ⚠ 소수점을 반드시 살려야 한다. DRF 의 DecimalField 는 `"10000000.00"` 처럼
 * **문자열**로 내려온다. 예전 코드는 숫자가 아닌 문자를 전부 걷어 냈는데, 그러면
 * 점이 사라지면서 소수부 `00` 이 정수부에 붙어 값이 100배가 됐다
 * (10,000,000원 → 1,000,000,000원). 그 상태로 저장하면 100배가 그대로 DB 에 남는다.
 */
function formatPriceDisplay(raw) {
  if (raw === "" || raw === null || raw === undefined) return "";
  const s = String(raw).trim();
  const neg = s.startsWith("-");
  const cleaned = s.replace(/[^\d.]/g, "");
  if (!cleaned) return neg ? "-" : "";
  const dot = cleaned.indexOf(".");
  const intPart = dot === -1 ? cleaned : cleaned.slice(0, dot);
  // 점 뒤는 숫자만 남긴다(점을 두 번 친 경우까지 방어).
  const frac = dot === -1 ? null : cleaned.slice(dot + 1).replace(/\./g, "");
  const head = intPart ? Number(intPart).toLocaleString("ko-KR") : "0";
  const sign = neg ? "-" : "";
  // 입력 중인 "170000." 은 점을 남겨야 다음 타이핑이 이어진다.
  if (frac === null) return sign + head;
  return `${sign}${head}.${frac}`;
}

function sanitizePriceInput(v) {
  // 콤마·공백·문자를 걷어 내고 부호 하나와 소수점 하나만 남긴다.
  const s = String(v ?? "");
  const neg = s.trim().startsWith("-");
  const cleaned = s.replace(/[^\d.]/g, "");
  if (!cleaned) return neg ? "-" : "";
  const dot = cleaned.indexOf(".");
  const body =
    dot === -1
      ? cleaned
      : `${cleaned.slice(0, dot)}.${cleaned.slice(dot + 1).replace(/\./g, "")}`;
  return (neg ? "-" : "") + body;
}

/**
 * 필드 하나. 타입은 EntityForm 의 스펙이 정한다.
 *
 * 어떤 타입이든 세 가지를 같은 모양으로 보여 준다.
 *   라벨(+필수 표시) · 입력 · 그 아래 힌트 또는 **서버가 돌려준 에러**
 * 에러 자리를 힌트와 같은 자리에 둔 이유: 검증에 걸린 이유가 입력 바로 밑에
 * 안 붙으면, 사용자는 어느 칸이 문제인지 모른 채 저장 버튼만 다시 누른다.
 *
 * `live` 는 **저장을 누르기 전**에 나오는 것이다 — `{ note, warn }`.
 *   note  지금 적은 값에서 바로 따라 나오는 수 (수량 × 지정가격 = 체결금액)
 *   warn  값 자체는 유효하지만 사람이 다시 볼 만한 것 (수량 칸에 가격을 적은 것 같다)
 * 서버 에러(`error`)와 자리를 나눠 쓴다. 에러는 이미 벌어진 일이고 live 는 벌어지기 전이라,
 * 둘이 같은 칸을 다투면 "고칠 기회"가 "고쳐야 할 이유"에 밀려 사라진다.
 */
export default function FormField({ field, value, error, live, watch, choices, onChange }) {
  const {
    name,
    label,
    type = "text",
    required,
    hint,
    rows,
    step,
    min,
    max,
    placeholder,
    options,
    choiceKey,
  } = field;

  const id = `f-${name}`;
  // 문자열 입력은 blur 때 양 끝 공백을 걷어 낸다. 사용자가 눈으로도 결과를 보게 하고,
  // 저장 경로(EntityForm.toPayload)에서도 한 번 더 트림해 방어한다.
  const trimOnBlur = (e) => {
    const v = e.target.value;
    if (typeof v === "string") {
      const t = v.trim();
      if (t !== v) onChange(name, t);
    }
  };
  const common = {
    id,
    name,
    value: value ?? "",
    onChange: (e) => onChange(name, e.target.value),
    "aria-invalid": error ? "true" : undefined,
    className: error ? "ff-input is-error" : "ff-input",
    placeholder,
  };

  let control;
  switch (type) {
    case "textarea":
      control = <textarea {...common} rows={rows || 3} onBlur={trimOnBlur} />;
      break;

    case "price":
      // type="number" 로는 콤마를 못 넣는다. text 로 바꾸고 표시만 콤마로 꾸민다.
      control = (
        <input
          {...common}
          type="text"
          inputMode="numeric"
          value={formatPriceDisplay(value)}
          onChange={(e) => onChange(name, sanitizePriceInput(e.target.value))}
          onBlur={trimOnBlur}
        />
      );
      break;

    case "number":
    case "ratio":
      control = (
        <input
          {...common}
          type="number"
          step={step ?? (type === "ratio" ? "0.01" : "any")}
          min={min}
          max={max}
          inputMode="decimal"
        />
      );
      break;

    case "date":
      control = <input {...common} type="date" />;
      break;

    case "datetime":
      control = <input {...common} type="datetime-local" />;
      break;

    case "confidence":
      // 1~5. 라디오로 두면 "안 정함"과 "1"이 눈으로 구분된다.
      control = (
        <div className="ff-confidence">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              className={`ff-conf ${Number(value) === n ? "is-on" : ""}`}
              onClick={() => onChange(name, Number(value) === n ? "" : n)}
            >
              {n}
            </button>
          ))}
          <span className="ff-conf-hint">{value ? `${value}/5` : "안 정함"}</span>
        </div>
      );
      break;

    case "choice": {
      const list = optionsFor(choices, choiceKey || name, value);
      control = (
        <select {...common}>
          <option value="">선택 안 함</option>
          {list.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
      break;
    }

    case "ref":
      control = (
        <select {...common}>
          <option value="">선택 안 함</option>
          {(options || []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
      break;

    case "json":
      control = (
        <textarea
          {...common}
          rows={rows || 3}
          spellCheck={false}
          className={`${common.className} ff-mono`}
          onBlur={trimOnBlur}
        />
      );
      break;

    /**
     * 값 여러 개를 켜고 끄는 체크박스 묶음. 라벨은 서버 choices 가 준다.
     * 옵션마다 `optionHints` 로 한 줄 설명을 달 수 있다 — 켠 뒤에 다른 화면이 달라지는
     * 종류라면 고르기 전에 그 사실을 알려야 한다.
     */
    case "multicheck": {
      const list = optionsFor(choices, choiceKey || name, null);
      const picked = Array.isArray(value) ? value : [];
      control = (
        <div className="ff-multicheck" role="group" aria-labelledby={id}>
          {list.map((o) => (
            <label key={o.value} className="ff-mc-item">
              <input
                type="checkbox"
                checked={picked.includes(o.value)}
                onChange={(e) =>
                  onChange(
                    name,
                    e.target.checked
                      ? [...picked, o.value]
                      : picked.filter((v) => v !== o.value)
                  )
                }
              />
              <span className="ff-mc-label">{o.label}</span>
              {field.optionHints?.[o.value] && (
                <span className="ff-mc-hint">{field.optionHints[o.value]}</span>
              )}
            </label>
          ))}
        </div>
      );
      break;
    }

    /**
     * 필수원칙 점검 — 원칙마다 `지킴 / 못 지킴` 라디오 + 메모.
     *
     * 값은 `{ [원칙id]: { is_done, note } }` 다. 배열로 들고 있으면 라디오 하나를 누를 때마다
     * 배열에서 자리를 찾아야 하고, 그 과정에서 순서가 흔들린다. 표시 순서는 목록(priority 순)
     * 이 정한다.
     *
     * 두 라디오 모두 **기본 미선택**이고 색을 넣지 않는다. `못 지킴` 을 빨갛게 칠하면
     * 사람이 사실대로 답하는 대신 누르기 편한 쪽을 누르게 된다.
     */
    case "principleChecks": {
      const list = options || [];
      // 점검할 원칙이 없으면 칸 자체를 만들지 않는다. 빈 상자는 "뭔가 빠졌나" 로 읽힌다.
      if (!list.length) return null;
      const map = value && typeof value === "object" ? value : {};
      const set = (pid, patch) =>
        onChange(name, { ...map, [pid]: { ...(map[pid] || { note: "" }), ...patch } });

      return (
        <div className="ff">
          <span className="ff-label">
            {label}
            <span className="ff-req" title="필수">
              *
            </span>
          </span>
          <ul className="ff-pc">
            {list.map((o) => {
              const cur = map[o.value] || {};
              const unanswered = cur.is_done !== true && cur.is_done !== false;
              return (
                <li key={o.value} className={`ff-pc-item ${unanswered ? "is-unanswered" : ""}`}>
                  <p className="ff-pc-text">
                    {o.priority != null && <span className="ff-pc-pri num">{o.priority}</span>}
                    {o.label}
                  </p>
                  <div className="ff-pc-answer">
                    {[
                      { v: true, text: "지킴" },
                      { v: false, text: "못 지킴" },
                    ].map((opt) => (
                      <label key={String(opt.v)} className="ff-pc-radio">
                        <input
                          type="radio"
                          name={`pc-${o.value}`}
                          checked={cur.is_done === opt.v}
                          onChange={() => set(o.value, { is_done: opt.v })}
                        />
                        <span>{opt.text}</span>
                      </label>
                    ))}
                    <input
                      type="text"
                      className="ff-input ff-pc-note"
                      placeholder="메모 (선택)"
                      value={cur.note ?? ""}
                      onChange={(e) => set(o.value, { note: e.target.value })}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
          {error ? (
            <p className="ff-error">{error}</p>
          ) : (
            <p className="ff-hint">
              지키지 못했다면 그대로 `못 지킴` 을 고른다. 어겼다는 기록이 남아야 나중에 그
              매매가 어떻게 됐는지 갈라 볼 수 있다.
            </p>
          )}
        </div>
      );
    }

    /**
     * 저장 전 미리보기. 값을 담는 칸이 아니라, 다른 칸(종목·기준일시)을 지켜보다가
     * 무슨 값이 저장될지 보여 준다. 스스로 조회하므로 여기서는 자리만 내준다.
     */
    /**
     * 기준 일자 — 수집된 일봉에서 뽑은 목록. 자유 날짜 입력이 아니라 목록인 이유는
     * CandleDatePicker 머리말에 적어 뒀다.
     */
    case "candleDate":
      control = (
        <CandleDatePicker
          {...(watch || {})}
          value={value}
          onChange={(next) => onChange(name, next)}
        />
      );
      break;

    /** 전략의 기준 가격데이터 — 종목·거래일을 보고 고른다(PriceDataPicker 머리말 참조). */
    case "priceDataPicker":
      control = (
        <PriceDataPicker
          {...(watch || {})}
          value={value}
          onChange={(next) => onChange(name, next)}
        />
      );
      break;

    case "pricePreview":
      return (
        <div className="ff">
          <span className="ff-label">{label}</span>
          <PricePreview
            {...(watch || {})}
            manual={value === true}
            onManual={() => onChange(name, true)}
          />
          {error && <p className="ff-error">{error}</p>}
        </div>
      );

    case "checkbox":
      control = (
        <label className="ff-checkbox">
          <input
            id={id}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(name, e.target.checked)}
          />
          <span>{field.checkboxLabel || "예"}</span>
        </label>
      );
      break;

    default:
      control = <input {...common} type="text" onBlur={trimOnBlur} />;
  }

  return (
    <div className={`ff ${field.half ? "is-half" : ""}`}>
      <label className="ff-label" htmlFor={id}>
        {label}
        {required && <span className="ff-req" title="필수">*</span>}
      </label>
      {control}
      {live?.note && <p className="ff-live num">{live.note}</p>}
      {live?.warn && (
        <p className="ff-warn" role="status">
          <span aria-hidden="true">⚠ </span>
          {live.warn}
        </p>
      )}
      {error ? (
        <p className="ff-error">{error}</p>
      ) : (
        hint && <p className="ff-hint">{hint}</p>
      )}
    </div>
  );
}
