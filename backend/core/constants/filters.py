"""검색 파라미터 화이트리스트.

BaseCommonViewSet 은 여기에 없는 쿼리 파라미터가 들어오면 400 을 던진다
(STRICT_QUERY_PARAMS). 화면에서 쓰는 필터는 반드시 여기에 등록한다.

키는 프론트가 보내는 이름, 값은 ORM 룩업이다.
"""

# strict 검사에서 제외할 공통 쿼리 파라미터
EXCLUDE_FROM_STRICT_CHECK = {
    "page",
    "no_page",
    "page_size",
    "ordering",
    "cursor",
    "soft_delete_mode",
    "search",
}

# ─────────────────────────────────────────────
#  users
# ─────────────────────────────────────────────
PERSON_FILTER_FIELDS = {
    "user_id": "user_id__exact",
    "region": "region__icontains",
    "name": "last_name__icontains",
}

# ─────────────────────────────────────────────
#  portfolio — 계좌 · 종목 · 담보대출 · 가격
# ─────────────────────────────────────────────
BROKER_ACCOUNT_FILTER_FIELDS = {
    "broker_name": "broker_name__icontains",
}

SECURITY_FILTER_FIELDS = {
    "account_id": "account_id__exact",
    "market": "market__exact",
    "symbol": "symbol__icontains",
    "name": "name__icontains",
    "asset_type": "asset_type__exact",
    "currency": "currency__exact",
    "sector": "sector__icontains",
    "is_active": "is_active__exact",
    # 예전에 있던 `held` (holding_quantity 컬럼 기반) 는 뺐다 — 보유수량이 이제
    # 체결 이행에서 집계되어 컬럼 필터로는 못 잡는다. 필요하면 아나테이션 필터를 새로 넣는다.
}

SECURITIES_LOAN_FILTER_FIELDS = {
    "security_id": "security_id__exact",
    "maturity_from": "maturity_at__gte",
    "maturity_to": "maturity_at__lte",
    "ratio_below": "collateral_ratio__lte",  # 담보비율 경고선
}

DAILY_SECURITY_PRICE_DATA_FILTER_FIELDS = {
    "security_id": "security_id__exact",
    "price_from": "price_at__gte",
    "price_to": "price_at__lte",
}

# ─────────────────────────────────────────────
#  planning — 연 → 분기 → 월 → 주 → 일
# ─────────────────────────────────────────────
ANNUAL_PLAN_FILTER_FIELDS = {
    "account_id": "account_id__exact",
    "market": "market__exact",
    "direction": "direction__exact",
    "status": "status__exact",
    "valid_from": "valid_from__gte",
    "valid_to": "valid_until__lte",
    "active_on": "valid_from__lte",  # 특정일에 살아 있던 계획
}

QUARTERLY_PLAN_FILTER_FIELDS = {
    "annual_plan_id": "annual_plan_id__exact",
    "direction": "direction__exact",
    "valid_from": "valid_from__gte",
    "valid_to": "valid_until__lte",
}

MONTHLY_PLAN_FILTER_FIELDS = {
    "quarterly_plan_id": "quarterly_plan_id__exact",
    "scenario_planning": "scenario_planning__exact",
    "predicted_trend": "predicted_trend__exact",
    "confidence_min": "confidence_score__gte",
    "valid_from": "valid_from__gte",
    "valid_to": "valid_until__lte",
}

WEEKLY_PLAN_FILTER_FIELDS = {
    "monthly_plan_id": "monthly_plan_id__exact",
    "scenario_planning": "scenario_planning__exact",
    "predicted_trend": "predicted_trend__exact",
    "confidence_min": "confidence_score__gte",
    "valid_from": "valid_from__gte",
    "valid_to": "valid_until__lte",
}

WEEKLY_SECURITY_PLAN_FILTER_FIELDS = {
    "weekly_plan_id": "weekly_plan_id__exact",
    "security_id": "security_id__exact",
    "scenario_planning": "scenario_planning__exact",
    "predicted_trend": "predicted_trend__exact",
    "confidence_min": "confidence_score__gte",
}

DAILY_PLAN_FILTER_FIELDS = {
    "weekly_security_plan_id": "weekly_security_plan_id__exact",
    "scenario_planning": "scenario_planning__exact",
    "predicted_trend": "predicted_trend__exact",
    "valid_from": "valid_from__gte",
    "valid_to": "valid_until__lte",
}

# ─────────────────────────────────────────────
#  principle
# ─────────────────────────────────────────────
MANDATORY_PRINCIPLE_FILTER_FIELDS = {
    "priority_max": "priority__lte",
    "content": "content__icontains",
    # 계획·이행 화면이 "이 계층에 걸린 원칙" 을 뽑을 때 쓴다.
    #   ?period_type=DAY    → 이행 화면 체크리스트에 띄울 원칙
    #   ?period_type=MONTH  → 월계획 작성 화면에 보여 줄 원칙
    # scopes 에는 소프트딜리트가 없어서 조인 필터가 그대로 안전하다.
    "period_type": "scopes__period_type__exact",
    "period_type_in": "scopes__period_type__in",
}

PRINCIPLE_SOURCE_FILTER_FIELDS = {
    "source_type": "source_type__exact",
    "name": "name__icontains",
}

INVESTMENT_PRINCIPLE_FILTER_FIELDS = {
    "source_id": "source_id__exact",
    "teacher_name": "teacher_name__icontains",
    "principle_type": "principle_type__exact",
    "content": "content__icontains",
}

