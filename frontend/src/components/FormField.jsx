import { optionsFor } from "../lib/useChoices";

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
      control = <textarea {...common} rows={rows || 3} />;
      break;

    case "number":
    case "price":
    case "ratio":
      control = (
        <input
          {...common}
          type="number"
          step={step ?? (type === "price" ? "1" : type === "ratio" ? "0.01" : "any")}
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
      control = <input {...common} type="text" />;
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
