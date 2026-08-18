// trading_discipline API. success_response 는 client 가 벗기므로 반환값은 순수 데이터.
//
// VITE_USE_MOCK=1 이면 조회가 백엔드 대신 src/data/mock.js 를 본다.
// ⚠ 쓰기(create/update/remove)는 목 모드에서도 실제 API 를 부른다. 목 데이터에
//   가짜로 끼워 넣으면 저장된 줄 알고 넘어가는 상태가 생기는데, 그게 조회가
//   틀리는 것보다 훨씬 위험하다. 목 모드에서 저장하려 하면 백엔드가 없어서 실패한다.
import { api } from "./client";
import * as mock from "../data/mock";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "1";
const wrap = (real, fake) => (USE_MOCK ? Promise.resolve(fake()) : real());

/** 자원 하나의 CRUD 를 만든다. 20개 엔티티가 전부 같은 모양이라 여기서 찍어낸다. */
const crud = (path) => ({
  // 수정 폼은 목록 행이 아니라 이걸로 원본을 다시 읽는다. 캐스케이드 트리처럼
  // 화면용으로 눌러 놓은 데이터로 폼을 채우면 안 보이던 필드가 null 로 덮인다.
  get: (id) => api.get(`/${path}/${id}/`),
  create: (body) => api.post(`/${path}/`, body),
  update: (id, body) => api.patch(`/${path}/${id}/`, body),
  remove: (id) => api.del(`/${path}/${id}/`), // 소프트삭제
  restore: (id) => api.patch(`/${path}/${id}/restore/`, {}),
  // 물리 삭제 — 되돌릴 수 없다. 서버는 **이미 소프트딜리트된 행만** 받는다
  // (살아 있는 행이면 400). 화면에서도 is_deleted === true 인 행에만 버튼을 노출한다.
  purge: (id) => api.del(`/${path}/${id}/purge/`),
});

// ── 화면 전용 조회 ────────────────────────────────
export const fetchCascade = (params = {}) =>
  wrap(() => api.get("/cascade/", params), () => mock.cascade);

export const fetchHomeBoard = (params = {}) =>
  wrap(() => api.get("/home/board/", params), () => mock.homeBoard);

export const fetchSecurityPlans = (securityId, params = {}) =>
  wrap(() => api.get(`/security/${securityId}/plans/`, params), () => mock.securityPlans);

export const fetchExecutionCompare = (params = {}) =>
  wrap(() => api.get("/execution/compare/", params), () => mock.executionCompare);

export const fetchPerformanceSummary = (params = {}) =>
  wrap(() => api.get("/performance/summary/", params), () => mock.performanceSummary);

/** 계획 대비 이행을 일별/주별로 접어 센 것. bucket = "DAY" | "WEEK" */
export const fetchPlanExecution = (params = {}) =>
  wrap(
    () => api.get("/performance/plan-execution/", params),
    () => mock.planExecution || { buckets: [], totals: {} }
  );

export const fetchAiDigest = (params = {}) =>
  wrap(() => api.get("/ai/digest/", params), () => mock.aiDigest);

export const fetchAiFeedbackFor = (tableName, objectIds = []) =>
  wrap(
    () =>
      api.get("/ai/feedback-for/", {
        table_name: tableName,
        object_ids: objectIds.join(","),
      }),
    () => mock.aiFeedbackFor
  );

export const fetchChoices = () => wrap(() => api.get("/meta/choices/"), () => mock.choices);

// ── 계좌 · 종목 ───────────────────────────────────
export const listBrokerAccounts = (params = {}) =>
  wrap(() => api.get("/broker-account/", { no_page: 1, ...params }), () => mock.brokerAccounts);
export const brokerAccount = crud("broker-account");

export const listSecurities = (params = {}) =>
  wrap(() => api.get("/security/", { no_page: 1, ...params }), () => mock.securities);
export const security = crud("security");

