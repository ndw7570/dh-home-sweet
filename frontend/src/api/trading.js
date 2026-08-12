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
export const listBrokerAccounts = () =>
  wrap(() => api.get("/broker-account/", { no_page: 1 }), () => mock.brokerAccounts);
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
export const listMandatoryPrinciples = () =>
  wrap(() => api.get("/mandatory-principle/", { no_page: 1 }), () => mock.mandatoryPrinciples);
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

// ── 시장 ──────────────────────────────────────────
export const listMarketDirections = (params = {}) =>
  wrap(() => api.get("/market-direction/", { no_page: 1, ...params }), () => mock.marketDirections);
export const marketDirection = crud("market-direction");

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

// ── AI ────────────────────────────────────────────
export const listAiModelRuns = (params = {}) =>
  wrap(() => api.get("/ai-model-run/", params), () => mock.aiModelRuns);

export const listAiFeedback = (params = {}) =>
  wrap(() => api.get("/ai-decision-feedback/", params), () => mock.aiFeedback);
