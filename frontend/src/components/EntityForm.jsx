import { useMemo, useState } from "react";

import FormField from "./FormField";
import { useChoices } from "../lib/useChoices";
import "./FormField.css";
import "./EntityForm.css";

/**
 * 필드 스펙 하나로 폼을 그리고, 저장하고, 서버 에러를 필드로 되돌린다.
 *
 * 이 컴포넌트가 짊어지는 것 세 가지.
 *
 * 1. **빈칸을 `null` 로 보낸다.** `""` 를 그대로 보내면 DRF 의 DecimalField/DateField 가
 *    "유효한 값이 아니다"로 400 을 낸다. 안 적은 것과 0 은 다르다.
 *
 * 2. **서버 검증을 필드 밑에 붙인다.** 이 프로젝트의 검증은 대부분 서버에만 있다
 *    (`근거 없이 예상가만 적을 수 없다`, `상승을 예측하면서 손절가가 예상가보다 높다`).
 *    그걸 화면 위 배너 한 줄로만 보여 주면 어느 칸이 문제인지 알 수 없다.
 *
 * 3. **저장 중 이중 제출을 막는다.** 이행(orders)은 한 번 남기면 고치는 것이 아니라
 *    쌓이는 기록이라, 중복 저장이 곧 없는 매매를 만들어 낸다.
 */

const EMPTY = (v) => v === "" || v === null || v === undefined;

function toPayload(fields, values) {
  const out = {};
  for (const f of fields) {
    if (f.readOnly) continue;
    let raw = values[f.name];

    if (f.type === "checkbox") {
      out[f.name] = Boolean(raw);
      continue;
    }
    // 모든 문자열 입력은 양 끝 공백을 걷어 낸다. 트림 후 빈 값이면 null 로 보낸다.
    if (typeof raw === "string") raw = raw.trim();

    if (EMPTY(raw)) {
      out[f.name] = null;
      continue;
    }
    switch (f.type) {
      case "number":
      case "ratio":
      case "confidence":
        out[f.name] = Number(raw);
        break;
      case "price": {
        // 화면에는 콤마가 있고 상태에도 남을 수 있으니 저장 직전에 걷어 낸다.
        // 부호만 있는 경우(NaN)는 빈 값으로 취급 — 서버에 NaN 을 보내지 않는다.
        const n = Number(String(raw).replace(/,/g, ""));
        out[f.name] = Number.isFinite(n) ? n : null;
        break;
      }
      case "ref":
        out[f.name] = Number(raw);
        break;
      case "json":
        out[f.name] = JSON.parse(raw); // 아래 validateLocal 에서 미리 검사한다
        break;
      case "datetime":
        // <input type="datetime-local"> 은 "2026-08-09T10:12" — DRF 가 그대로 파싱한다.
        out[f.name] = raw;
        break;
      default:
        out[f.name] = raw;
    }
  }
  return out;
}

/** 서버에 보내기 전에 프론트에서만 잡을 수 있는 것 — JSON 문법과 필수값. */
function validateLocal(fields, values) {
  const errors = {};
  for (const f of fields) {
    let raw = values[f.name];
    // 공백만 채워 두고 "적었다"고 넘어가는 경우를 여기서 잡는다.
    if (typeof raw === "string") raw = raw.trim();
    if (f.required && EMPTY(raw) && f.type !== "checkbox") {
      errors[f.name] = "필수 항목이다.";
      continue;
    }
    if (f.type === "json" && !EMPTY(raw)) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed === null || typeof parsed !== "object") {
          errors[f.name] = "JSON 객체여야 한다. 예: {\"005930\": 30, \"CASH\": 70}";
        }
      } catch (e) {
        errors[f.name] = `JSON 문법 오류 — ${e.message}`;
      }
    }
  }
  return errors;
}

/** `{field: ["msg"]}` / `{field: "msg"}` / 문자열 어느 쪽으로 와도 필드 맵으로 만든다. */
function serverErrors(err) {
  const payload = err?.payload;
  const results = payload?.results;
  if (results && typeof results === "object" && !Array.isArray(results)) {
    const out = {};
    for (const [k, v] of Object.entries(results)) {
      out[k] = Array.isArray(v) ? v.join(" ") : String(v);
    }
    return out;
  }
  return { __all__: payload?.message || err?.message || "저장하지 못했다." };
}

function initialValues(fields, instance) {
  const v = {};
  for (const f of fields) {
    let raw = instance ? instance[f.name] : undefined;
    if (raw === undefined || raw === null) {
      v[f.name] = f.type === "checkbox" ? Boolean(f.default) : (f.default ?? "");
      continue;
    }
    if (f.type === "json") v[f.name] = JSON.stringify(raw, null, 2);
    else if (f.type === "date") v[f.name] = String(raw).slice(0, 10);
    else if (f.type === "datetime") v[f.name] = String(raw).slice(0, 16);
    else v[f.name] = raw;
  }
  return v;
}

export default function EntityForm({
  fields,
  instance,
  optionsMap,
  onSubmit,
  onCancel,
  onDelete,
  submitLabel,
}) {
  const { choices } = useChoices();
  const [values, setValues] = useState(() => initialValues(fields, instance));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const isEdit = Boolean(instance?.id ?? instance?.person_id);
  const grouped = useMemo(() => fields.filter((f) => !f.hidden), [fields]);

  const change = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => (e[name] || e.__all__ ? { ...e, [name]: undefined, __all__: undefined } : e));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;

    const local = validateLocal(fields, values);
    if (Object.keys(local).length) {
      setErrors(local);
      return;
    }

    setBusy(true);
    setErrors({});
    try {
      await onSubmit(toPayload(fields, values));
    } catch (err) {
      setErrors(serverErrors(err));
      setBusy(false);
      return;
    }
    setBusy(false);
  };

  const remove = async () => {
    if (busy || !onDelete) return;
    // 소프트삭제라 되살릴 수는 있지만, 화면에서 되살리는 경로가 아직 없다. 그래서 묻는다.
    if (!window.confirm("삭제한다. (물리 삭제가 아니라 is_deleted 만 켠다)")) return;
    setBusy(true);
    try {
      await onDelete();
    } catch (err) {
      setErrors(serverErrors(err));
      setBusy(false);
    }
  };

  return (
    <form className="ef" onSubmit={submit} noValidate>
      {errors.__all__ && <p className="ef-banner">{errors.__all__}</p>}

      <div className="ff-grid">
        {grouped.map((f) => (
          <FormField
            key={f.name}
            // FK 셀렉트의 목록은 스펙이 아니라 화면이 준다(계좌 목록·종목 목록 등).
            field={f.type === "ref" ? { ...f, options: optionsMap?.[f.optionsKey || f.name] || [] } : f}
            value={values[f.name]}
            error={errors[f.name]}
            choices={choices}
            onChange={change}
          />
        ))}
      </div>

      {errors.non_field_errors && <p className="ef-banner">{errors.non_field_errors}</p>}

      <div className="ef-actions">
        {isEdit && onDelete && (
          <button type="button" className="btn ef-delete" onClick={remove} disabled={busy}>
            삭제
          </button>
        )}
        <span className="ef-spacer" />
        <button type="button" className="btn" onClick={onCancel} disabled={busy}>
          취소
        </button>
        <button type="submit" className="btn is-primary" disabled={busy}>
          {busy ? "저장 중…" : submitLabel || (isEdit ? "수정" : "추가")}
        </button>
      </div>
    </form>
  );
}
