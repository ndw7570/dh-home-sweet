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

### 프론트만 (백엔드 없이 화면 확인)

```bash
cd frontend && npm install && npm run dev      # http://localhost:5353
```

`.env.development` 의 `VITE_USE_MOCK=1` 이 켜져 있어 목 데이터로 뜬다.
목 데이터는 실제 백엔드 응답을 떠서 만든 것이라 필드 모양이 API 와 정확히 같다.

### 백엔드까지

```bash
cd backend
python -m venv .venv && .venv/Scripts/activate     # Windows
pip install -r requirements.txt
cp .env.example .env                                # 값 채우기

# Postgres (기본)
psql -c "CREATE SCHEMA IF NOT EXISTS trading_discipline_management;"

# 또는 화면만 빠르게 볼 때 — 스키마 없이 SQLite
export DB_ENGINE=sqlite

python manage.py migrate
python manage.py seed_demo      # 데모 데이터 (계층이 끊긴 케이스도 같이 들어간다)
python manage.py runserver 0.0.0.0:8000
```

그 다음 `frontend/.env.development` 의 `VITE_USE_MOCK` 을 `0` 으로 바꾸면 실데이터로 붙는다.

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

## 지금 상태

DDL 24개 테이블에 대한 모델 · 시리얼라이저 · ViewSet · 필터 · URL 이 전부 있고,
`migrate` → `seed_demo` → 8개 화면이 실제 데이터로 뜨는 것까지 확인했다.

**아직 안 만든 것**

- 커뮤니티 (`posts` / `comments` / 좋아요 / 첨부파일) — 1차 범위에서 뺐다
- 쓰기 UI. 조회는 8화면 전부 되지만, 생성·수정 폼은 아직 없다 (API 는 열려 있다)
- 인증 흐름. `users/urls.py` 에 SimpleJWT 토큰과 `/me/` 만 열어 뒀고 로그인 화면은 없다
- 시세 연동. `securities.current_price` 를 수동으로 넣는 상태다
- AI 모델 실제 호출. `ai_model_runs` 는 테이블과 API 만 있고 호출부는 없다
