# 설계 노트

`investments-nam.sql` 을 받아 기초공사를 한 뒤의 상태를 적는다.
DDL 과 모델의 차이는 여기가 아니라 [`schema-mapping.md`](schema-mapping.md) 에 있다.

## 1. 승계한 정책

앞선 스캐폴드(자산 플래너)의 백엔드 정책을 골격째 가져왔다. 도메인은 전부 바뀌었지만
아래는 그대로다.

| 정책 | 비고 |
|---|---|
| 소프트딜리트 (`SoftDeleteModel` / `objects` 는 살아 있는 행만) | SQL 의 모든 테이블에 `is_deleted` 가 있다 |
| `success_response` 포맷 | `{success, message, meta, results}` — 에러도 같은 봉투 |
| `BaseCommonViewSet` | list/detail 시리얼라이저 분기, select/prefetch, 기본정렬, restore |
| strict 쿼리 검증 (`FILTER_FIELDS` 화이트리스트) | `core/constants/filters.py` |
| 페이지네이션 (`?page` / `?no_page=1`) | 셀렉트박스 채우는 호출이 많아 `no_page` 가 자주 쓰인다 |
| `db_table` 에 스키마 명시 | 다만 문자열은 `core/db.py` 가 만든다 (아래 3절) |
| models/serializers/views 폴더 분리 | 3분할 → **7분할** (portfolio·planning·principle·market·strategy·execution·ai) |
| 프론트 `api/client.js` 가 success_response 를 언랩 | base 만 `/api/planner` → `/api/trading` |
| 탭 상태 라우팅 (react-router 없음) | 화면 5개 → **8개** |
| 컴포넌트별 `.jsx` + `.css` 페어 | |

## 2. 앞선 스캐폴드에서 버린 것

도메인이 완전히 달라서 **모델은 1:1로 겹치는 것이 하나도 없었다.**
`Plan` / `Scenario` / `ProjectionSnapshot` / `JournalEntry` / `JournalTag` / `Review` /
`Account` / `Holding` / `Transaction` / `AssetSnapshot` 전부 SQL 에 대응 테이블이 없다.
`asset_planning` 앱과 일지·회고·자산 화면을 통째로 걷어내고 `trading_discipline` 으로
새로 만들었다. (git 이력에 남아 있다)

`TimelineChart`(예상선 vs 실적선)도 버렸다. `ProjectionSnapshot` 에 해당하는
'과거의 예상을 append-only 로 쌓는' 테이블이 이 SQL 에는 없기 때문이다.
그 자리를 대신하는 것이 `CascadeTree` 다.

## 3. 이번에 새로 정한 것

### 3-1. `core/db.py` — db_table 을 한 곳에서 만든다

스키마명(`trading_discipline_management`)을 22개 모델에 하드코딩하면 스키마를 바꿀 때
전부 손대야 하고, SQLite 로는 아예 뜨지 않는다(테이블명에 점이 박힌다).

```python
db_table = table("orders")
# postgres → '"trading_discipline_management"."orders"'
# sqlite   → 'trading_discipline_management_orders'
```

`DB_ENGINE=sqlite` 로 띄우면 Postgres 없이도 화면 전체가 뜬다. 초기 확인용이다.

### 3-2. 코드값을 서버가 정하고, 라벨도 서버가 내려 준다

DDL 이 `VARCHAR(20)` 으로만 잡아 둔 코드성 컬럼 18종의 값을
`trading_discipline/constants/choices.py` 에서 확정했다.

프론트에 라벨 매핑 테이블을 두지 않는다. 두면 값이 하나 늘 때마다 두 군데를 고쳐야 한다.
대신 `ChoiceLabelMixin` 이 응답에 `<필드>_label` 을 자동으로 붙인다.

```json
{ "direction": "LONG", "direction_label": "매수" }
```

서비스 계층이 직접 조립하는 dict(캐스케이드·홈보드·이행대조)에는 이 믹스인이 안 걸려서
`services/_common.py` 의 `labels()` 헬퍼로 같은 규칙을 지킨다.
**이걸 빠뜨리면 화면에 `LONG`, `BASE` 같은 코드가 그대로 노출된다.**

### 3-3. FK 는 쓰기 가능한 PK 로 두고, 표시용은 `_detail` 로 따로

```json
{ "security": 3, "security_detail": { "id": 3, "symbol": "005930", "name": "삼성전자" } }
```

