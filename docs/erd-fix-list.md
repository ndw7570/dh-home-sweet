# ERD 수정 목록 (백엔드 기준)

작성일: 2026-08-13
기준: `backend/` 의 현재 Django 모델 (백엔드가 정본, ERD 를 이쪽에 맞춘다)

`investment-discipline.sql` (ERD 산출물) 을 현재 백엔드 모델과 1:1 대조한 결과.

---

## 1. ERD 에서 삭제할 테이블 (백엔드에 없음)

`trading_discipline/models/__init__.py:3` — "커뮤니티(posts/comments/likes/attachment_files) 5개는 1차 범위에서 뺐다" 고 명시적으로 정리됨.

- `posts`
- `comments`
- `comments_like`
- `posts_like`
- `attachment_files`

같이 정리할 FK / 컬럼:
- `posts.user_id → user_profile` FK
- `posts.attachment_file_id` 컬럼 및 FK
- `comments.posts_id → posts` FK
- `comments_like.comments_id → comments` FK
- `posts_like.posts_id → posts` FK

---

## 2. ERD 에 누락된 컬럼 (추가 필요)

### `user_profile`
`users/models.py:56` — `AbstractBaseUser` + `PermissionsMixin` 상속으로 실제 테이블에 붙는 컬럼:

| 컬럼 | 타입 | 비고 |
|---|---|---|
| `password` | VARCHAR(128) NOT NULL | AbstractBaseUser 필수 |
| `last_login` | TIMESTAMP NULL | AbstractBaseUser 필수 |
| `is_active` | BOOLEAN NOT NULL (default true) | |
| `is_staff` | BOOLEAN NOT NULL (default false) | |
| `is_superuser` | BOOLEAN NOT NULL (default false) | PermissionsMixin |

(PermissionsMixin 의 `groups`, `user_permissions` 는 M2M 중간 테이블이라 ERD 에는 별도 표기 안 해도 됨)

`users/models.py` 상단 주석에도 "DDL 쪽에도 반영해 두어야 마이그레이션과 실제 테이블이 어긋나지 않는다" 로 못박아 뒀음.

### `daily_investment_plan`
`planning/daily_plan.py:53-57`:

| 컬럼 | 타입 | 비고 |
|---|---|---|
| `target_fill_price` | NUMERIC(15,2) NULL | 목표체결가 |

주석 근거: "예상가격은 '이 종목이 여기까지 갈 것 같다' 는 전망, 목표체결가는 '나는 여기에 걸겠다' 는 내 주문 가격. 전망이 맞았는지와 원하는 자리에 체결시켰는지는 따로 재야 고칠 곳이 갈린다."

### `news`
`market/news.py:722-731`:

| 컬럼 | 타입 | 비고 |
|---|---|---|
| `expected_impact_from` | DATE NULL | 예상영향시작일 |
| `expected_impact_until` | DATE NULL | 예상영향종료일 |

주석 근거: "금리 결정은 몇 달을 끌고 실적 서프라이즈는 며칠이면 소화된다. 그 추측을 미리 적어 두면 나중에 '이 영향이 이만큼 갈 거라고 봤는데 실제로는 어땠나' 를 대조할 수 있다."

---

## 3. 컬럼명 / 코멘트 어긋난 자리

### `affected_securities` — FK 컬럼명 변경
ERD 는 뉴스 FK 컬럼명을 `id` 로 두고 있어 PK(`affected_security_id`) 와 헷갈리는 구조.

`market/affected_security.py:591` — "한 테이블에서 `id` 가 기본키가 아닌 순간 raw SQL·조인·덤프를 읽는 사람이 전부 한 번씩 틀린다. 이름 하나 아끼자고 만들 위험이 아니다."

- ERD: `affected_securities.id INTEGER` → **`news_id INTEGER`**
- FK `FK_news_TO_affected_securities` 의 소스 컬럼도 `id` → `news_id`

### `news.direction` — 코멘트 수정
ERD 컬럼 코멘트가 `-- 소스` 인데 백엔드는 `MarketTrend` enum (방향).

`market/news.py:703-710` — "코멘트만 손대다 만 자리로 본다. 방향(MarketTrend) 으로 다룬다 — ERD 코멘트도 '방향' 으로 고쳐야 한다. 소스(유튜브/책/뉴스)는 principle_sources 가 이미 맡고 있어 여기 겹칠 이유가 없다."

- ERD: `-- 소스` → `-- 방향`

### `ai_model_runs` — 컬럼 코멘트 한글화
ERD 는 컬럼명을 그대로 코멘트에 박아 놓은 자리들. 백엔드는 한글로 정리됨:

| 컬럼 | ERD 현재 | 백엔드 |
|---|---|---|
| `started_at` | `started_at` | `시작시각` |
| `completed_at` | `completed_at` | `완료시각` |
| `input_snapshot_json` | `input_snapshot_json` | `입력스냅샷` |
| `output_json` | `output_json` | `출력` |
| `status` | `status` | `상태` |

### `ai_decision_feedback.model_id` — 오타
ERD/백엔드 모두 `AI모델D` 로 되어 있음 (오타). 손댈 거면 양쪽 다 `AI모델ID` 로.

---

## 4. FK 제약 (선택)

백엔드 모델에는 FK 로 걸려 있는데 DDL/ERD 에는 FK 제약이 없는 자리:

- `securities_loans.security_id → securities.id`
  (`portfolio/securities_loan.py` 주석 명시: "DDL 쪽에도 제약을 추가해 두는 편이 안전하다.")
- `affected_securities.security_id → securities.id`
- `performance_records.security_id → securities.id`
  (`execution/performance_record.py` 주석 명시: "⚠ `security_id` 에 FK 제약이 DDL 에 없다. 모델에서는 FK 로 걸었다.")

---

## 5. 일치 확인된 자리 (수정 불필요)

컬럼 집합과 FK 가 모두 일치:

- `broker_accounts`
- `securities`
- `daily_security_price_data`
- `annual_investment_plan`
- `quarterly_investment_plan`
- `monthly_investment_plan`
- `weekly_investment_plan`
- `weekly_security_investment_plan`
- `investment_principles`
- `mandatory_principles`
- `monthly_investment_principles`
- `quarterly_investment_principles`
- `principle_sources`
- `market_directions`
- `trading_strategies`
- `trading_strategy_methods`
- `orders`
- `performance_records`
- `person`

계층 구조 (**MONTH → WEEK → WEEKLY_SECURITY → DAY**) 는 ERD 도 이미 v0.0.3 형태.

---

## 작업 우선순위

1. **커뮤니티 5개 테이블 삭제** (1번)
2. **누락 컬럼 추가** — user_profile 5개 / daily_investment_plan 1개 / news 2개 (2번)
3. **affected_securities.news_id 이름 변경** (3번)
4. 코멘트 정리 및 FK 제약 추가 (3-4번, 여유 있을 때)
