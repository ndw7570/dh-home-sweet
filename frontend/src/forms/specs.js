/**
 * 폼 필드 스펙 — investments-nam.sql 의 컬럼과 1:1.
 *
 * 필수(`required`) 표시는 **DDL 의 NOT NULL** 을 따른다. 여기서 임의로 늘리지 않는다.
 * 다만 서버 시리얼라이저가 추가로 요구하는 것(월투자원칙의 `rationale`,
 * 시장방향의 `rationale`)은 힌트에 이유를 적어 두고 required 로 올렸다.
 * 저장 전에 알 수 있는 것을 저장 후에 알게 하면 폼을 두 번 채우게 된다.
 *
 * `choiceKey` 는 `GET /meta/choices/` 의 키. 라벨은 서버가 준다.
 * `optionsKey` 는 화면이 넘겨 주는 FK 목록의 키.
 *
 * `type`: text | textarea | number | price | ratio | date | datetime
 *       | choice | ref | json | confidence | checkbox
 */

// ─────────────────────────────────────────────
//  계좌 · 종목
// ─────────────────────────────────────────────
export const BROKER_ACCOUNT_FIELDS = [
  { name: "broker_name", label: "증권사명", half: true },
  {
    name: "account_number",
    label: "계좌번호",
    half: true,
    hint: "응답에는 뒤 4자리만 나간다. 목록·로그에 전체 번호가 찍히지 않는다.",
  },
];

export const SECURITY_FIELDS = [
  { name: "account", label: "증권사계좌", type: "ref", optionsKey: "accounts", required: true, half: true },
  { name: "market", label: "시장", type: "choice", choiceKey: "market", required: true, half: true },
  { name: "symbol", label: "종목코드", required: true, half: true, placeholder: "005930" },
  { name: "name", label: "종목명", required: true, half: true },
  { name: "asset_type", label: "자산유형", type: "choice", choiceKey: "asset_type", required: true, half: true },
  { name: "currency", label: "통화", type: "choice", choiceKey: "currency", required: true, half: true, default: "KRW" },
  { name: "sector", label: "업종", half: true },
  { name: "holding_quantity", label: "보유개수", type: "number", half: true },
  {
    name: "current_price",
    label: "현재주가",
    type: "price",
    half: true,
    hint: "시세 연동이 아직 없어 수동으로 넣는다. 평가금액·손익비가 이 값을 쓴다.",
  },
  { name: "is_active", label: "관리대상", type: "checkbox", checkboxLabel: "관리 대상에 포함", default: true, half: true },
  { name: "remarks", label: "비고", type: "textarea", rows: 2 },
];

export const SECURITIES_LOAN_FIELDS = [
  { name: "security", label: "종목", type: "ref", optionsKey: "securities", required: true },
  { name: "principal_amount", label: "대출원금", type: "price", half: true },
  { name: "interest_rate", label: "이자율 (%)", type: "ratio", half: true },
  { name: "opened_at", label: "대출시작일", type: "date", half: true },
  { name: "maturity_at", label: "만기일", type: "date", half: true },
  { name: "quantity", label: "담보수량", type: "number", half: true },
  { name: "reference_price", label: "기준가격", type: "price", half: true },
  { name: "collateral_value", label: "담보평가금액", type: "price", half: true },
  {
    name: "collateral_ratio",
    label: "담보비율 (%)",
    type: "ratio",
    half: true,
    hint: "140% 이하면 홈에 경고로 뜬다. 담보가 무너지면 계획을 지킬 기회 자체가 없어진다.",
  },
  { name: "evaluated_at", label: "평가시각", type: "datetime", half: true },
];

export const PRICE_DATA_FIELDS = [
  { name: "security", label: "종목", type: "ref", optionsKey: "securities", half: true },
  { name: "price_at", label: "시각", type: "datetime", half: true },
  { name: "high_price", label: "고가", type: "price", half: true },
  { name: "low_price", label: "저가", type: "price", half: true },
  { name: "quote_price", label: "호가", type: "price", half: true },
  { name: "remarks", label: "비고", type: "textarea", rows: 2 },
];

