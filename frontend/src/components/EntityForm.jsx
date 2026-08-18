import { useMemo, useState } from "react";

import ConfirmOutlierDialog from "./ConfirmOutlierDialog";
import FormField from "./FormField";
import { fieldErrors, isOutlierMessage, stripConfirmHint } from "../lib/apiError";
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
  // 스펙에 `mirrorTo` 가 있으면 그 컬럼에도 같은 값을 넣는다. 두 컬럼이 늘 같은 값이어야
  // 하는 자리(일계획의 유효시작일/종료일)에 입력창을 하나만 두기 위한 것이다.
  const put = (f, v) => {
    out[f.name] = v;
    if (f.mirrorTo) out[f.mirrorTo] = v;
  };

  for (const f of fields) {
    if (f.readOnly) continue;
    let raw = values[f.name];

    if (f.type === "checkbox") {
      put(f, Boolean(raw));
      continue;
    }
    // 모든 문자열 입력은 양 끝 공백을 걷어 낸다. 트림 후 빈 값이면 null 로 보낸다.
    if (typeof raw === "string") raw = raw.trim();

    if (EMPTY(raw)) {
      put(f, null);
      continue;
    }
    switch (f.type) {
      case "number":
      case "ratio":
      case "confidence":
        put(f, Number(raw));
        break;
      case "price": {
        // 화면에는 콤마가 있고 상태에도 남을 수 있으니 저장 직전에 걷어 낸다.
        // 부호만 있는 경우(NaN)는 빈 값으로 취급 — 서버에 NaN 을 보내지 않는다.
        const n = Number(String(raw).replace(/,/g, ""));
        put(f, Number.isFinite(n) ? n : null);
        break;
      }
      case "ref":
        put(f, Number(raw));
        break;
      case "json":
        put(f, JSON.parse(raw)); // 아래 validateLocal 에서 미리 검사한다
        break;
      case "datetime":
        // <input type="datetime-local"> 은 "2026-08-09T10:12" — DRF 가 그대로 파싱한다.
        put(f, raw);
        break;
      default:
        put(f, raw);
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

/**
 * 서버 에러를 필드 맵으로 만들되, 사람에게 안 보여야 할 안내는 걷어 낸다.
 *
 * 이상값 검증 메시지는 `… 맞다면 confirm_outlier=true 로 다시 보내라.` 로 끝난다.
 * 그건 API 를 부르는 쪽에게 하는 말이라, 화면은 그 문장 대신 버튼 두 개를 놓는다
 * (`ConfirmOutlierDialog`). 어느 필드가 그 종류였는지는 `outlier` 로 따로 돌려준다.
 */
function serverErrors(err) {
  const raw = fieldErrors(err);
  const out = {};
  let outlier = null;
  for (const [k, v] of Object.entries(raw)) {
    if (!outlier && isOutlierMessage(v)) outlier = { field: k, message: stripConfirmHint(v) };
    out[k] = stripConfirmHint(v);
  }
  return { errors: out, outlier };
}

/**
 * DRF 의 DecimalField 는 `"10000000.00"` 처럼 소수부를 달아 문자열로 내려온다.
 * 원화 금액은 소수부가 늘 0 이라 떼어 낸다 — 남겨 두면 입력칸이 지저분하고,
 * 사용자가 뒤에서부터 지우다 점을 건드리면 자릿수가 통째로 틀어진다.
 * 0 이 아닌 소수부는 값이므로 그대로 둔다.
 */
function trimZeroFraction(raw) {
  const s = String(raw);
  const m = s.match(/^(-?\d+)\.0*$/);
  return m ? m[1] : s;
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
    else if (f.type === "price") v[f.name] = trimZeroFraction(raw);
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
  ctx,
}) {
  const { choices } = useChoices();
  const [values, setValues] = useState(() => initialValues(fields, instance));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  // 서버가 "이 값 맞나" 로 세운 저장. 사람이 확인해 주면 그때 confirm_outlier 를 붙여 다시 보낸다.
  const [outlier, setOutlier] = useState(null);

  const isEdit = Boolean(instance?.id ?? instance?.person_id);
  const grouped = useMemo(() => fields.filter((f) => !f.hidden), [fields]);

  const change = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    setErrors((e) => (e[name] || e.__all__ ? { ...e, [name]: undefined, __all__: undefined } : e));
  };

  /**
   * 실제 전송. `confirmed` 일 때만 `confirm_outlier` 를 얹는다.
   * 평상시에 늘 붙여 보내면 이상값 검증이 통째로 죽는다 — 그래서 사람이 누른 경로에서만 붙인다.
   */
  const send = async (payload, confirmed = false) => {
    setBusy(true);
    setErrors({});
    try {
      await onSubmit(confirmed ? { ...payload, confirm_outlier: true } : payload);
    } catch (err) {
      const { errors: mapped, outlier: found } = serverErrors(err);
      setErrors(mapped);
      // 확인만 하면 통과하는 종류라면 되묻는다. 아니면 필드 밑 메시지로 끝난다.
      setOutlier(found ? { ...found, payload } : null);
      setBusy(false);
      return;
    }
    setBusy(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;

    const local = validateLocal(fields, values);
    if (Object.keys(local).length) {
      setErrors(local);
      return;
    }
    await send(toPayload(fields, values));
  };

  const remove = async () => {
    if (busy || !onDelete) return;
    if (
      !window.confirm(
        "삭제 표시만 한다(is_deleted=true). 행은 남아 있고, 목록의 `삭제분 포함 보기` 에서 복구하거나 영구 삭제할 수 있다."
      )
    )
      return;
    setBusy(true);
    try {
      await onDelete();
    } catch (err) {
      setErrors(serverErrors(err).errors);
      setBusy(false);
    }
  };

  const outlierLabel = outlier && fields.find((f) => f.name === outlier.field)?.label;

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
            // 저장을 눌러 보기 전에 알려 줄 수 있는 것 — 체결금액, 수량/가격 뒤바뀜 의심.
            // 서버 왕복을 기다렸다가 알려 주면 이미 한 번 틀린 값을 확정한 뒤다.
            live={f.live?.(values, ctx)}
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

      {outlier && (
        <ConfirmOutlierDialog
          message={outlier.message}
          fieldLabel={outlierLabel}
          busy={busy}
          onEdit={() => setOutlier(null)}
          onConfirm={async () => {
            const pending = outlier.payload;
            setOutlier(null);
            await send(pending, true);
          }}
        />
      )}
    </form>
  );
}
