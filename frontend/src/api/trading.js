// trading_discipline API. success_response 는 client 가 벗기므로 반환값은 순수 데이터.
//
// VITE_USE_MOCK=1 이면 백엔드 없이 src/data/mock.js 로 화면이 뜬다.
// 백엔드를 붙이면 .env.development 의 VITE_USE_MOCK 만 지우면 된다.
import { api } from "./client";
import * as mock from "../data/mock";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "1";
const wrap = (real, fake) => (USE_MOCK ? Promise.resolve(fake()) : real());

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

export const fetchChoices = () =>
  wrap(() => api.get("/meta/choices/"), () => mock.choices);

// ── 계좌 · 종목 ───────────────────────────────────
export const listBrokerAccounts = () =>
  wrap(() => api.get("/broker-account/", { no_page: 1 }), () => mock.brokerAccounts);

export const listSecurities = (params = {}) =>
  wrap(() => api.get("/security/", { no_page: 1, ...params }), () => mock.securities);
export const createSecurity = (body) => api.post("/security/", body);
export const updateSecurity = (id, body) => api.patch(`/security/${id}/`, body);

export const listSecuritiesLoans = (params = {}) =>
  wrap(() => api.get("/securities-loan/", { no_page: 1, ...params }), () => mock.loans);

export const listPriceData = (params = {}) =>
  wrap(() => api.get("/security-price-data/", params), () => mock.priceData);

// ── 계획 5계층 ────────────────────────────────────
export const listAnnualPlans = (params = {}) =>
  wrap(() => api.get("/annual-plan/", params), () => mock.annualPlans);
export const createAnnualPlan = (body) => api.post("/annual-plan/", body);
export const updateAnnualPlan = (id, body) => api.patch(`/annual-plan/${id}/`, body);

export const getQuarterlyPlan = (id) => api.get(`/quarterly-plan/${id}/`);
export const listQuarterlyPlans = (params = {}) =>
  wrap(() => api.get("/quarterly-plan/", params), () => mock.quarterlyPlans);
export const updateQuarterlyPlan = (id, body) => api.patch(`/quarterly-plan/${id}/`, body);

export const listMonthlyPlans = (params = {}) =>
  wrap(() => api.get("/monthly-plan/", params), () => mock.monthlyPlans);
export const updateMonthlyPlan = (id, body) => api.patch(`/monthly-plan/${id}/`, body);

export const listWeeklyPlans = (params = {}) =>
  wrap(() => api.get("/weekly-plan/", params), () => mock.weeklyPlans);
export const createWeeklyPlan = (body) => api.post("/weekly-plan/", body);
export const updateWeeklyPlan = (id, body) => api.patch(`/weekly-plan/${id}/`, body);

export const listDailyPlans = (params = {}) =>
  wrap(() => api.get("/daily-plan/", params), () => mock.dailyPlans);
export const createDailyPlan = (body) => api.post("/daily-plan/", body);

// ── 원칙 ──────────────────────────────────────────
export const listMandatoryPrinciples = () =>
  wrap(() => api.get("/mandatory-principle/", { no_page: 1 }), () => mock.mandatoryPrinciples);
export const createMandatoryPrinciple = (body) => api.post("/mandatory-principle/", body);
export const updateMandatoryPrinciple = (id, body) =>
  api.patch(`/mandatory-principle/${id}/`, body);
export const deleteMandatoryPrinciple = (id) => api.del(`/mandatory-principle/${id}/`);

export const listPrincipleSources = () =>
  wrap(() => api.get("/principle-source/", { no_page: 1 }), () => mock.principleSources);

export const listInvestmentPrinciples = (params = {}) =>
  wrap(
    () => api.get("/investment-principle/", { no_page: 1, ...params }),
    () => mock.investmentPrinciples
  );
export const createInvestmentPrinciple = (body) => api.post("/investment-principle/", body);

export const listQuarterlyPrinciples = (params = {}) =>
  wrap(() => api.get("/quarterly-principle/", params), () => mock.quarterlyPrinciples);

export const listMonthlyPrinciples = (params = {}) =>
  wrap(() => api.get("/monthly-principle/", params), () => mock.monthlyPrinciples);
export const createMonthlyPrinciple = (body) => api.post("/monthly-principle/", body);

// ── 시장 ──────────────────────────────────────────
export const listMarketDirections = (params = {}) =>
  wrap(() => api.get("/market-direction/", params), () => mock.marketDirections);
export const createMarketDirection = (body) => api.post("/market-direction/", body);

// ── 전략 ──────────────────────────────────────────
export const listTradingStrategies = (params = {}) =>
  wrap(() => api.get("/trading-strategy/", params), () => mock.strategies);
export const getTradingStrategy = (id) =>
  wrap(() => api.get(`/trading-strategy/${id}/`), () => mock.strategyDetail);
export const createStrategyMethod = (body) => api.post("/trading-strategy-method/", body);

// ── 이행 · 성과 ───────────────────────────────────
export const listOrders = (params = {}) =>
  wrap(() => api.get("/order/", params), () => mock.orders);
export const createOrder = (body) => api.post("/order/", body);

export const listPerformanceRecords = (params = {}) =>
  wrap(() => api.get("/performance-record/", params), () => mock.performanceRecords);

// ── AI ────────────────────────────────────────────
export const listAiModelRuns = (params = {}) =>
  wrap(() => api.get("/ai-model-run/", params), () => mock.aiModelRuns);

export const listAiFeedback = (params = {}) =>
  wrap(() => api.get("/ai-decision-feedback/", params), () => mock.aiFeedback);