// ─────────────────────────────────────────────
//  계획 5계층
// ─────────────────────────────────────────────
export const ANNUAL_PLAN_FIELDS = [
  { name: "account", label: "증권사계좌", type: "ref", optionsKey: "accounts", required: true, half: true },
  { name: "market", label: "시장", type: "choice", choiceKey: "market", required: true, half: true },
  { name: "title", label: "계획명", required: true },
  {
    name: "thesis",
    label: "투자논리",
    type: "textarea",
    rows: 4,
    required: true,
    hint: "아래 네 계층은 전부 이 논리의 분해다. 여기가 흔들리면 하위 계획이 근거를 잃는다.",
  },
  { name: "direction", label: "투자방향", type: "choice", choiceKey: "investment_direction", required: true, half: true },
  { name: "status", label: "계획상태", type: "choice", choiceKey: "plan_status", required: true, default: "DRAFT", half: true },
  { name: "valid_from", label: "유효시작일", type: "date", required: true, half: true },
  { name: "valid_until", label: "유효종료일", type: "date", required: true, half: true },
  { name: "target_return_ratio", label: "목표수익비율 (%)", type: "ratio", half: true },
  { name: "stop_loss_ratio", label: "손절비율 (%)", type: "ratio", half: true },
  { name: "remarks", label: "비고", type: "textarea", rows: 2 },
];

export const QUARTERLY_PLAN_FIELDS = [
  { name: "annual_plan", label: "연계획", type: "ref", optionsKey: "annualPlans" },
  { name: "title", label: "계획명", required: true },
  { name: "direction", label: "투자방향", type: "choice", choiceKey: "investment_direction", required: true, half: true },
  { name: "thesis", label: "투자논리", type: "textarea", rows: 3, required: true },
  { name: "valid_from", label: "유효시작일", type: "date", required: true, half: true },
  { name: "valid_until", label: "유효종료일", type: "date", required: true, half: true },
  {
    name: "buy_strategy",
    label: "매수전략",
    type: "textarea",
    rows: 2,
    hint: "올랐을 때 / 내렸을 때 / 안 움직일 때 / 무너졌을 때 무엇을 할지 지금 적어 둔다. 상황이 오면 이 문장을 읽는다.",
  },
  { name: "sell_strategy", label: "매도전략", type: "textarea", rows: 2 },
  { name: "sideways_strategy", label: "횡보전략", type: "textarea", rows: 2 },
  {
    name: "stop_loss_strategy",
    label: "손절전략",
    type: "textarea",
    rows: 2,
    hint: "비어 있으면 홈의 '빈칸' 카드가 이걸 계속 물고 늘어진다.",
  },
  {
    name: "rebalancing_ratio",
    label: "리벨런싱비율 (JSON)",
    type: "json",
    rows: 4,
    placeholder: '{\n  "005930": 30,\n  "CASH": 70\n}',
    hint: "종목코드 또는 CASH → 비중 %. 합이 100을 넘으면 서버가 막는다.",
  },
  { name: "rebalancing_start_date", label: "리벨런싱시작일", type: "date", half: true },
  { name: "rebalancing_end_date", label: "리벨런싱종료일", type: "date", half: true },
  { name: "target_return_ratio", label: "목표수익비율 (%)", type: "ratio", half: true },
  { name: "stop_loss_ratio", label: "손절비율 (%)", type: "ratio", half: true },
  { name: "remarks", label: "비고", type: "textarea", rows: 2 },
];

