# 주식 규율 관리 (trading discipline management)

계획 → 원칙 → 이행 → 성과 루프를 도는 개인 주식 관리 프로그램.

일반 주식앱의 "지금 얼마인가"가 아니라, **미리 정해 둔 것과 실제로 한 것을 나란히 놓고
그 간극을 남기는** 것이 이 프로그램의 정체성이다. 그래서 홈 화면이 잔고가 아니라
'오늘 지켜야 할 것'으로 시작한다.

스키마와 기획은 전부 [`investments-nam.sql`](investments-nam.sql) 이 기준이다.
(CP949 인코딩 — UTF-8 로 열면 한글 주석이 깨진다)

## 이 프로그램이 답하려는 질문

> 규율 준수율 — 내가 미리 정한 것 대로 한 비율이 몇 %인가.

`GET /api/trading/execution/compare/` 하나가 이 질문에 답한다. 나머지 화면은
그 숫자를 만들기 위한 재료를 모으거나, 그 숫자가 왜 그렇게 나왔는지를 설명한다.

## 구조

```
backend/          Django 5 + DRF
  core/             소프트딜리트 · success_response · strict 쿼리검증 · 페이지네이션
    db.py             db_table 스키마명을 한 곳에서 만든다
    views/common.py   BaseCommonViewSet — 22개 ViewSet 이 전부 상속
    constants/filters.py  검색 파라미터 화이트리스트
  users/            UserProfile (AUTH_USER_MODEL) · Person
  trading_discipline/   도메인 앱 — 모델 22개
    models/         portfolio · planning · principle · market · strategy · execution · ai
    serializers/    동일 7분할
    views/          동일 7분할 + dashboard.py (화면 전용 조회)
    services/       캐스케이드 조립 · 오늘의 규율 · 이행 대조 · 성과 집계 · AI
    constants/choices.py  코드값 정의 (DDL 이 VARCHAR 로만 둔 것들)
frontend/         React 18 + Vite (탭 라우팅, 컴포넌트별 css 페어)
  src/components/   CascadeTree(시그니처) · SplitTable · AiFeedback · DataTable · Panel
  src/pages/        홈 · 계획 · 원칙 · 종목 · 이행 · 전략 · 시장 · 성과
  src/data/mock.js  ⚠ 손으로 안 고친다 — `manage.py dump_mock` 이 만든다
docs/             schema-mapping.md ← DDL 과 다른 곳 전부 여기 적혀 있다
```

## 화면

| 화면 | 형태 | 이유 |
|---|---|---|
| 홈 | 좁은 단일 컬럼 | 지금 할 행동 **하나**를 미는 것이 목적이라 넓으면 안 된다 |
| 나머지 7개 | 대시보드형 | 비교와 대조가 목적이라 밀도가 있어야 한다 |

계획 화면의 5계층 트리(`CascadeTree`)가 시그니처다. 계획을 보여 주는 것보다
**끊긴 자리를 드러내는 것**이 목적이다 — 자세한 사정은 `docs/schema-mapping.md` 3절.

## 실행

### 1. 백엔드

```bash
cd backend
python -m venv .venv && .venv/Scripts/activate     # Windows
pip install -r requirements.txt
cp .env.example .env
```

`.env` 의 `DB_ENGINE` 이 갈림길이다.

```bash
# (a) Postgres — SQL 원본 그대로. 스키마와 JSONB 를 쓴다.
#     .env: DB_ENGINE=postgres
psql -U postgres -c "CREATE DATABASE trading_discipline;"
psql -U postgres -d trading_discipline -c "CREATE SCHEMA IF NOT EXISTS trading_discipline_management;"

# (b) SQLite — Postgres 없이 화면부터 볼 때.
#     .env: DB_ENGINE=sqlite
#     스키마가 없어서 core/db.py 가 테이블명을 접두어로 접고,
#     JSONB 는 텍스트로 저장된다. 조회 화면 확인에는 문제없다.

python manage.py migrate
python manage.py seed_demo      # 데모 데이터 (계층이 끊긴 케이스도 같이 들어간다)
python manage.py runserver 0.0.0.0:8000
```

(a)↔(b) 를 오갈 때 데이터는 넘어가지 않는다. 테이블명이 다르기 때문이다.
실데이터를 넣기 시작하기 전에 Postgres 로 정하는 편이 좋다.

### 2. 프론트

```bash
cd frontend && npm install && npm run dev      # http://localhost:5353
```

`.env.development` 의 `VITE_USE_MOCK` 이 스위치다.

- `0` (기본) — 위 백엔드를 실제로 호출한다. `/api` 는 vite 프록시가 `:8000` 으로 넘긴다.
- `1` — 백엔드를 아예 안 부르고 `src/data/mock.js` 로 뜬다. 백엔드 없이 화면만 볼 때.

