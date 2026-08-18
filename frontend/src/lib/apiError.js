/**
 * 서버가 400 으로 되돌려 준 것을 화면이 쓸 모양으로 푸는 곳.
 *
 * client.js 는 실패를 Error 로 던지면서 원문을 `err.payload` 에 그대로 달아 둔다
 * (`{ success:false, message, results }`). 그 `results` 안에 든 것이 사용자가
 * 실제로 읽어야 할 문장인데, 화면마다 다르게 파헤치면 어떤 화면은 필드 에러를
 * 놓치고 어떤 화면은 `[object Object]` 를 띄운다. 푸는 규칙을 여기 하나로 둔다.
 */

/** `{field: ["msg"]}` / `{field: "msg"}` / 문자열 어느 쪽으로 와도 필드 맵으로 만든다. */
export function fieldErrors(err) {
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

/** 사람에게 보여 줄 한 줄. `results.detail` 이 있으면 그것이 가장 구체적이다. */
export function errorDetail(err) {
  const results = err?.payload?.results;
  if (typeof results === "string") return results;
  const detail = results?.detail;
  if (Array.isArray(detail)) return detail.join(" ");
  if (detail) return String(detail);
  return err?.payload?.message || err?.message || "요청이 실패했다.";
}

/**
 * 물리 삭제가 막혔을 때 "무엇 때문에 못 지우는지".
 * purge 가 400 을 낼 때 `results.blocked_by` 에 참조하는 행들의 이름이 실려 온다.
 * 이걸 감추고 "삭제할 수 없다" 만 띄우면 사용자는 다음에 뭘 해야 할지 알 수 없다.
 */
export function errorBlockedBy(err) {
  const list = err?.payload?.results?.blocked_by;
  return Array.isArray(list) ? list.map(String) : [];
}

/**
 * 이행 이상값 검증의 우회 안내 문구를 걷어 낸다.
 *
 * 서버 메시지는 전부 `"… 맞다면 confirm_outlier=true 로 다시 보내라."` 로 끝난다.
 * 그건 API 를 부르는 쪽에게 하는 말이지 사람에게 하는 말이 아니다. 화면은 그 자리에
 * 버튼 두 개를 대신 놓으므로, 문장은 지우고 판단만 남긴다.
 */
export function stripConfirmHint(message) {
  return String(message)
    .replace(/\s*맞다면\s*confirm_outlier\s*=\s*true\s*로\s*다시\s*보내라\.?/g, "")
    .trim();
}

/** 이 에러가 "사람이 확인해 주면 통과" 인 종류인가. */
export const isOutlierMessage = (message) => String(message).includes("confirm_outlier");
