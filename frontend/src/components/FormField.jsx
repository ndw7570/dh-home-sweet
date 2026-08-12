import { optionsFor } from "../lib/useChoices";

/**
 * 금액 입력은 한국식 세 자리 콤마로 늘 보인다 (100000 → "100,000").
 * 저장 시엔 EntityForm.toPayload 가 콤마를 떼고 숫자로 바꾼다.
 * 여기서는 표시/입력만 관리한다 — 상태에는 콤마 없는 원문(디지트, 옵션 부호)만 넣는다.
 */
function formatPriceDisplay(raw) {
  if (raw === "" || raw === null || raw === undefined) return "";
  const s = String(raw);
  const neg = s.startsWith("-");
  const digits = s.replace(/[^\d]/g, "");
  if (!digits) return neg ? "-" : "";
  return (neg ? "-" : "") + Number(digits).toLocaleString("ko-KR");
}

function sanitizePriceInput(v) {
  // 콤마·공백·문자 다 걷어 내고 부호 하나만 남긴다.
  const s = String(v ?? "");
  const neg = s.trim().startsWith("-");
  const digits = s.replace(/[^\d]/g, "");
  if (!digits) return neg ? "-" : "";
  return (neg ? "-" : "") + digits;
}

/**
 * 필드 하나. 타입은 EntityForm 의 스펙이 정한다.
 *
 * 어떤 타입이든 세 가지를 같은 모양으로 보여 준다.
 *   라벨(+필수 표시) · 입력 · 그 아래 힌트 또는 **서버가 돌려준 에러**
 * 에러 자리를 힌트와 같은 자리에 둔 이유: 검증에 걸린 이유가 입력 바로 밑에
 * 안 붙으면, 사용자는 어느 칸이 문제인지 모른 채 저장 버튼만 다시 누른다.
 */
export default function FormField({ field, value, error, choices, onChange }) {
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
      {error ? (
        <p className="ff-error">{error}</p>
      ) : (
        hint && <p className="ff-hint">{hint}</p>
      )}
    </div>
  );
}
