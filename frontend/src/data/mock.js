// 백엔드 없이 화면을 띄우기 위한 목데이터.
// 각 객체의 모양은 backend/asset_planning/services/*.py 의 반환 계약과 1:1로 맞춰 두었다.
// DDL 확정 후 서비스가 실제 값을 채우면 이 파일은 지우면 된다.

const monthly = (start, values) =>
  values.map((value, i) => {
    const d = new Date(start);
    d.setMonth(d.getMonth() + i);
    return { date: d.toISOString().slice(0, 10), value };
  });

export const timeline = {
  today: "2026-08-01",
  actual: monthly("2026-01-01", [
    71200000, 72900000, 71600000, 76800000, 75400000, 80100000, 82000000, 84320000,
  ]),
  past_projections: [
    {
      projected_on: "2026-04-01",
      points: monthly("2026-04-01", [76800000, 79500000, 82400000, 85300000, 88300000]),
    },
  ],
  scenarios: [
    {
      type: "OPTIMISTIC",
      label: "낙관",
      points: monthly("2026-08-01", [84320000, 87400000, 90600000, 94000000, 98500000]),
    },
    {
      type: "BASE",
      label: "기준",
      points: monthly("2026-08-01", [84320000, 86500000, 88700000, 91000000, 93400000]),
    },
    {
      type: "CONSERVATIVE",
      label: "보수",
      points: monthly("2026-08-01", [84320000, 85200000, 86100000, 87000000, 88000000]),
    },
  ],
  journal_marks: [
    { date: "2026-02-14", entry_id: 3, decision_type: "BUY" },
    { date: "2026-04-21", entry_id: 7, decision_type: "REBALANCE" },
    { date: "2026-06-30", entry_id: 11, decision_type: "CASH" },
  ],
};

export const homeSummary = {
  net_worth: 84320000,
  plan_gap_amount: 2020000,
  projection: { target_date: "2026-12-01", value: 98500000, vs_last_projection_rate: 0.03 },
  unjournaled: { total: 3, missing: 2 },
  pending_review: { review_id: 12, period_label: "7월", status: "READY" },
  hit_rate: 0.71,
};

export const plans = [
  {
    plan_id: 1,
    title: "2026 하반기 계획",
    period_type: "MONTH",
    start_date: "2026-07-01",
    end_date: "2026-12-31",
    target_net_worth: 95000000,
    monthly_contribution: 1500000,
    status: "ACTIVE",
  },
];

export const scenarios = [
  {
    scenario_id: 1,
    plan_id: 1,
    scenario_type: "OPTIMISTIC",
    label: "낙관",
    expected_return_rate: 0.12,
    contribution_amount: 1800000,
    is_primary: false,
  },
  {
    scenario_id: 2,
    plan_id: 1,
    scenario_type: "BASE",
    label: "기준",
    expected_return_rate: 0.07,
    contribution_amount: 1500000,
    is_primary: true,
  },
  {
    scenario_id: 3,
    plan_id: 1,
    scenario_type: "CONSERVATIVE",
    label: "보수",
    expected_return_rate: 0.03,
    contribution_amount: 1200000,
    is_primary: false,
  },
];

export const journalTags = [
  { tag_id: 1, name: "밸류에이션", category: "VALUATION" },
  { tag_id: 2, name: "모멘텀", category: "MOMENTUM" },
  { tag_id: 3, name: "매크로", category: "MACRO" },
  { tag_id: 4, name: "뉴스", category: "NEWS" },
  { tag_id: 5, name: "계획대로", category: "PLAN" },
];

export const journalEntries = [
  {
    entry_id: 11,
    entry_date: "2026-07-28",
    title: "삼성전자 추가 매수",
    decision_type: "BUY",
    symbol: "005930",
    conviction_level: 4,
    tag_ids: [1],
    is_reviewed: false,
  },
  {
    entry_id: 10,
    entry_date: "2026-07-24",
    title: "현금 비중 상향",
    decision_type: "CASH",
    symbol: null,
    conviction_level: null,
    tag_ids: [],
    is_reviewed: false,
  },
  {
    entry_id: 9,
    entry_date: "2026-07-21",
    title: "분기 리밸런싱 실행",
    decision_type: "REBALANCE",
    symbol: null,
    conviction_level: 3,
    tag_ids: [5],
    is_reviewed: true,
  },
];

export const reviews = [
  {
    review_id: 12,
    period_type: "MONTH",
    period_start: "2026-07-01",
    period_end: "2026-07-31",
    planned_value: 82300000,
    actual_value: 84320000,
    gap_amount: 2020000,
    cause_note: "",
    adjustment_note: "",
    status: "READY",
  },
];

export const reviewDigest = {
  gap: { planned: 82300000, actual: 84320000, amount: 2020000, rate: 0.0245 },
  tag_performance: [
    { tag_id: 1, name: "밸류에이션", entry_count: 4, avg_conviction: 3.8 },
    { tag_id: 5, name: "계획대로", entry_count: 2, avg_conviction: 3.0 },
  ],
  unjournaled_transactions: [
    { transaction_id: 88, traded_at: "2026-07-24", trade_type: "SELL", symbol: "352820" },
    { transaction_id: 91, traded_at: "2026-07-29", trade_type: "BUY", symbol: "005380" },
  ],
};

export const accounts = [
  { account_id: 1, name: "주식계좌", account_type: "SECURITIES", institution: "미래에셋" },
  { account_id: 2, name: "생활비", account_type: "BANK", institution: "카카오뱅크" },
];

export const holdings = [
  {
    holding_id: 1,
    account_id: 1,
    symbol: "005930",
    name: "삼성전자",
    asset_class: "STOCK",
    quantity: 210,
    avg_price: 71200,
  },
  {
    holding_id: 2,
    account_id: 1,
    symbol: "360750",
    name: "TIGER 미국S&P500",
    asset_class: "ETF",
    quantity: 480,
    avg_price: 19240,
  },
];

export const transactions = [
  {
    transaction_id: 91,
    traded_at: "2026-07-29",
    trade_type: "BUY",
    amount: 3120000,
    entry_id: null,
  },
  {
    transaction_id: 90,
    traded_at: "2026-07-28",
    trade_type: "BUY",
    amount: 1480000,
    entry_id: 11,
  },
  {
    transaction_id: 88,
    traded_at: "2026-07-24",
    trade_type: "SELL",
    amount: 2400000,
    entry_id: null,
  },
];

export const snapshots = timeline.actual.map((p, i) => ({
  snapshot_id: i + 1,
  snapshot_date: p.date,
  net_worth: p.value,
}));
