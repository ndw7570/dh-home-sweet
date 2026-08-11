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

## 4. 이 프로그램의 핵심 판단 — 근거가 빈 자리를 숨기지 않는다

v0.0.2 부터 계획 계층은 FK 로 곧게 이어진다(`schema-mapping.md` 3절). 하지만
계층이 이어져도 **월원칙이 비어 있는 월계획** 은 여전히 만들어질 수 있다 — 계층은
잇지만 어떤 종목에 대한 것인지 답이 없는 상태다.

계획이 있는 것처럼 보이는데 실은 근거가 비어 있는 상태가 가장 위험하다. 두 군데에서
같은 것을 잡는다.

| 어디서 | 무엇을 |
|---|---|
| `/cascade/` → `monthly.securities` 가 빈 배열 | 월원칙이 없어 종목에 닿지 않는 월계획 |
| `/home/board/` → `gaps` | 전략 문장 미기재, 월원칙 없는 월계획, 손절가·확신도 없는 주계획 |

`seed_demo` 는 이 상태를 **일부러 만들어 넣는다.** 시드가 전부 깔끔하면 이 기능이
도는지 확인할 수가 없다.

### 4-1. v0.0.1 에서 뺀 것

`orphan_weekly_plans` 응답 필드와 이행 대조의 `UNGROUNDED_PLAN` 플래그는 v0.0.2 에서
제거됐다. 주계획이 FK 로 월계획에 반드시 매달리게 되면서 orphan 자체가 스키마상
불가능해졌기 때문이다.

## 5. 이행 대조는 판결이 아니라 기록이다

`execution_service` 는 위반이라고 단정하지 않고 **표시(flag)** 만 한다.

```
NO_PLAN            이 날짜에 이 종목을 덮는 주계획이 없다
UNGROUNDED_PLAN    주계획의 monthly_plan_id 가 비어 있다 (DDL 은 NULLABLE 이라 방어선으로 남긴다)
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
2. **이행 대조가 orphan 주계획을 통과시켰다.** (v0.0.1)
   주계획이 존재하기만 하면 통과였는데, 그 주계획이 어느 월계획에도 안 붙어 있으면
   사실상 계획 밖이었다. `UNGROUNDED_PLAN` 플래그로 잡았다.
   v0.0.2 에서 주계획→월계획 FK 가 붙으면서 시리얼라이저 레벨에서 필수로 강제하지만,
   DDL 은 NULLABLE 이라 플래그는 방어선으로 남긴다(비어 있으면 그대로 잡힌다).

## 7. 쓰기 UI — 폼을 화면마다 짜지 않는다

엔티티가 20종이라 폼을 손으로 짜면 검증 표시와 삭제 확인이 화면마다 갈린다.
**필드 스펙 한 벌**(`src/forms/specs.js`)로 그리고, 렌더는 `EntityForm` 하나가 맡는다.

이 구조가 짊어지는 것 셋.

1. **빈칸 → `null`.** `""` 를 그대로 보내면 DRF 의 Decimal/Date 필드가 400 을 낸다.
   안 적은 것과 0 은 다르다.
2. **서버 400 을 필드 밑에 붙인다.** 검증이 대부분 서버에만 있어서
   (`근거 없이 예상가만 적을 수 없다`, `상승 예측인데 손절가가 예상가보다 높다`),
   배너 한 줄로 보여 주면 어느 칸이 문제인지 알 수 없다.
3. **수정은 단건 조회로 원본을 다시 읽는다.** 캐스케이드 노드는 화면용으로 눌러 놓은
   데이터라, 그걸로 폼을 채우면 안 보이던 컬럼이 저장될 때 null 로 덮인다.

`필수(*)` 표시는 **DDL 의 NOT NULL** 을 따른다. 여기서 임의로 늘리지 않는다.
예외는 서버 시리얼라이저가 추가로 요구하는 두 개(월투자원칙의 `rationale`,
시장방향의 `rationale`)뿐이고, 힌트에 이유를 적어 뒀다.

### 7-1. 계획 화면은 끊긴 자리에서 바로 고치게 한다

트리 노드마다 수정·추가 버튼이 붙어 있고, 계층에 따라 '+'가 만드는 것이 다르다.

| 노드 | '+' 가 만드는 것 |
|---|---|
| 연 | 분기계획 |
| 분기 | 월계획 |
| **월** | **월투자원칙 (종목 연결)** ← 주계획이 아니다 |
| 주 | 일계획 |

월 아래가 주계획이 아니라 월투자원칙인 이유는 4절 그대로다 — 그게 종목에 닿는
통로라서, 끊긴 계층을 고치려면 여기부터 채워야 한다.
그래서 **끊긴 월계획의 '+' 버튼만 숨기지 않고 항상 보인다.**

실제로 시연 시드의 '월원칙 없는 월계획'을 이 버튼으로 고치면,
캐스케이드 화면의 노란 경고와 홈보드의 `gaps` 카드가 함께 사라진다.

### 7-2. 저장했는데 안 보이는 상태를 만들지 않는다

계획을 기준일 밖의 기간으로 만들면 트리 필터에서 빠진다. 그걸 말 안 해 주면
저장이 안 된 줄 알고 같은 계획을 또 만든다. 그래서 저장 후 그 행이 현재 필터에
안 걸리면 파란 알림과 함께 **'그 날짜로 이동' / '필터 끄기'** 를 준다.

`useMultiForm.submit` 이 저장된 행을 돌려주는 이유가 이것 하나다.

## 8. 아직 안 만든 것

- 커뮤니티 5개 테이블 (`posts` / `comments` / 좋아요 / 첨부) — 1차 범위 제외
- 소프트삭제 **복구** UI. `PATCH /{자원}/{id}/restore/` 는 있는데 화면 경로가 없다
- 인증 화면. `users/urls.py` 에 SimpleJWT 토큰과 `/me/` 만 있다
- 시세 연동. `securities.current_price` 를 수동으로 넣는 상태
- AI 실제 호출. `ai_model_runs` 는 테이블과 API 만 있고 호출부가 없다
- 배치 스케줄러. 성과 집계·AI 실행을 주기적으로 돌릴 자리가 아직 없다
