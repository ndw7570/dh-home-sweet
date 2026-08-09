// 얇은 fetch 래퍼. success_response 포맷 { success, message, meta, results } 를 언랩해서
// 항상 `results`를 반환한다. 실패 시 Error(throw).
// namssi-jikjehak/frontend/src/api/client.js 와 동일 정책 — base 경로만 다르다.

const DEFAULT_BASE = "/api/planner";
const API_BASE = import.meta.env.VITE_API_BASE || DEFAULT_BASE;
const TOKEN_KEY = "planner_token";

function buildUrl(path, params) {
  const isAbsolute = path.startsWith("http") || path.startsWith("/api/");
  const base = isAbsolute ? path : `${API_BASE}${path}`;
  if (!params) return base;
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    if (Array.isArray(v)) v.forEach((item) => usp.append(k, item));
    else usp.append(k, String(v));
  });
  const qs = usp.toString();
  return qs ? `${base}?${qs}` : base;
}

function authHeader() {
  try {
    const t = localStorage.getItem(TOKEN_KEY);
    return t ? { Authorization: `Bearer ${t}` } : {};
  } catch {
    return {};
  }
}

const AUTH_EXEMPT_401 = ["/api/auth/token"];

async function request(method, path, { params, body, headers } = {}) {
  const url = buildUrl(path, params);
  const auth = authHeader();
  const opts = {
    method,
    credentials: "omit",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...auth,
      ...(headers || {}),
    },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);

  let res;
  try {
    res = await fetch(url, opts);
  } catch (e) {
    const err = new Error(`network_error: ${e.message}`);
    err.cause = e;
    throw err;
  }

  const text = await res.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = { raw: text };
  }

  if (!res.ok) {
    const err = new Error(
      `http_${res.status}: ${payload?.message || payload?.detail || res.statusText}`
    );
    err.status = res.status;
    err.payload = payload;

    const sentAuth = "Authorization" in auth;
    const isCredEndpoint = AUTH_EXEMPT_401.some((p) => path.startsWith(p));
    if (res.status === 401 && sentAuth && !isCredEndpoint && typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth:unauthorized"));
    }
    throw err;
  }

  // success_response 언랩
  if (payload && typeof payload === "object" && "success" in payload && "results" in payload) {
    return payload.results;
  }
  return payload;
}

export const api = {
  get: (path, params) => request("GET", path, { params }),
  post: (path, body, params) => request("POST", path, { body, params }),
  patch: (path, body, params) => request("PATCH", path, { body, params }),
  put: (path, body, params) => request("PUT", path, { body, params }),
  del: (path, params) => request("DELETE", path, { params }),
};

export { API_BASE, TOKEN_KEY };
