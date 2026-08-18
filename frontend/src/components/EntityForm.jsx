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

/**
 * 화면이 넘겨 준 목록에서 이 필드의 선택지를 꺼낸다.
 * 목록을 쥔 곳이 `optionsMap` 하나뿐이라, 그리는 쪽과 보내는 쪽이 서로 다른 목록을
 * 볼 일이 없다 — 둘이 어긋나면 화면에 없는 항목을 보내 400 이 난다.
 */
const optionsOf = (f, optionsMap) => optionsMap?.[f.optionsKey || f.name] || [];

/**
 * 아래 셋(`toPayload` · `validateLocal` · `initialValues`)은 폼 값과 API 본문 사이의
 * 변환 규칙 전부다. 이름을 밖으로 낸 이유는 **검증 때문**이다 — 순수 함수라 화면을
 * 띄우지 않고도 "빠뜨린 점검을 막는가", "목록에 없는 원칙을 걸러 내는가" 를 확인할 수 있다.
 * 컴포넌트 밖에서 쓰라고 낸 것은 아니다.
 */
export function toPayload(fields, values, optionsMap) {
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
    // 켜고 끄는 묶음은 늘 배열로 나간다. 안 고른 상태는 `null` 이 아니라 `[]` 다 —
    // 서버는 키가 없으면 "손대지 마라", `[]` 면 "전부 해제" 로 읽는다.
    if (f.type === "multicheck") {
      put(f, Array.isArray(raw) ? raw : []);
      continue;
    }
    /**
     * 원칙 점검은 `{id: {is_done, note}}` 를 서버가 받는 배열로 편다.
     *
     * 두 가지를 걸러 낸다.
     *   답하지 않은 항목 — 보내면 `is_done` 이 없어 400 이다. 새로 만들 때는 아래
     *     `validateLocal` 이 먼저 막으므로 여기까지 오지 않고, 수정할 때는 안 건드린
     *     항목을 그대로 두는 것이 맞다.
     *   지금 목록에 없는 원칙 — 적용기간에서 `일` 을 끈 원칙이다. 그대로 되돌려 보내면
     *     "점검 대상이 아닌 원칙" 으로 400 이 난다. 안 보내면 기존 기록은 남는다.
     */
    if (f.type === "principleChecks") {
      const allowed = new Set(optionsOf(f, optionsMap).map((o) => o.value));
      const map = raw && typeof raw === "object" ? raw : {};
      put(
        f,
        Object.entries(map)
          .filter(([id, c]) => allowed.has(Number(id)) && typeof c?.is_done === "boolean")
          .map(([id, c]) => ({
            principle: Number(id),
            is_done: c.is_done,
            note: (c.note || "").trim(),
          }))
      );
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
export function validateLocal(fields, values, optionsMap, isEdit) {
  const errors = {};
  for (const f of fields) {
    /**
     * 화면에 없는 칸은 검증하지 않는다.
     *
     * 숨은 칸에 에러를 달면 그 에러는 어디에도 안 그려지고, 사용자는 저장을 눌러도
     * 아무 일이 안 일어나는 화면만 본다. 실제로 분할 줄의 `method` 가 그랬다 —
     * 숨겨 놓고 required 라 고를 수도 고칠 수도 없는 채로 저장이 막혔다.
     * 값이 정말 필요하면 서버가 400 을 내고, 그건 배너로 보인다.
     */
    if (f.hidden || (f.showIf && !f.showIf(values, isEdit))) continue;
    let raw = values[f.name];
    // 공백만 채워 두고 "적었다"고 넘어가는 경우를 여기서 잡는다.
    if (typeof raw === "string") raw = raw.trim();

    /**
     * 원칙 점검은 **하나도 빠짐없이** 답해야 저장된다(새로 만들 때만).
     * 서버도 같은 것을 막지만, 400 을 받고서야 알려 주면 사용자는 이미 저장을 눌렀고
     * 어느 항목이 빠졌는지 목록에서 다시 찾아야 한다. 누르기 전에 세는 편이 낫다.
     */
    if (f.type === "principleChecks") {
      if (isEdit || !f.requiredOnCreate) continue;
      const map = raw && typeof raw === "object" ? raw : {};
      const missing = optionsOf(f, optionsMap).filter(
        (o) => typeof map[o.value]?.is_done !== "boolean"
      );
      if (missing.length) {
        errors[f.name] =
          `아직 답하지 않은 원칙이 ${missing.length}개 있다. ` +
          "지켰는지 아닌지를 골라야 저장된다 — `못 지킴` 을 골라도 저장된다.";
      }
      continue;
    }

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

export function initialValues(fields, instance) {
  const v = {};
  for (const f of fields) {
    let raw = instance ? instance[f.name] : undefined;
    // 배열·객체를 다루는 칸은 빈 문자열로 시작하면 안 된다 — 그 상태로 저장되면
    // 서버가 `""` 를 받고 타입 오류를 낸다.
    if (f.type === "multicheck") {
      v[f.name] = Array.isArray(raw) ? [...raw] : [];
      continue;
    }
    if (f.type === "principleChecks") {
      // 응답은 배열(`[{principle, is_done, note}]`)이고 폼은 id 로 찾는 맵을 쓴다.
      const map = {};
      for (const c of Array.isArray(raw) ? raw : []) {
        map[c.principle] = { is_done: c.is_done, note: c.note || "" };
      }
      v[f.name] = map;
      continue;
    }
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
  /**
   * `showIf` 는 다른 칸의 값이나 만들기/수정 여부에 따라 칸을 여닫는다.
   * 안 보이는 칸도 `toPayload` 는 그대로 실어 보낸다 — 감췄다고 값을 지우면, 잠깐 열었다
   * 닫은 것만으로 저장돼 있던 값이 `null` 로 덮인다.
   */
  const grouped = useMemo(
    () => fields.filter((f) => !f.hidden && (!f.showIf || f.showIf(values, isEdit))),
    [fields, values, isEdit]
  );

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

    const local = validateLocal(fields, values, optionsMap, isEdit);
    if (Object.keys(local).length) {
      setErrors(local);
      return;
    }
    await send(toPayload(fields, values, optionsMap));
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
            // FK 셀렉트와 원칙 점검 목록은 스펙이 아니라 화면이 준다(종목 목록·일간 원칙 등).
            field={
              f.type === "ref" || f.type === "principleChecks"
                ? { ...f, options: optionsOf(f, optionsMap) }
                : f
            }
            value={values[f.name]}
            error={errors[f.name]}
            // 저장을 눌러 보기 전에 알려 줄 수 있는 것 — 체결금액, 수량/가격 뒤바뀜 의심.
            // 서버 왕복을 기다렸다가 알려 주면 이미 한 번 틀린 값을 확정한 뒤다.
            live={f.live?.(values, ctx)}
            // 다른 칸의 값을 지켜보는 컨트롤(가격 미리보기)이 쓸 입력. 스펙이 무엇을
            // 지켜볼지 정하고, 계산은 컨트롤이 한다.
            watch={f.watch?.(values, ctx)}
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
