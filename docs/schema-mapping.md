# DDL ↔ 모델 대조표

`investments-nam.sql` 이 이 프로젝트의 기준이다. 이 문서는 SQL 과 Django 모델이
**어디가 같고 어디가 다른지**를 한 곳에 적어 둔 것이다. 다른 곳은 전부 이유를 붙였다.

SQL 파일은 CP949(EUC-KR) 로 저장돼 있다. UTF-8 로 열면 한글 주석이 깨진다.

```bash
iconv -f CP949 -t UTF-8 investments-nam.sql > investments-nam.utf8.sql
```

## 1. 테이블 → 모델

전체 29개 테이블 중 **24개**를 만들었다.

| SQL 테이블 | Django 모델 | 앱 / 폴더 |
|---|---|---|
| `user_profile` | `UserProfile` | users |
| `person` | `Person` | users |
| `broker_accounts` | `BrokerAccount` | trading_discipline / portfolio |
| `securities` | `Security` | portfolio |
| `securities_loans` | `SecuritiesLoan` | portfolio |
| `security_price_data` | `SecurityPriceData` | portfolio |
| `annual_investment_plan` | `AnnualInvestmentPlan` | planning |
| `quarterly_investment_plan` | `QuarterlyInvestmentPlan` | planning |
| `monthly_investment_plan` | `MonthlyInvestmentPlan` | planning |
| `weekly_investment_plan` | `WeeklyInvestmentPlan` | planning |
| `daily_investment_plan` | `DailyInvestmentPlan` | planning |
| `mandatory_principles` | `MandatoryPrinciple` | principle |
| `principle_sources` | `PrincipleSource` | principle |
| `investment_principles` | `InvestmentPrinciple` | principle |
| `quarterly_investment_principles` | `QuarterlyInvestmentPrinciple` | principle |
| `monthly_investment_principles` | `MonthlyInvestmentPrinciple` | principle |
| `market_directions` | `MarketDirection` | market |
| `affected_securities` | `AffectedSecurity` | market |
| `trading_strategies` | `TradingStrategy` | strategy |
| `trading_strategy_methods` | `TradingStrategyMethod` | strategy |
| `orders` | `Order` | execution |
| `performance_records` | `PerformanceRecord` | execution |
| `ai_model_runs` | `AiModelRun` | ai |
| `ai_decision_feedback` | `AiDecisionFeedback` | ai |

**아직 안 만든 것 (1차 범위 제외)** — 커뮤니티 5개:
`posts` · `comments` · `comments_like` · `posts_like` · `attachment_files`

## 2. DDL 과 다르게 만든 것

### 2-1. 반드시 DDL 쪽도 고쳐야 하는 것

| # | 위치 | DDL 현재 | 모델 | 왜 |
|---|---|---|---|---|
| 1 | `affected_securities` | **기본키 없음** | `id` SERIAL 추가 | Django 는 PK 없는 모델을 못 만든다. DDL 에도 PK 를 넣어야 한다. `(market_directions_id, affected_security_id)` 복합키도 방법이다. |
| 2 | `user_profile` | `password` / `last_login` 없음 | 두 컬럼 추가 | `AbstractBaseUser` 가 요구한다. 로그인이 있는 한 뺄 수 없다. 마이그레이션과 실제 테이블이 어긋나지 않으려면 DDL 에도 필요하다. |

### 2-2. FK 제약이 DDL 에 없는데 모델에서는 FK 로 건 것

컬럼명과 용도가 명백해서 FK 로 걸었다. DDL 에도 제약을 추가하는 편이 안전하다.

| 테이블 | 컬럼 | 참조 |
|---|---|---|
| `securities_loans` | `security_id` | `securities.id` |
| `performance_records` | `security_id` | `securities.id` |
| `quarterly_investment_principles` | `security_id` | `securities.id` |
| `monthly_investment_principles` | `security_id` | `securities.id` |
| `affected_securities` | `affected_security_id` | `securities.id` |

### 2-3. PK 타입

DDL 이 형제 테이블끼리 엇갈린다 — `annual`/`weekly`/`daily` 는 `SERIAL` 인데
`monthly` 는 `INTEGER`, `securities`·`broker_accounts`·`ai_model_runs`·
`principle_sources`·`market_directions`·`security_price_data` 도 `INTEGER` 다.

같은 계층 안에서 갈리는 게 의도로 읽히지 않아 **전부 `AutoField`(SERIAL)** 로 통일했다.
외부에서 ID 를 받아 오는 테이블이 실제로 있다면 알려 주면 되돌린다.

### 2-4. 코드값 (VARCHAR(20))

DDL 은 코드성 컬럼을 전부 `VARCHAR(20)` 으로만 잡고 값을 규정하지 않았다.
값이 없으면 셀렉트박스도 집계도 못 만들어서 **`trading_discipline/constants/choices.py`
에서 내가 정했다.** DDL 이 규정한 것이 아니다.