export const listSecuritiesLoans = (params = {}) =>
  wrap(() => api.get("/securities-loan/", { no_page: 1, ...params }), () => mock.loans);
export const securitiesLoan = crud("securities-loan");

export const listPriceData = (params = {}) =>
  wrap(() => api.get("/security-price-data/", { no_page: 1, ...params }), () => mock.priceData);
export const priceData = crud("security-price-data");

/**
 * 저장 전에 스냅샷 값을 미리 본다. **아무것도 저장하지 않는다.**
 *
 * 받는 값은 `security_id` 와 `price_at` 둘뿐이고 다른 걸 붙이면 400 이다.
 * `price_at` 은 **오프셋이 붙은 ISO** 여야 한다 — `datetime-local` 원문("2026-08-18T14:00")을
 * 그대로 보내면 서버가 naive datetime 으로 파싱해 500 이 난다(`localInputToISO` 를 거칠 것).
 */
export const previewPriceData = (params = {}) =>
  wrap(
    () => api.get("/security-price-data/preview/", params),
    () => ({ high_price: null, low_price: null, price_source: null })
  );

// ── 계획 5계층 ────────────────────────────────────
export const listAnnualPlans = (params = {}) =>
  wrap(() => api.get("/annual-plan/", { no_page: 1, ...params }), () => mock.annualPlans);
export const annualPlan = crud("annual-plan");

export const listQuarterlyPlans = (params = {}) =>
  wrap(() => api.get("/quarterly-plan/", { no_page: 1, ...params }), () => mock.quarterlyPlans);
export const quarterlyPlan = crud("quarterly-plan");

export const listMonthlyPlans = (params = {}) =>
  wrap(() => api.get("/monthly-plan/", { no_page: 1, ...params }), () => mock.monthlyPlans);
export const monthlyPlan = crud("monthly-plan");

export const listWeeklyPlans = (params = {}) =>
  wrap(() => api.get("/weekly-plan/", { no_page: 1, ...params }), () => mock.weeklyPlans);
export const weeklyPlan = crud("weekly-plan");

export const listWeeklySecurityPlans = (params = {}) =>
  wrap(
    () => api.get("/weekly-security-plan/", { no_page: 1, ...params }),
    () => mock.weeklySecurityPlans || []
  );
export const weeklySecurityPlan = crud("weekly-security-plan");

export const listDailyPlans = (params = {}) =>
  wrap(() => api.get("/daily-plan/", { no_page: 1, ...params }), () => mock.dailyPlans);
export const dailyPlan = crud("daily-plan");

// ── 원칙 ──────────────────────────────────────────
/**
 * 필수원칙. `period_type` 으로 좁히면 그 계층에서 꺼내 볼 원칙만 온다
 * (`?period_type=DAY` → 이행 체크리스트, `MONTH` → 월계획 화면 등).
 * 적용기간을 하나도 안 켠 원칙은 어느 쪽으로 좁혀도 안 나온다.
 */
export const listMandatoryPrinciples = (params = {}) =>
  wrap(
    () => api.get("/mandatory-principle/", { no_page: 1, ...params }),
    // 목 모드에서 계층별로 좁힐 방법이 없다. 좁힌 조회는 빈 목록으로 둔다 —
    // 가짜 원칙을 체크리스트에 띄우면 있지도 않은 점검을 하게 된다.
    () => (params.period_type ? [] : mock.mandatoryPrinciples)
  );
export const mandatoryPrinciple = crud("mandatory-principle");

export const listPrincipleSources = () =>
  wrap(() => api.get("/principle-source/", { no_page: 1 }), () => mock.principleSources);
export const principleSource = crud("principle-source");

export const listInvestmentPrinciples = (params = {}) =>
  wrap(
    () => api.get("/investment-principle/", { no_page: 1, ...params }),
    () => mock.investmentPrinciples
  );
export const investmentPrinciple = crud("investment-principle");

export const listQuarterlyPrinciples = (params = {}) =>
  wrap(
    () => api.get("/quarterly-principle/", { no_page: 1, ...params }),
    () => mock.quarterlyPrinciples
  );
