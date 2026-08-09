"""
core/settings.py 에 반영할 변경분만 모아 둔 메모.
(settings.py 자체는 namssi-jikjehak 것을 그대로 가져오고, 아래 4곳만 바꾼다.)
"""

# 1) INSTALLED_APPS — lineage_management 를 asset_planning 으로 교체
INSTALLED_APPS_DIFF = """
-    "lineage_management.apps.AppsConfig",
+    "asset_planning.apps.AssetPlanningConfig",
"""

# 2) 커스텀 유저 모델 — UserProfile 이 users 앱으로 이동했으므로 명시 필요
AUTH_USER_MODEL = "users.UserProfile"

# 3) SIMPLE_JWT — UserProfile PK 가 user_id 인 것은 동일
SIMPLE_JWT_DIFF = """
    "USER_ID_FIELD": "user_id",
    "USER_ID_CLAIM": "user_id",
"""

# 4) DB 스키마 — 모델 db_table 이 '"planner"."xxx"' 이므로 스키마를 먼저 만들어야 한다.
#    psql> CREATE SCHEMA IF NOT EXISTS planner;
#    (DDL 을 직접 작성한다면 이 CREATE SCHEMA 를 DDL 맨 앞에 넣어 두면 된다.)
DB_SCHEMA = "planner"
