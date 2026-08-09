# backend

namssi-jikjehak 의 `core/` 패키지(소프트딜리트 · success_response · 페이지네이션 ·
strict 쿼리검증)를 **그대로 재사용**한다. 아래 파일만 이 저장소 것으로 교체/추가한다.

| 파일 | 상태 |
|---|---|
| `core/models/common.py` | 그대로 복사 |
| `core/views/common.py` | 그대로 복사 |
| `core/views/response.py` | 그대로 복사 |
| `core/pagination.py`, `core/mixins/*` | 그대로 복사 |
| `core/serializers/soft_exclusion.py` | 그대로 복사 |
| `core/constants/filters.py` | **이 저장소 것으로 교체** (planner 도메인 필터) |
| `core/urls.py` | **이 저장소 것으로 교체** (`/api/planner`) |
| `core/settings.py` | 복사 후 `settings_planner_patch.py` 의 4곳 반영 |
| `users/` | 신규 (UserProfile 을 users 앱으로 분리) |
| `asset_planning/` | 신규 도메인 앱 |

## 실행 순서

```bash
psql -c "CREATE SCHEMA IF NOT EXISTS planner;"
pip install -r requirements.txt
python manage.py migrate            # ← DDL 확정 후에 실행
python manage.py runserver 0.0.0.0:8000
```

`makemigrations` 는 **DDL 을 받은 뒤에** 돌린다. 지금 모델은 화면이 요구하는
최소 컬럼만 잡아 둔 상태이고, 각 모델의 `# DDL 확정 후 추가 컬럼은 이 아래에 붙인다.`
주석 자리에 실제 컬럼을 채워 넣는 것을 전제로 한다.