목 데이터는 실제 백엔드 응답을 떠서 만든 것이라 필드 모양이 API 와 정확히 같다.
다만 **`wrap()` 이 감싸는 것은 조회뿐이다.** `createX` / `updateX` 같은 쓰기 함수는
목 모드에서도 실제 API 를 부른다(아직 쓰기 UI 가 없어 드러나지 않는다).

API 문서: <http://localhost:8000/docs/> (Swagger) · <http://localhost:8000/redoc/>

## 주요 엔드포인트

CRUD 22종은 `/api/trading/<자원>/` 으로 전부 열려 있다. 화면 전용 조회는 따로다.

| 화면 | 호출 |
|---|---|
| 홈 | `GET /api/trading/home/board/` |
| 계획 | `GET /api/trading/cascade/?on=&account_id=&only_active=` |
| 이행 | `GET /api/trading/execution/compare/?security_id=&date_from=&date_to=` |
| 성과 | `GET /api/trading/performance/summary/?period_type=&date_from=&date_to=` |
| AI | `GET /api/trading/ai/digest/` · `GET /api/trading/ai/feedback-for/?table_name=&object_ids=` |
| 종목 상세 | `GET /api/trading/security/{id}/plans/` |
| 코드값 | `GET /api/trading/meta/choices/` |

모든 응답은 `{success, message, meta, results}` 봉투에 담긴다.
프론트 `api/client.js` 가 이 봉투를 벗겨서 `results` 만 돌려준다.

**strict 쿼리 검증** — `core/constants/filters.py` 화이트리스트에 없는 파라미터가 오면
400 이다. `?smybol=005930` 처럼 오타 난 필터가 조용히 무시되면 전체 목록을 필터된
목록으로 착각하게 되고, 그 상태로 화면을 믿으면 판단이 오염된다.

## 관리 명령

```bash
python manage.py seed_demo [--reset]   # 데모 데이터
python manage.py dump_mock             # frontend/src/data/mock.js 재생성
```

## 쓰기

조회 8화면 전부에 추가 · 수정 · 삭제가 붙어 있다(삭제는 소프트딜리트).
폼은 화면마다 따로 짜지 않고 **필드 스펙 한 벌**(`src/forms/specs.js`)로 그린다.

```
forms/specs.js      엔티티 20종의 필드 정의 (DDL 컬럼과 1:1)
components/EntityForm.jsx   스펙 → 폼. 빈칸을 null 로 보내고, 서버 400 을 필드 밑에 붙인다
components/FormField.jsx    타입별 입력 (text/textarea/number/date/datetime/choice/ref/json/confidence)
lib/useMultiForm.js         한 화면에서 여러 종류를 다룰 때 (계획 화면은 6종)
lib/useChoices.js           /meta/choices/ 를 앱 전체에서 한 번만 받아 캐시
```

세 가지가 이 구조의 이유다.

1. **빈칸은 `null` 로 보낸다.** `""` 를 그대로 보내면 DRF 의 Decimal/Date 필드가 400 을 낸다.
   안 적은 것과 0 은 다르다.
2. **서버 검증이 해당 입력칸 밑에 붙는다.** 이 프로젝트의 검증은 대부분 서버에만 있다
   (`근거 없이 예상가만 적을 수 없다`, `상승을 예측하면서 손절가가 예상가보다 높다`,
   `지정가 주문에는 지정가격이 있어야 한다`). 화면 위 배너 한 줄로만 보여 주면
   어느 칸이 문제인지 알 수 없다.
3. **수정 폼은 목록 행이 아니라 단건 조회로 원본을 다시 읽는다.** 캐스케이드 트리의
   노드는 화면용으로 눌러 놓은 것이라, 그걸로 폼을 채우면 안 보이던 컬럼이 null 로 덮인다.

계획 화면은 트리 노드마다 수정·추가 버튼이 붙어 있다. **계층이 끊긴 월계획의
'+ 종목 연결' 은 숨기지 않고 항상 보인다** — 끊긴 자리를 그 자리에서 고치는 것이
이 화면의 목적이기 때문이다.

## 지금 상태

DDL 24개 테이블에 대한 모델 · 시리얼라이저 · ViewSet · 필터 · URL 이 전부 있고,
8개 화면의 조회와 쓰기가 실제 백엔드로 도는 것까지 확인했다.

**아직 안 만든 것**

- 커뮤니티 (`posts` / `comments` / 좋아요 / 첨부파일) — 1차 범위에서 뺐다
- 소프트삭제 **복구** UI. API(`PATCH /{자원}/{id}/restore/`)는 있는데 화면 경로가 없다
- 인증 흐름. `users/urls.py` 에 SimpleJWT 토큰과 `/me/` 만 열어 뒀고 로그인 화면은 없다
- 시세 연동. `securities.current_price` 를 수동으로 넣는 상태다
- AI 모델 실제 호출. `ai_model_runs` 는 테이블과 API 만 있고 호출부는 없다