QUARTERLY_PRINCIPLE_FILTER_FIELDS = {
    "quarterly_plan_id": "quarterly_plan_id__exact",
    "security_id": "security_id__exact",
    "valuation_type": "valuation_type__exact",
    "per_below": "per__lte",
    "roe_above": "roe__gte",
}

MONTHLY_PRINCIPLE_FILTER_FIELDS = {
    "monthly_plan_id": "monthly_plan_id__exact",
    "security_id": "security_id__exact",
    "direction": "direction__exact",
}

# ─────────────────────────────────────────────
#  market
# ─────────────────────────────────────────────
MARKET_DIRECTION_FILTER_FIELDS = {
    "direction": "direction__exact",
    "factor_type": "factor_type__exact",
    "content": "content__icontains",
    "date_from": "created_at__gte",
    "date_to": "created_at__lte",
}

NEWS_FILTER_FIELDS = {
    "market_direction_id": "market_direction_id__exact",
    "direction": "direction__exact",
    "factor_type": "factor_type__exact",
    "content": "content__icontains",
    # 기사가 난 날(created_at) 로 좁힌다.
    "date_from": "created_at__gte",
    "date_to": "created_at__lte",
    # 예상 영향 구간으로 좁힌다 — 기사가 난 날과 영향이 먹히는 구간은 다르다.
    #   impact_on      그날이 영향 구간 안인 뉴스 (가장 자주 쓰는 질문)
    #   impact_from/to 영향 구간이 이 범위와 겹치는 뉴스
    "impact_on": ("expected_impact_from__lte", "expected_impact_until__gte"),
    "impact_from": "expected_impact_until__gte",
    "impact_to": "expected_impact_from__lte",
    "impact_undecided": "expected_impact_from__isnull",
}

AFFECTED_SECURITY_FILTER_FIELDS = {
    "news_id": "news_id__exact",
    # 종목이 시장방향에 닿는 길이 뉴스를 거치게 바뀌었다 — 두 단을 타고 올라간다.
    "market_direction_id": "news__market_direction_id__exact",
    "security_id": "security_id__exact",
}

# ─────────────────────────────────────────────
#  strategy
# ─────────────────────────────────────────────
# 2026-08-18 계층을 뒤집었다. 방법이 상위(가격데이터·정책명), 전략이 n차 줄이다.
TRADING_STRATEGY_METHOD_FILTER_FIELDS = {
    "price_data_id": "price_data_id__exact",
    "policy_name": "policy_name__icontains",
    "sector": "sector__icontains",
    "reference_from": "reference_at__gte",
    "reference_to": "reference_at__lte",
}

TRADING_STRATEGY_FILTER_FIELDS = {
    "method_id": "method_id__exact",
    "strategy_type": "strategy_type__exact",
    "sector": "sector__icontains",
}

# ─────────────────────────────────────────────
#  execution
# ─────────────────────────────────────────────
ORDER_FILTER_FIELDS = {
    "security_id": "security_id__exact",
    "action_type": "action_type__exact",
    "action_type_in": "action_type__in",
    "order_type": "order_type__exact",
    "side": "side__exact",
    "executed_from": "executed_at__gte",
    "executed_to": "executed_at__lte",
    "created_from": "created_at__gte",
    "created_to": "created_at__lte",
}

PERFORMANCE_RECORD_FILTER_FIELDS = {
    "security_id": "security_id__exact",
    "period_type": "period_type__exact",
    "period_from": "period_start__gte",
    "period_to": "period_end__lte",
}

# ─────────────────────────────────────────────
#  ai
# ─────────────────────────────────────────────
AI_MODEL_RUN_FILTER_FIELDS = {
    "model_name": "model_name__icontains",
    "model_version": "model_version__exact",
    "prompt_version": "prompt_version__exact",
    "status": "status__exact",
    "started_from": "started_at__gte",
    "started_to": "started_at__lte",
}

AI_DECISION_FEEDBACK_FILTER_FIELDS = {
    "model_id": "model_id__exact",
    "opinion_type": "opinion_type__exact",
    "table_name": "table_name__exact",
    "object_id": "object_id__exact",
    "valid_after": "valid_until__gte",  # ?valid_after=오늘 → 아직 유효한 의견만
}

# existence(존재유무) 전용 필터 — 아직 쓰는 화면이 없다.
EXISTENCE_FILTER_FIELDS: dict = {}


# ─────────────────────────────────────────────
#  market_data — 시세 (KIS 수집분)
# ─────────────────────────────────────────────
# 봉 조회는 거의 항상 "이 종목의 이 구간" 이다. 종목 지정 없이 전체 봉을 긁는 질의는
# 화면에서 쓸 일이 없고 양만 크므로, 뷰셋이 종목 미지정 목록 조회를 막는다.
MARKET_SYMBOL_FILTER_FIELDS = {
    "symbol": "symbol__exact",
    "symbol_in": "symbol__in",
    "market": "market__exact",
    "name": "name__icontains",
}

DAILY_CANDLE_FILTER_FIELDS = {
    "symbol_id": "symbol_id__exact",
    "symbol": "symbol__symbol__exact",
    "date_from": "date__gte",
    "date_to": "date__lte",
}

MINUTE_CANDLE_FILTER_FIELDS = {
    "symbol_id": "symbol_id__exact",
    "symbol": "symbol__symbol__exact",
    # ts 는 UTC 로 저장되지만 이 lookup 은 TIME_ZONE(Asia/Seoul) 기준으로 날짜를 뽑는다.
    # 화면이 "8월 18일 분봉" 을 물으면 KST 기준 그날이 맞다.
    "date": "ts__date",
    "ts_from": "ts__gte",
    "ts_to": "ts__lte",
}
