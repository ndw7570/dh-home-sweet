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
    "held": "holding_quantity__gt",  # ?held=0 → 보유 중인 것만
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
    "security_id": "security_id__exact",
    "scenario_planning": "scenario_planning__exact",
    "predicted_trend": "predicted_trend__exact",
    "confidence_min": "confidence_score__gte",
    "valid_from": "valid_from__gte",
    "valid_to": "valid_until__lte",
}

DAILY_PLAN_FILTER_FIELDS = {
    "weekly_plan_id": "weekly_plan_id__exact",
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

AFFECTED_SECURITY_FILTER_FIELDS = {
    "market_direction_id": "market_direction_id__exact",
    "security_id": "affected_security_id__exact",
}

# ─────────────────────────────────────────────
#  strategy
# ─────────────────────────────────────────────
TRADING_STRATEGY_FILTER_FIELDS = {
    "price_data_id": "price_data_id__exact",
    "policy_name": "policy_name__icontains",
    "sector": "sector__icontains",
    "reference_from": "reference_at__gte",
    "reference_to": "reference_at__lte",
}

TRADING_STRATEGY_METHOD_FILTER_FIELDS = {
    "strategy_id": "strategy_id__exact",
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
