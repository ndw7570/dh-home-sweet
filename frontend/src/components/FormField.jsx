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
export default function FormField({ field, value, error, live, choices, onChange }) {
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
