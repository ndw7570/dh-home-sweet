// asset_planning API. success_response 는 client 에서 언랩되므로 반환값은 순수 데이터.
//
// VITE_USE_MOCK=1 이면 백엔드 없이 src/data/mock.js 로 화면을 띄운다.
// DDL 이 확정되면 이 파일은 그대로 두고 mock 플래그만 끄면 된다.
import { api } from "./client";
import * as mock from "../data/mock";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "1";
const wrap = (real, fake) => (USE_MOCK ? Promise.resolve(fake()) : real());

// ── 화면 전용 조회 ──
export const fetchHomeSummary = () => wrap(() => api.get("/home/summary/"), () => mock.homeSummary);
export const fetchTimeline = (params = {}) =>
  wrap(() => api.get("/timeline/", params), () => mock.timeline);
export const fetchReviewDigest = (reviewId) =>
  wrap(() => api.get(`/review/${reviewId}/digest/`), () => mock.reviewDigest);

// ── 계획 / 시나리오 ──
export const listPlans = (params = {}) => wrap(() => api.get("/plan/", params), () => mock.plans);
export const createPlan = (body) => api.post("/plan/", body);
export const updatePlan = (planId, body) => api.patch(`/plan/${planId}/`, body);

export const listScenarios = (planId) =>
  wrap(() => api.get("/scenario/", { plan_id: planId }), () => mock.scenarios);
export const updateScenario = (scenarioId, body) => api.patch(`/scenario/${scenarioId}/`, body);

// ── 일지 ──
export const listJournalEntries = (params = {}) =>
  wrap(() => api.get("/journal-entry/", params), () => mock.journalEntries);
export const createJournalEntry = (body) => api.post("/journal-entry/", body);
export const updateJournalEntry = (entryId, body) => api.patch(`/journal-entry/${entryId}/`, body);
export const listJournalTags = () =>
  wrap(() => api.get("/journal-tag/", { no_page: 1 }), () => mock.journalTags);

// ── 회고 ──
export const listReviews = (params = {}) =>
  wrap(() => api.get("/review/", params), () => mock.reviews);
export const updateReview = (reviewId, body) => api.patch(`/review/${reviewId}/`, body);

// ── 자산 ──
export const listAccounts = () => wrap(() => api.get("/account/", { no_page: 1 }), () => mock.accounts);
export const listHoldings = (accountId) =>
  wrap(() => api.get("/holding/", { account_id: accountId, no_page: 1 }), () => mock.holdings);
export const listTransactions = (params = {}) =>
  wrap(() => api.get("/transaction/", params), () => mock.transactions);
export const listSnapshots = (params = {}) =>
  wrap(() => api.get("/asset-snapshot/", params), () => mock.snapshots);