export const MONTHLY_PLAN_FIELDS = [
  { name: "quarterly_plan", label: "분기계획", type: "ref", optionsKey: "quarterlyPlans" },
  { name: "title", label: "계획명", required: true },
  {
    name: "scenario_planning",
    label: "시나리오",
    type: "choice",
    choiceKey: "scenario_planning",
    required: true,
    default: "BASE",
    half: true,
    hint: "같은 달에 기본/낙관/비관을 따로 세워 둘 수 있다.",
  },
  { name: "predicted_trend", label: "예상추세", type: "choice", choiceKey: "market_trend", required: true, half: true },
  { name: "thesis", label: "투자논리", type: "textarea", rows: 3, required: true },
  {
    name: "confidence_score",
    label: "계획확신도",
    type: "confidence",
    hint: "남겨 둬야 나중에 '확신했는데 틀린 것'과 '반신반의했는데 맞은 것'을 갈라 볼 수 있다.",
  },
  { name: "valid_from", label: "유효시작일", type: "date", required: true, half: true },
  { name: "valid_until", label: "유효종료일", type: "date", required: true, half: true },
  {
    name: "allocation_ratio",
    label: "벨런싱비율 (JSON)",
    type: "json",
    rows: 4,
    placeholder: '{\n  "005930": 30,\n  "CASH": 70\n}',
  },
  { name: "remarks", label: "비고", type: "textarea", rows: 2 },
];

export const WEEKLY_PLAN_FIELDS = [
  {
    name: "monthly_plan",
    label: "월계획",
    type: "ref",
    optionsKey: "monthlyPlans",
    required: true,
    hint: "주계획은 월계획에 직접 매달린다. DDL 은 NULLABLE 이지만 실질적으로 필수 — 상위 논리 없는 주계획을 만들지 않기 위해서.",
  },
  {
    name: "title",
    label: "계획명",
    required: true,
    hint: "v0.0.3~ 주계획은 기간 그룹만이다. 종목·가격은 아래의 '종목별 주계획' 이 가진다.",
  },
  { name: "scenario_planning", label: "시나리오", type: "choice", choiceKey: "scenario_planning", required: true, default: "BASE", half: true },
  { name: "predicted_trend", label: "예측추세", type: "choice", choiceKey: "market_trend", required: true, half: true },
  { name: "thesis", label: "투자논리", type: "textarea", rows: 3, required: true },
  { name: "confidence_score", label: "계획확신도", type: "confidence" },
  { name: "valid_from", label: "유효시작일", type: "date", required: true, half: true },
  { name: "valid_until", label: "유효종료일", type: "date", required: true, half: true },
  { name: "allocation_ratio", label: "벨런싱비율계획 (JSON)", type: "json", rows: 3 },
  { name: "remarks", label: "비고", type: "textarea", rows: 2 },
];

export const WEEKLY_SECURITY_PLAN_FIELDS = [
  {
    name: "weekly_plan",
    label: "주계획",
    type: "ref",
    optionsKey: "weeklyPlans",
    required: true,
    hint: "어떤 주(기간) 밑에 매달릴지. 유효기간은 주계획에서 상속된다.",
  },
  {
    name: "security",
    label: "종목",
    type: "ref",
    optionsKey: "securities",
    required: true,
  },
  { name: "title", label: "계획명", required: true },
  { name: "scenario_planning", label: "시나리오", type: "choice", choiceKey: "scenario_planning", required: true, default: "BASE", half: true },
  { name: "predicted_trend", label: "예측추세", type: "choice", choiceKey: "market_trend", required: true, half: true },
  { name: "thesis", label: "투자논리", type: "textarea", rows: 3, required: true },
  { name: "confidence_score", label: "계획확신도", type: "confidence" },
  {
    name: "available_amount",
    label: "가용금액",
    type: "price",
    half: true,
    hint: "실제로 돈을 쓰는 단위가 주 단위라 종목별 계획에 있다.",
  },
  { name: "predicted_price", label: "예상가격", type: "price", half: true },
  {
    name: "stop_loss_price",
    label: "손절가격",
    type: "price",
    half: true,
    hint: "상승을 예측하면서 손절가가 예상가보다 높으면 서버가 막는다.",
  },
  { name: "allocation_ratio", label: "벨런싱비율계획 (JSON)", type: "json", rows: 3 },
  { name: "remarks", label: "비고", type: "textarea", rows: 2 },
];

