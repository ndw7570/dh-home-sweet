"""검색 파라미터 화이트리스트.

BaseCommonViewSet 은 FILTER_FIELDS 에 없는 쿼리 파라미터가 들어오면
400 을 던진다(STRICT_QUERY_PARAMS). 화면에서 쓰는 필터는 반드시 여기에 등록한다.
"""

# strict 검사에서 제외할 공통 쿼리 파라미터
EXCLUDE_FROM_STRICT_CHECK = {
    "page",
    "no_page",
    "page_size",
    "ordering",
    "cursor",
    "soft_delete_mode",
    "year",
    "month",
    "summary",
    "mode",
}

# existence(존재유무) 전용 필터
EXISTENCE_FILTER_FIELDS = {}

# ─────────────────────────────────────────────
#  portfolio 도메인
# ─────────────────────────────────────────────
ACCOUNT_FILTER_FIELDS = {
    "user_id": "user_id__exact",
    "account_type": "account_type__exact",
    "is_active": "is_active__exact",
}

HOLDING_FILTER_FIELDS = {
    "account_id": "account_id__exact",
    "symbol": "symbol__icontains",
    "asset_class": "asset_class__exact",
}

TRANSACTION_FILTER_FIELDS = {
    "account_id": "account_id__exact",
    "holding_id": "holding_id__exact",
    "entry_id": "journal_entry_id__exact",
    "trade_type": "trade_type__exact",
    "traded_from": "traded_at__gte",
    "traded_to": "traded_at__lte",
}

ASSET_SNAPSHOT_FILTER_FIELDS = {
    "user_id": "user_id__exact",
    "date_from": "snapshot_date__gte",
    "date_to": "snapshot_date__lte",
}

# ─────────────────────────────────────────────
#  planning 도메인
# ─────────────────────────────────────────────
PLAN_FILTER_FIELDS = {
    "user_id": "user_id__exact",
    "status": "status__exact",
    "period_type": "period_type__exact",
}

SCENARIO_FILTER_FIELDS = {
    "plan_id": "plan_id__exact",
    "scenario_type": "scenario_type__exact",
    "is_primary": "is_primary__exact",
}

PROJECTION_SNAPSHOT_FILTER_FIELDS = {
    "scenario_id": "scenario_id__exact",
    "projected_from": "projected_on__gte",
    "projected_to": "projected_on__lte",
    "target_from": "target_date__gte",
    "target_to": "target_date__lte",
    "is_settled": "is_settled__exact",
}

# ─────────────────────────────────────────────
#  journal 도메인
# ─────────────────────────────────────────────
JOURNAL_TAG_FILTER_FIELDS = {
    "user_id": "user_id__exact",
    "category": "category__exact",
}

JOURNAL_ENTRY_FILTER_FIELDS = {
    "user_id": "user_id__exact",
    "decision_type": "decision_type__exact",
    "symbol": "symbol__icontains",
    "tag_id": "tags__tag_id__in",
    "date_from": "entry_date__gte",
    "date_to": "entry_date__lte",
    "is_reviewed": "is_reviewed__exact",
}

REVIEW_FILTER_FIELDS = {
    "user_id": "user_id__exact",
    "plan_id": "plan_id__exact",
    "status": "status__exact",
    "period_type": "period_type__exact",
}