export const quarterlyPrinciple = crud("quarterly-principle");

export const listMonthlyPrinciples = (params = {}) =>
  wrap(
    () => api.get("/monthly-principle/", { no_page: 1, ...params }),
    () => mock.monthlyPrinciples
  );
export const monthlyPrinciple = crud("monthly-principle");

// ── 시장 — 시장방향 → 뉴스 → 종목 ─────────────────
export const listMarketDirections = (params = {}) =>
  wrap(() => api.get("/market-direction/", { no_page: 1, ...params }), () => mock.marketDirections);
export const marketDirection = crud("market-direction");

export const listNews = (params = {}) =>
  wrap(() => api.get("/news/", { no_page: 1, ...params }), () => mock.news || []);
export const news = crud("news");

export const affectedSecurity = crud("affected-security");

// ── 전략 ──────────────────────────────────────────
export const listTradingStrategies = (params = {}) =>
  wrap(() => api.get("/trading-strategy/", { no_page: 1, ...params }), () => mock.strategies);
export const getTradingStrategy = (id) =>
  wrap(() => api.get(`/trading-strategy/${id}/`), () => mock.strategyDetail);
export const tradingStrategy = crud("trading-strategy");

export const strategyMethod = crud("trading-strategy-method");

// ── 이행 · 성과 ───────────────────────────────────
export const listOrders = (params = {}) =>
  wrap(() => api.get("/order/", params), () => mock.orders);
export const order = crud("order");

export const listPerformanceRecords = (params = {}) =>
  wrap(() => api.get("/performance-record/", params), () => mock.performanceRecords);
export const performanceRecord = crud("performance-record");

// ── 시세 (market_data) ────────────────────────────
// 전부 읽기 전용이다. 봉과 종목은 수집기가 KIS 에서 받아 쌓는 사실 기록이라 화면이
// 만들거나 고칠 수 없다(POST/PUT/PATCH/DELETE 는 405). 수집 대상을 바꾸는 스위치는
// 종목 화면의 `관리대상`(securities.is_active) 하나뿐이다.
//
// 목 데이터는 빈 배열로 둔다. 백엔드 인계 문서 기준 지금 봉 테이블이 0건이라
// **0건이 기본 상태**고, 목에 가짜 봉을 넣으면 화면이 있지도 않은 시세를 그린다.

// `market-symbol` 조회 래퍼는 두지 않는다. 종목별 시세는 `securities` 응답의 `live` 로
// 같이 오므로 화면이 종목코드로 따로 매칭할 일이 없다 — 창구를 둘로 두면 어긋난다.

/**
 * 일봉. **종목 지정이 필수다** — `symbol`(종목코드) 또는 `symbol_id` 없이 부르면 400 이다.
 * 종목 없이 전체 봉을 긁는 질의는 수백만 행까지 가서 DB 와 화면이 함께 멈춘다.
 */
export const listDailyCandles = (params = {}) =>
  wrap(() => api.get("/market-daily-candle/", { no_page: 1, ...params }), () => []);

/**
 * 분봉. 일봉과 같이 종목 지정이 필수다.
 * `date` 필터는 KST 기준이고, 응답의 `ts` 는 오프셋이 붙어 온다(`…T12:40:00+09:00`).
 * 저장 자체는 UTC 라 표기는 반드시 `clockTime()` 을 거친다 — 문자열을 자르면 안 된다.
 */
export const listMinuteCandles = (params = {}) =>
  wrap(() => api.get("/market-minute-candle/", { no_page: 1, ...params }), () => []);

// ── AI ────────────────────────────────────────────
export const listAiModelRuns = (params = {}) =>
  wrap(() => api.get("/ai-model-run/", params), () => mock.aiModelRuns);

export const listAiFeedback = (params = {}) =>
  wrap(() => api.get("/ai-decision-feedback/", params), () => mock.aiFeedback);