export const DAILY_PLAN_FIELDS = [
  {
    name: "weekly_security_plan",
    label: "주(종목별)계획",
    type: "ref",
    optionsKey: "weeklySecurityPlans",
    hint: "일계획은 종목별 주계획 아래에 매달린다.",
  },
  { name: "title", label: "계획명", required: true },
  { name: "scenario_planning", label: "시나리오", type: "choice", choiceKey: "scenario_planning", required: true, default: "BASE", half: true },
  { name: "predicted_trend", label: "예측추세", type: "choice", choiceKey: "market_trend", required: true, half: true },
  { name: "thesis", label: "투자논리", type: "textarea", rows: 3, required: true },
  { name: "confidence_score", label: "계획확신도", type: "confidence" },
  // 일계획은 하루짜리다 — 시작일과 종료일이 늘 같다. 칸을 둘로 두면 서로 다른 날짜를
  // 넣을 수 있게 되고, 그렇게 만든 '이틀짜리 일계획'은 어느 날의 계획인지 알 수 없다.
  // 그래서 입력은 한 칸으로 받고, 종료일은 저장할 때 같은 값으로 복제한다(mirrorTo).
  {
    name: "valid_from",
    label: "계획일자",
    type: "date",
    required: true,
    mirrorTo: "valid_until",
    hint: "일계획은 하루짜리라 유효종료일도 이 날짜로 저장된다.",
  },
  {
    name: "predicted_price",
    label: "예상가격",
    type: "price",
    half: true,
    hint: "이 종목이 여기까지 갈 것 같다는 전망.",
  },
  {
    name: "target_fill_price",
    label: "목표체결가",
    type: "price",
    half: true,
    hint: "내가 걸겠다는 주문 가격. 전망(예상가격)과 따로 적어야 '전망이 틀린 것'과 '자리를 못 잡은 것'이 갈린다.",
  },
  {
    name: "stop_loss_price",
    label: "손절가격",
    type: "price",
    half: true,
    hint: "변동성 확대 계획의 이행 판정 기준이다 — 이 값이 없으면 판정 불가로 남는다.",
  },
  { name: "allocation_ratio", label: "벨런싱비율계획 (JSON)", type: "json", rows: 3 },
  { name: "remarks", label: "비고", type: "textarea", rows: 2 },
];

// ─────────────────────────────────────────────
//  원칙
// ─────────────────────────────────────────────
export const MANDATORY_PRINCIPLE_FIELDS = [
  {
    name: "priority",
    label: "중요순위",
    type: "number",
    half: true,
    hint: "낮을수록 먼저 읽힌다. 홈 화면 맨 위 순서가 이 값이다.",
  },
  {
    name: "content",
    label: "내용",
    type: "textarea",
    rows: 3,
    required: true,
    hint: "협상 대상이 아닌 것만 여기 넣는다. 지킬 수 없는 문장은 원칙이 아니라 희망이다.",
  },
  { name: "remarks", label: "비고", type: "textarea", rows: 2 },
];

export const PRINCIPLE_SOURCE_FIELDS = [
  { name: "name", label: "소스명", half: true },
  { name: "source_type", label: "소스유형", type: "choice", choiceKey: "source_type", half: true },
  { name: "url", label: "소스URL", type: "textarea", rows: 2 },
  { name: "content", label: "내용", type: "textarea", rows: 3 },
  { name: "remarks", label: "비고", type: "textarea", rows: 2 },
];

export const INVESTMENT_PRINCIPLE_FIELDS = [
  { name: "source", label: "원칙소스", type: "ref", optionsKey: "sources", half: true },
  { name: "teacher_name", label: "가르친 사람", half: true },
  { name: "principle_type", label: "원칙종류", type: "choice", choiceKey: "principle_type", half: true },
  { name: "content", label: "내용", type: "textarea", rows: 3 },
  { name: "rationale", label: "투자근거", type: "textarea", rows: 3 },
  {
    name: "cautions",
    label: "주의사항",
    type: "textarea",
    rows: 3,
    hint: "원칙은 늘 조건부다. 어떤 상황에서 이 원칙이 오히려 해가 되는지를 여기 안 적으면, 나중에 그대로 갖다 쓰다 다친다.",
  },
  { name: "remarks", label: "비고", type: "textarea", rows: 2 },
];