중첩 객체를 `security` 자리에 그대로 끼우면 그 필드가 읽기 전용이 되어 같은
시리얼라이저로 POST/PATCH 를 못 한다. 22개 전부 이 패턴이다.

### 3-4. 화면 전용 조회를 `views/dashboard.py` 로 분리

홈 보드·캐스케이드·이행 대조·성과 집계는 CRUD 로 안 떨어진다.
ViewSet 에 `@action` 으로 매달지 않고 `APIView` 로 뺐다. 화면이 바뀌어도
도메인 CRUD 가 흔들리지 않게 하기 위해서다.

### 3-5. 목 데이터를 손으로 쓰지 않는다

`frontend/src/data/mock.js` 는 `manage.py dump_mock` 이 **실제 API 응답을 떠서** 만든다.
손으로 쓴 목은 필드명 하나만 어긋나도, 백엔드를 붙이는 순간 화면이 조용히 빈칸이 된다.

```bash
python manage.py seed_demo --reset
python manage.py dump_mock
```

## 4. 이 프로그램의 핵심 판단 — 끊긴 자리를 숨기지 않는다

DDL 구조상 계획 계층은 **월 ↔ 주 사이에서 조용히 끊어질 수 있다**
(주계획은 월계획이 아니라 종목에 붙는다 — `schema-mapping.md` 3절).

계획이 있는 것처럼 보이는데 실은 비어 있는 상태가 가장 위험하다. 그래서 세 군데에서
같은 것을 잡는다.

| 어디서 | 무엇을 |
|---|---|
| `/cascade/` → `orphan_weekly_plans` | 어느 월계획에도 못 붙은 주계획 |
| `/home/board/` → `gaps` | 전략 문장 미기재, 월원칙 없는 월계획, 손절가·확신도 없는 주계획 |
| `/execution/compare/` → `UNGROUNDED_PLAN` | 상위 논리 없는 계획 아래에서 낸 주문 |

`seed_demo` 는 이 세 케이스를 **일부러 만들어 넣는다.** 시드가 전부 깔끔하면
이 기능이 도는지 확인할 수가 없다.

## 5. 이행 대조는 판결이 아니라 기록이다

`execution_service` 는 위반이라고 단정하지 않고 **표시(flag)** 만 한다.

```
NO_PLAN            이 날짜에 이 종목을 덮는 주계획이 없다
UNGROUNDED_PLAN    주계획은 있지만 어느 월계획에도 안 붙어 있다
DIRECTION_MISMATCH 계획한 방향과 반대로 갔다
BELOW_STOP_LOSS    손절가 아래에서 추가 매수했다
ABOVE_TARGET       예상가를 2% 넘게 웃돈 가격에 샀다
```

계획 밖의 매매가 항상 잘못은 아니다. 다만 그것이 계획 밖이었다는 사실이 기록에 남아야,
나중에 그 결정이 좋았는지 나빴는지 갈라 볼 수 있다.

`discipline_rate` = 표시 없이 넘어간 이행의 비율. 이 숫자 하나가 이 프로그램이
답하려는 질문이다.

## 6. 스모크 테스트에서 실제로 잡힌 버그 두 개

기록해 둔다. 같은 실수를 반복하지 않기 위해서다.

1. **성과 집계가 진행 중인 기간을 통째로 놓쳤다.**
   `period_end <= date_to` 로 잡으니 이번 달 레코드(종료일이 월말)가 오늘 기준
   조회에서 빠졌다. 포함(containment)이 아니라 **겹침(overlap)** 으로 고쳐야 했다.
2. **이행 대조가 orphan 주계획을 통과시켰다.**
   주계획이 존재하기만 하면 통과였는데, 그 주계획이 어느 월계획에도 안 붙어 있으면
   사실상 계획 밖이다. `UNGROUNDED_PLAN` 플래그를 추가했다.

## 7. 아직 안 만든 것

- 커뮤니티 5개 테이블 (`posts` / `comments` / 좋아요 / 첨부) — 1차 범위 제외
- **쓰기 UI.** 8화면 전부 조회는 되지만 생성·수정 폼이 없다. API 는 열려 있다
- 인증 화면. `users/urls.py` 에 SimpleJWT 토큰과 `/me/` 만 있다
- 시세 연동. `securities.current_price` 를 수동으로 넣는 상태
- AI 실제 호출. `ai_model_runs` 는 테이블과 API 만 있고 호출부가 없다
- 배치 스케줄러. 성과 집계·AI 실행을 주기적으로 돌릴 자리가 아직 없다