| 컬럼 | 정한 값 |
|---|---|
| `market` | KOSPI / KOSDAQ / KONEX / NASDAQ / NYSE / AMEX / ETC |
| `direction` (계획·원칙) | LONG / SHORT / NEUTRAL / HEDGE |
| `direction` (시장방향) · `predicted_trend` | UP / DOWN / SIDEWAYS / VOLATILE |
| `status` (계획) | DRAFT / ACTIVE / PAUSED / CLOSED / ABANDONED |
| `scenario_planning` | BASE / BULL / BEAR / STRESS |
| `asset_type` | STOCK / ETF / ETN / REIT / BOND / FUND / CASH / CRYPTO |
| `currency` | KRW / USD / JPY / EUR / HKD / CNY |
| `action_type` | PLAN / ORDER / FILL / CANCEL / REJECT |
| `order_type` | MARKET / LIMIT / STOP / STOP_LIMIT / TRAILING |
| `side` | BUY / SELL |
| `period_type` | DAY / WEEK / MONTH / QUARTER / YEAR |
| `principle_type` | BUY / SELL / RISK / VALUATION / PORTFOLIO / MINDSET |
| `source_type` | BOOK / VIDEO / ARTICLE / LECTURE / INTERVIEW / PAPER / ETC |
| `strategy_type` | BUY_SPLIT / SELL_SPLIT / ADD_ON / TAKE_PROFIT / STOP_LOSS |
| `valuation_type` | UNDERVALUED / FAIR / OVERVALUED |
| `factor_type` | RATE / FX / COMMODITY / POLICY / EARNINGS / GEOPOLITICS / LIQUIDITY / SENTIMENT |
| `opinion_type` | REVIEW / WARNING / SUGGESTION / APPROVAL / REJECTION |
| `status` (AI) | PENDING / RUNNING / SUCCESS / FAILED / CANCELED |

바꾸려면 `choices.py` 만 고치면 된다. 프론트는 `GET /api/trading/meta/choices/` 로
받아 가고, 한글 라벨도 서버가 `<필드>_label` 로 같이 내려 준다.

`confidence_score`(계획확신도)는 `INTEGER` 라 **1~5** 로 범위만 강제했다.

### 2-5. 그 외

- **`created_at` / `updated_at` 은 SQL 그대로 `DATE`** 로 뒀다.
  같은 날 여러 건이 들어오면 정렬이 흔들린다는 문제가 있는데, SQL 이 기준이라
  바꾸지 않았다. 실제로 시각이 중요한 자리는 SQL 이 이미 `TIMESTAMP` 를 쓰고 있다
  (`orders.executed_at`, `security_price_data.price_at`, `trading_strategies.reference_at`,
  `securities_loans.evaluated_at`, `ai_model_runs.started_at/completed_at`).
  audit 컬럼도 `TIMESTAMP` 로 바꾸고 싶으면 `core/models/common.py` 의
  `TimeStampedModel` 한 곳만 고치면 된다.
- **`db_table` 은 `core/db.py` 의 `table()` 이 만든다.** 스키마명을 22개 모델에
  하드코딩하지 않는다. `DB_ENGINE=sqlite` 면 스키마 대신 테이블명 접두어로 접힌다.
- **`performance_records.etc_cost` 의 컬럼 코멘트가 `기티비용`** 이다(오타로 보인다).
  화면이 이 코멘트를 라벨로 그대로 쓰므로 DDL 을 고치면 화면도 같이 고쳐진다.

## 3. 계층이 한 번 꺾이는 지점 — 가장 중요한 구조

```
broker_accounts
      │
annual ──FK──> quarterly ──FK──> monthly
                                    │
                     monthly_investment_principles  (월계획 × 종목)
                                    │
                                Security
                                    │
                          weekly ──FK──> daily
```

`weekly_investment_plan` 의 FK 는 `monthly_investment_plan` 이 아니라 **`securities`** 다
(`FK_securities_TO_weekly_investment_plan`). DDL 그대로다.

그래서 '이 월계획 밑의 주계획'은 FK 로 못 읽고, **월원칙이 가리키는 종목 + 기간 겹침**
두 조건으로 찾아 붙여야 한다. 그 조립은 `services/cascade_service.py` 한 곳에서만 한다.

이 구조의 실질적 결과:

- 월계획에 `monthly_investment_principles` 가 하나도 없으면 **거기서 계층이 끊긴다.**
  홈의 '빈칸' 카드와 계획 화면의 노란 경고가 이걸 잡는다.
- 주계획은 상위 논리 없이도 혼자 만들어질 수 있다. 어디에도 못 붙은 주계획은
  `/cascade/` 응답의 `orphan_weekly_plans` 로 따로 나오고, 이행 대조에서는
  `UNGROUNDED_PLAN` 으로 표시된다.

계층을 FK 로 잇고 싶다면 `weekly_investment_plan` 에 `monthly_plan_id` 를 추가하는
것이 방법이다. 다만 그러면 한 주계획이 여러 시나리오(BASE/BEAR) 월계획에 동시에
속할 수 없게 되므로, 지금 구조가 의도된 것이라면 그대로 두는 편이 낫다.

## 4. 확인이 필요한 것

1. **`person` 테이블** — 지역·생년월일·**별세일자**를 갖는다. 주식 규율 관리에서
   이 셋이 어떤 역할인지 DDL 만으로는 읽히지 않는다. 일단 SQL 그대로 만들어 뒀다.
2. **`broker_accounts` 에 `user_id` 가 없다.** 투자 도메인 테이블 전체에 유저 참조가
   없어서, 지금 구조는 **단일 사용자 전용**이다. 여러 사용자가 쓸 계획이면
   `broker_accounts.user_id` 를 추가하는 것이 가장 적은 변경으로 끝난다
   (나머지는 전부 계좌를 타고 내려간다).
3. **`orders` 에 계획 참조가 없다.** 그래서 이행↔계획 대조를 종목+날짜로 추정한다
   (`services/execution_service.py`). `orders.daily_plan_id` 가 있으면 추정이 아니라
   사실이 된다.