export const MONTHLY_PRINCIPLE_FIELDS = [
  { name: "monthly_plan", label: "월계획", type: "ref", optionsKey: "monthlyPlans", half: true },
  {
    name: "security",
    label: "종목",
    type: "ref",
    optionsKey: "securities",
    half: true,
    hint: "이 행이 월계획을 종목에 잇는다. 이게 없으면 계획 계층이 월에서 끊긴다.",
  },
  { name: "direction", label: "투자방향", type: "choice", choiceKey: "investment_direction", half: true },
  {
    name: "rationale",
    label: "근거",
    type: "textarea",
    rows: 3,
    required: true,
    hint: "근거 없는 목표가는 희망사항이다. 서버가 빈 근거를 막는다.",
  },
  { name: "predicted_price", label: "예상가격", type: "price", half: true },
  { name: "stop_loss_price", label: "손절가격", type: "price", half: true },
  { name: "remarks", label: "비고", type: "textarea", rows: 2 },
];

export const QUARTERLY_PRINCIPLE_FIELDS = [
  { name: "quarterly_plan", label: "분기계획", type: "ref", optionsKey: "quarterlyPlans", half: true },
  { name: "security", label: "종목", type: "ref", optionsKey: "securities", half: true },
  { name: "predicted_price", label: "예상가격", type: "price", half: true },
  { name: "stop_loss_price", label: "손절가격", type: "price", half: true },

  // 성장성
  { name: "revenue", label: "매출액", type: "price", half: true },
  { name: "revenue_growth_rate", label: "매출증가율 (%)", type: "ratio", half: true },
  { name: "new_orders_amount", label: "신규 수주액", type: "price", half: true },
  { name: "order_backlog", label: "수주잔고", type: "price", half: true },

  // 수익성
  { name: "operating_margin", label: "영업이익률 (%)", type: "ratio", half: true },
  { name: "net_income", label: "순이익", type: "price", half: true },
  { name: "roe", label: "ROE (%)", type: "ratio", half: true },
  { name: "roic", label: "ROIC (%)", type: "ratio", half: true },

  // 현금 · 안정성
  { name: "free_cash_flow", label: "잉여현금흐름", type: "price", half: true },
  { name: "cash_conversion_rate", label: "현금전환율 (%)", type: "ratio", half: true },
  { name: "interest_coverage_ratio", label: "이자보상배율", type: "ratio", half: true },

  // 가격
  { name: "per", label: "PER", type: "ratio", half: true },
  { name: "pbr", label: "PBR", type: "ratio", half: true },
  { name: "ev_ebitda", label: "EV/EBITDA", type: "ratio", half: true },
  { name: "psr", label: "PSR", type: "ratio", half: true },
  { name: "fcf_yield", label: "FCF수익률 (%)", type: "ratio", half: true },

  {
    name: "valuation_type",
    label: "기업가치종류",
    type: "choice",
    choiceKey: "valuation_type",
    half: true,
    hint: "지표를 반쯤 채운 채로 판정하면 그 판정도 반쪽이다. 채움 비율이 화면에 같이 뜬다.",
  },
  { name: "performance_summary", label: "실적", type: "textarea", rows: 3 },
];

// ─────────────────────────────────────────────
//  시장
// ─────────────────────────────────────────────
export const MARKET_DIRECTION_FIELDS = [
  { name: "factor_type", label: "요인종류", type: "choice", choiceKey: "factor_type", half: true },
  { name: "direction", label: "방향", type: "choice", choiceKey: "market_trend", half: true },
  {
    name: "factor_value",
    label: "수치",
    type: "ratio",
    half: true,
    hint: "판단 근거가 된 숫자(금리 %, 환율 등). 적어 두면 나중에 그 숫자가 실제로 어떻게 움직였는지와 대조할 수 있다.",
  },
  { name: "content", label: "내용", type: "textarea", rows: 3 },
  {
    name: "rationale",
    label: "투자근거",
    type: "textarea",
    rows: 3,
    required: true,
    hint: "근거 없이 시장 방향만 바꾸는 것은 서버가 막는다.",
  },
  {
    name: "affected_targets",
    label: "영향대상 (JSON)",
    type: "json",
    rows: 4,
    placeholder: '{\n  "sectors": ["반도체"],\n  "indices": ["KOSPI"]\n}',
    hint: "종목이 아닌 대상(섹터·지수·통화). 종목은 뉴스 아래 '영향 종목'으로 따로 건다.",
  },
  { name: "remarks", label: "비고", type: "textarea", rows: 2 },
];

