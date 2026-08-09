# 스캐폴드 노트

## 1. 무엇을 그대로 가져왔나

namssi-jikjehak 의 백엔드 정책을 골격째 승계했다.

| 정책 | 승계 여부 | 비고 |
|---|---|---|
| 소프트딜리트 (`SoftDeleteModel` / `alive()` 기본) | 그대로 | 모든 도메인 모델이 상속 |
| `success_response` 응답 포맷 | 그대로 | `{success, message, meta, results}` |
| `BaseCommonViewSet` (list/detail serializer 분기, select/prefetch, 기본정렬) | 그대로 | 10개 ViewSet 전부 상속 |
| strict 쿼리 검증 (`FILTER_FIELDS` 화이트리스트) | 그대로 | `core/constants/filters.py` 에 planner 도메인 등록 |
| 페이지네이션 (`?page` / `?no_page=1`) | 그대로 | |
| `db_table = '"schema"."table"'` 스키마 명시 | 그대로 | 스키마명만 `namssi` → `planner` |
| 도메인별 models/serializers/views 3중 폴더 분리 | 그대로 | `portfolio` / `planning` / `journal` |
| 프론트 `api/client.js` success_response 언랩 | 그대로 | base 만 `/api/lineage` → `/api/planner` |
| 탭 상태 라우팅 (react-router 없음) | 그대로 | 화면 5개, 딥링크 요구 없음 |
| 컴포넌트별 `.jsx` + `.css` 페어 | 그대로 | |

## 2. 의도적으로 바꾼 것

1. **`UserProfile` 을 `users` 앱으로 분리했다.**
   참조 프로젝트는 도메인 앱(`lineage_management`) 안에 유저 모델이 들어 있는데,
   그러면 도메인 앱을 갈아끼울 때 인증까지 딸려온다. `AUTH_USER_MODEL = "users.UserProfile"`.

2. **`created_at` / `updated_at` 을 `DateTimeField` 로 통일했다.**
   참조 프로젝트는 초기 모델이 `DateField` 라 같은 날 여러 건이 들어오면 정렬이 깨진다.
   이 프로그램은 시간축이 주인공이라 날짜만으로는 부족하다.

3. **화면 전용 엔드포인트를 `views/dashboard.py` 로 따로 뺐다.**
   홈 요약과 타임라인은 CRUD 로 안 떨어진다. ViewSet 에 `@action` 으로 매다는 대신
   `APIView` 세 개로 분리해서, 화면이 바뀌어도 도메인 CRUD 는 흔들리지 않게 했다.

## 3. 핵심 설계 결정 — 예상선은 갱신하지 않는다

`ProjectionSnapshot` 은 append-only 다.

```
projected_on  (언제 세운 예상인가)
target_date   (어느 시점을 본 예상인가)
projected_value
actual_value  ← target_date 가 지나면 배치가 채운다
gap_amount / gap_rate / is_settled
```

시나리오 가정을 바꾸면 기존 행을 UPDATE 하지 않고 새 배치를 INSERT 한다.
그래서 계획 화면의 버튼 문구가 "수정"이 아니라 "예상 다시 세우기"다.
이 테이블이 없으면 타임라인의 회색 파선도, 홈의 "예상 적중률"도 만들 수 없다.
일반 자산앱과 갈라지는 지점이 여기 하나다.

## 4. 화면 ↔ 엔드포인트 매핑

| 화면 | 호출 | 서비스 |
|---|---|---|
| 홈 (토스형) | `GET /api/planner/home/summary/` | `summary_service.home_summary` |
| 홈 미니 차트 | `GET /api/planner/timeline/?months_back=12` | `timeline_service.build_timeline` |
| 계획 | `GET /plan/?status=ACTIVE`, `GET /scenario/?plan_id=`, `GET /timeline/?plan_id=` | |
| 계획 저장 | `PATCH /scenario/{id}/` → 새 ProjectionSnapshot 배치 | `projection_service.snapshot_projection` |
| 일지 | `GET /journal-entry/?tag_id=&date_from=`, `GET /journal-tag/?no_page=1` | |
| 회고 | `GET /review/?status=READY`, `GET /review/{id}/digest/` | `review_service.review_digest` |
| 회고 저장 | `PATCH /review/{id}/` | |
| 자산 | `GET /account/`, `GET /holding/`, `GET /transaction/` | |

프론트의 `src/data/mock.js` 는 위 응답 계약과 1:1로 맞춰 뒀다.
`VITE_USE_MOCK=1` 이면 백엔드 없이 화면이 그대로 뜬다.

## 5. DDL 받으면 채울 자리

```
backend/asset_planning/models/*/*.py
  → "# DDL 확정 후 추가 컬럼은 이 아래에 붙인다." 주석 자리 (10개 모델)

backend/asset_planning/services/timeline_service.py
  → _actual_series / _past_projection_series / _scenario_series / _journal_marks  (TODO 4개)

backend/asset_planning/services/projection_service.py
  → snapshot_projection / settle_due_projections / hit_rate  (TODO 3개)
     ※ project() 는 계산식이라 이미 동작한다

backend/asset_planning/services/review_service.py
  → open_review_for_period / review_digest  (TODO 2개)

backend/asset_planning/services/summary_service.py
  → home_summary  (TODO 1개)
```

DDL 반영 후 순서:

```bash
psql -c "CREATE SCHEMA IF NOT EXISTS planner;"
python manage.py makemigrations asset_planning users
python manage.py migrate
```

프론트는 `.env.development` 의 `VITE_USE_MOCK` 만 지우면 실데이터로 붙는다.

## 6. 일지 폼의 저장 조건

`JournalEditor` 는 두 가지가 없으면 저장 버튼을 열지 않는다.

- 근거 태그 1개 이상
- 확신도 1~5

이 둘이 회고 화면의 태그별 성과 집계와 확신도 대비 결과 비교를 성립시킨다.
본문(`content`)은 오히려 선택으로 뒀다 — 길게 못 쓰는 날에도 기록 자체는 남아야 한다.
`expected_outcome`(기대한 결과)도 선택이지만, 비면 회고에서 비교할 대상이 없다는
안내를 필드 밑에 붙여 뒀다.

화면 간 연결은 `App.goTo(tab, filter)` 하나로 처리한다. 홈·회고·자산의
"일지 쓰기 / 일지 붙이기"는 전부 일지 탭을 **'이유 미기재' 필터가 걸린 상태**로 연다.
밀어주기와 처리 화면이 끊기면 이 프로그램의 루프가 끊긴다.

## 7. 배치

```bash
python manage.py settle_projections          # 매일 새벽 — 지난 예상에 실제값 붙이기
python manage.py open_reviews                # 매월 1일 (또는 분기 첫날) — 회고 열기
```

`settle_projections` 가 안 돌면 홈의 '예상 적중률'이 영원히 비어 있고,
`open_reviews` 가 안 돌면 회고 카드가 홈에 뜨지 않는다. 이 둘이 루프의 동력이다.
두 커맨드 모두 서비스 함수를 호출만 하는 얇은 껍데기라, DDL 후 서비스 안쪽만 채우면 된다.

## 8. 아직 안 만든 것

- 인증 흐름. `users/urls.py` 에 SimpleJWT 토큰 엔드포인트와 `/me/` 만 열어 뒀다.
- 계좌 연동/시세 조회. `AssetSnapshot.source` 에 `SYNC` 값만 미리 잡아 뒀다.
- 계획 생성 폼 (계획이 없을 때의 빈 화면과 버튼까지만).
- 배치 스케줄러 설정 (cron / Celery beat). 커맨드는 있고 등록은 안 했다.