/**
 * 뉴스 — 시장방향과 종목 사이의 한 단.
 * 컬럼이 시장방향과 같은 축인 것은 의도된 것이다. 같은 축으로 적어야 상위 판단과
 * 하위 사실을 나란히 놓고 어긋난 자리를 찾을 수 있다.
 */
export const NEWS_FIELDS = [
  {
    name: "market_direction",
    label: "시장방향",
    type: "ref",
    optionsKey: "directions",
    required: true,
    hint: "이 기사가 어느 시장 판단을 떠받치는지.",
  },
  { name: "factor_type", label: "요인종류", type: "choice", choiceKey: "factor_type", half: true },
  { name: "direction", label: "방향", type: "choice", choiceKey: "market_trend", half: true },
  {
    name: "factor_value",
    label: "수치",
    type: "ratio",
    half: true,
    hint: "기사에 나온 숫자(금리 %, 환율 등).",
  },
  { name: "content", label: "내용", type: "textarea", rows: 3 },
  {
    name: "rationale",
    label: "투자근거",
    type: "textarea",
    rows: 3,
    required: true,
    hint: "이 기사를 왜 판단의 근거로 삼는지. 안 적으면 서버가 막는다.",
  },
  // 기사가 난 날과 영향이 먹히는 구간은 다르다. 금리 결정은 몇 달을 끌고 실적
  // 서프라이즈는 며칠이면 소화된다. 그 추측을 적어 두면 나중에 대조할 수 있다.
  {
    name: "expected_impact_from",
    label: "예상영향시작일",
    type: "date",
    half: true,
    hint: "모르면 비워 둔다. 아는 척 채운 날짜가 빈칸보다 나쁘다.",
  },
  {
    name: "expected_impact_until",
    label: "예상영향종료일",
    type: "date",
    half: true,
    hint: "시작일보다 앞서면 서버가 막는다.",
  },
  {
    name: "affected_targets",
    label: "영향대상 (JSON)",
    type: "json",
    rows: 3,
    placeholder: '{\n  "sectors": ["반도체"]\n}',
    hint: "종목이 아닌 대상. 종목은 '영향 종목'으로 따로 건다.",
  },
  { name: "remarks", label: "비고", type: "textarea", rows: 2 },
];

export const AFFECTED_SECURITY_FIELDS = [
  {
    name: "news",
    label: "뉴스",
    type: "ref",
    optionsKey: "news",
    required: true,
    hint: "종목은 시장방향에 바로 걸리지 않는다 — 어느 기사를 보고 떠올렸는지가 남아야 한다.",
  },
  { name: "security", label: "영향받는 종목", type: "ref", optionsKey: "securities", required: true },
  { name: "remarks", label: "비고", type: "textarea", rows: 2 },
];

// ─────────────────────────────────────────────
//  전략
// ─────────────────────────────────────────────
export const TRADING_STRATEGY_FIELDS = [
  { name: "policy_name", label: "정책명", half: true },
  { name: "sector", label: "업종", half: true },
  {
    name: "price_data",
    label: "기준 가격데이터",
    type: "ref",
    optionsKey: "priceData",
    hint: "'지금 가격'이 아니라 '그때 그 가격' 기준으로 못박아 두는 자리. 나중에 왜 이 가격대에 분할을 걸었는지 되짚을 수 있다.",
  },
  { name: "reference_at", label: "기준시각", type: "datetime", half: true },
  { name: "remarks", label: "비고", type: "textarea", rows: 2 },
];

export const STRATEGY_METHOD_FIELDS = [
  { name: "strategy", label: "전략", type: "ref", optionsKey: "strategies", required: true },
  { name: "strategy_type", label: "전략종류", type: "choice", choiceKey: "strategy_type", half: true },
  { name: "step_no", label: "n차", type: "number", min: 1, half: true },
  {
    name: "price_ratio",
    label: "기준가 대비 (%)",
    type: "ratio",
    half: true,
    hint: "분할매수면 음수(-3 = 3% 하락 시), 분할매도면 양수.",
  },
  {
    name: "quantity_ratio",
    label: "수량 비중 (%)",
    type: "ratio",
    half: true,
    hint: "같은 전략종류 안에서 합이 100%가 되어야 한다. 화면이 합계를 표시한다.",
  },
  { name: "sector", label: "업종", half: true },
  { name: "remarks", label: "비고", type: "textarea", rows: 2 },
];

// ─────────────────────────────────────────────
//  성과
// ─────────────────────────────────────────────
export const PERFORMANCE_RECORD_FIELDS = [
  { name: "security", label: "종목", type: "ref", optionsKey: "securities", half: true },
  { name: "period_type", label: "기간유형", type: "choice", choiceKey: "period_type", half: true },
  { name: "period_start", label: "기간시작일", type: "date", required: true, half: true },
  { name: "period_end", label: "기간종료일", type: "date", required: true, half: true },

  { name: "realized_profit", label: "실현손익", type: "price", half: true },
  { name: "unrealized_profit", label: "평가손익", type: "price", half: true },
  { name: "dividend_income", label: "배당수익", type: "price", half: true },
  { name: "net_profit", label: "순손익", type: "price", half: true },

  {
    name: "interest_cost",
    label: "이자비용",
    type: "price",
    half: true,
    hint: "비용을 항목별로 갈라 둬야 수익률이 낮은 이유가 판단 때문인지 비용 때문인지 구분된다.",
  },
  { name: "commission", label: "수수료", type: "price", half: true },
  { name: "tax", label: "세금", type: "price", half: true },
  { name: "etc_cost", label: "기타비용", type: "price", half: true },

  { name: "return_rate", label: "수익률 (%)", type: "ratio", half: true },
  {
    name: "benchmark_return_rate",
    label: "벤치마크수익률 (%)",
    type: "ratio",
    half: true,
    hint: "이게 없으면 '벌었다'는 알 수 있어도 '시장을 이겼다'는 알 수 없다.",
  },
  { name: "max_drawdown", label: "최대낙폭 (%)", type: "ratio", half: true },
  { name: "remarks", label: "비고", type: "textarea", rows: 2 },
];

// ─────────────────────────────────────────────
//  이행
// ─────────────────────────────────────────────
export const ORDER_FIELDS = [
  { name: "security", label: "종목", type: "ref", optionsKey: "securities", required: true },
  {
    name: "action_type",
    label: "행위종류",
    type: "choice",
    choiceKey: "action_type",
    half: true,
    hint: "계획(PLAN) → 주문(ORDER) → 체결(FILL). PLAN 행은 대조 대상에서 빠진다.",
  },
  { name: "side", label: "매수매도", type: "choice", choiceKey: "order_side", half: true },
  { name: "order_type", label: "주문유형", type: "choice", choiceKey: "order_type", half: true },
  { name: "quantity", label: "수량", type: "number", min: 1, half: true },
  {
    name: "limit_price",
    label: "지정가격",
    type: "price",
    half: true,
    hint: "지정가/역지정지정가 주문에는 필수다. 계획 대비 대조가 이 값을 쓴다.",
  },
  { name: "executed_at", label: "이행시각", type: "datetime", half: true },
  {
    name: "remarks",
    label: "비고",
    type: "textarea",
    rows: 3,
    hint: "계획 밖의 매매라면 왜 그랬는지 여기 적어 둔다. 나중에 그 결정이 좋았는지 갈라 볼 유일한 단서다.",
  },
];
