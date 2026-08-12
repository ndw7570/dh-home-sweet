-- 주식원칙관리
CREATE SCHEMA "investment_discipline";

-- 게시글
CREATE TABLE "investment_discipline"."posts"
(
    "posts_id"           SERIAL       NOT NULL, -- 게시글ID
    "user_id"            VARCHAR(200) NOT NULL, -- 유저ID
    "posts_type"         VARCHAR(20)  NULL,     -- 게시판유형
    "sort_order"         INTEGER      NULL,     -- 노출순서
    "title"              VARCHAR(200) NULL,     -- 제목
    "content"            TEXT         NULL,     -- 본문
    "is_pinned"          BOOLEAN      NOT NULL, -- 상단고정여부
    "view_count"         INTEGER      NULL,     -- 조회수
    "comment_count"      INTEGER      NULL,     -- 댓글수
    "like_count"         INTEGER      NULL,     -- 좋아요수
    "attachment_file_id" INTEGER      NULL,     -- 첨부파일ID
    "created_at"         DATE         NULL,     -- 생성일
    "updated_at"         DATE         NULL,     -- 수정일
    "deleted_at"         DATE         NULL,     -- 삭제일
    "remarks"            TEXT         NULL,     -- 비고
    "is_deleted"         BOOLEAN      NOT NULL  -- 삭제여부
);

CREATE UNIQUE INDEX "PK_posts" ON "investment_discipline"."posts" ("posts_id" ASC NULLS LAST);
ALTER TABLE "investment_discipline"."posts" ADD CONSTRAINT "PK_posts" PRIMARY KEY USING INDEX "PK_posts" NOT DEFERRABLE;

-- 댓글/대댓글
CREATE TABLE "investment_discipline"."comments"
(
    "comments_id" SERIAL       NOT NULL,
    "posts_id"    INTEGER      NULL,
    "reply_count" INTEGER      NULL,
    "depth"       INTEGER      NULL,
    "user_id"     VARCHAR(200) NULL,
    "parent_id"   VARCHAR(200) NULL,
    "content"     TEXT         NULL,
    "like_count"  INTEGER      NULL,
    "created_at"  DATE         NULL,
    "updated_at"  DATE         NULL,
    "deleted_at"  DATE         NULL,
    "remarks"     TEXT         NULL,
    "is_deleted"  BOOLEAN      NOT NULL
);
CREATE UNIQUE INDEX "PK_comments" ON "investment_discipline"."comments" ("comments_id" ASC NULLS LAST);
ALTER TABLE "investment_discipline"."comments" ADD CONSTRAINT "PK_comments" PRIMARY KEY USING INDEX "PK_comments" NOT DEFERRABLE;

-- 댓글좋아요
CREATE TABLE "investment_discipline"."comments_like"
(
    "comments_like_id" SERIAL       NOT NULL,
    "comments_id"      INTEGER      NOT NULL,
    "user_id"          VARCHAR(200) NULL,
    "remarks"          TEXT         NULL,
    "is_deleted"       BOOLEAN      NOT NULL
);
CREATE UNIQUE INDEX "PK_comments_like" ON "investment_discipline"."comments_like" ("comments_like_id" ASC NULLS LAST);
ALTER TABLE "investment_discipline"."comments_like" ADD CONSTRAINT "PK_comments_like" PRIMARY KEY USING INDEX "PK_comments_like" NOT DEFERRABLE;

-- 게시글좋아요
CREATE TABLE "investment_discipline"."posts_like"
(
    "posts_like_id" SERIAL       NOT NULL,
    "posts_id"      INTEGER      NOT NULL,
    "user_id"       VARCHAR(200) NULL,
    "remarks"       TEXT         NULL,
    "is_deleted"    BOOLEAN      NOT NULL
);
CREATE UNIQUE INDEX "PK_posts_like" ON "investment_discipline"."posts_like" ("posts_like_id" ASC NULLS LAST);
ALTER TABLE "investment_discipline"."posts_like" ADD CONSTRAINT "PK_posts_like" PRIMARY KEY USING INDEX "PK_posts_like" NOT DEFERRABLE;

-- 첨부파일
CREATE TABLE "investment_discipline"."attachment_files"
(
    "attachment_file_id" SERIAL       NOT NULL,
    "attachment_table"   VARCHAR(200) NOT NULL,
    "search_id"          INTEGER      NOT NULL,
    "file_url"           TEXT         NOT NULL,
    "file_name"          VARCHAR(200) NOT NULL,
    "file_size"          INTEGER      NOT NULL,
    "mime_type"          VARCHAR(100) NOT NULL,
    "sort_order"         INTEGER      NULL,
    "created_at"         DATE         NULL,
    "updated_at"         DATE         NULL,
    "remarks"            TEXT         NULL,
    "is_deleted"         BOOLEAN      NOT NULL
);
CREATE UNIQUE INDEX "PK_attachment_files" ON "investment_discipline"."attachment_files" ("attachment_file_id" ASC NULLS LAST);
ALTER TABLE "investment_discipline"."attachment_files" ADD CONSTRAINT "PK_attachment_files" PRIMARY KEY USING INDEX "PK_attachment_files" NOT DEFERRABLE;

-- 유저
CREATE TABLE "investment_discipline"."user_profile"
(
    "user_id"      VARCHAR(200) NOT NULL,
    "first_name"   VARCHAR(100) NULL,
    "last_name"    VARCHAR(100) NULL,
    "phone_number" VARCHAR(30)  NOT NULL,
    "created_at"   DATE         NULL,
    "updated_at"   DATE         NULL,
    "remarks"      TEXT         NULL,
    "is_deleted"   BOOLEAN      NOT NULL
);
CREATE UNIQUE INDEX "PK_user_profile" ON "investment_discipline"."user_profile" ("user_id" ASC NULLS LAST);
ALTER TABLE "investment_discipline"."user_profile" ADD CONSTRAINT "PK_user_profile" PRIMARY KEY USING INDEX "PK_user_profile" NOT DEFERRABLE;

-- 사람
CREATE TABLE "investment_discipline"."person"
(
    "person_id"  SERIAL       NOT NULL,
    "user_id"    VARCHAR(200) NULL,
    "first_name" VARCHAR(100) NULL,
    "last_name"  VARCHAR(100) NULL,
    "region"     VARCHAR(100) NULL,
    "birth_date" DATE         NULL,
    "death_date" DATE         NULL,
    "created_at" DATE         NULL,
    "updated_at" DATE         NULL,
    "remarks"    TEXT         NULL,
    "is_deleted" BOOLEAN      NOT NULL
);
CREATE UNIQUE INDEX "PK_person" ON "investment_discipline"."person" ("person_id" ASC NULLS LAST);
ALTER TABLE "investment_discipline"."person" ADD CONSTRAINT "PK_person" PRIMARY KEY USING INDEX "PK_person" NOT DEFERRABLE;

-- 연투자계획
CREATE TABLE "investment_discipline"."annual_investment_plan"
(
    "id"                  SERIAL       NOT NULL,
    "account_id"          INTEGER      NOT NULL,
    "market"              VARCHAR(20)  NOT NULL,
    "title"               VARCHAR(200) NOT NULL,
    "thesis"              TEXT         NOT NULL,
    "direction"           VARCHAR(20)  NOT NULL,
    "status"              VARCHAR(20)  NOT NULL,
    "valid_from"          DATE         NOT NULL,
    "valid_until"         DATE         NOT NULL,
    "target_return_ratio" NUMERIC(5,2) NULL,
    "stop_loss_ratio"     NUMERIC(5,2) NULL,
    "created_at"          DATE         NULL,
    "updated_at"          DATE         NULL,
    "remarks"             TEXT         NULL,
    "is_deleted"          BOOLEAN      NOT NULL
);
CREATE UNIQUE INDEX "PK_annual_investment_plan" ON "investment_discipline"."annual_investment_plan" ("id" ASC NULLS LAST);
ALTER TABLE "investment_discipline"."annual_investment_plan" ADD CONSTRAINT "PK_annual_investment_plan" PRIMARY KEY USING INDEX "PK_annual_investment_plan" NOT DEFERRABLE;

-- 종목
CREATE TABLE "investment_discipline"."securities"
(
    "id"               SERIAL        NOT NULL,
    "account_id"       INTEGER       NOT NULL,
    "market"           VARCHAR(20)   NOT NULL,
    "symbol"           VARCHAR(30)   NOT NULL,
    "name"             VARCHAR(200)  NOT NULL,
    "asset_type"       VARCHAR(20)   NOT NULL,
    "currency"         VARCHAR(3)    NOT NULL,
    "holding_quantity" INTEGER       NULL,
    "current_price"    NUMERIC(15,2) NULL,
    "sector"           VARCHAR(100)  NULL,
    "remarks"          TEXT          NULL,
    "created_at"       DATE          NULL,
    "updated_at"       DATE          NULL,
    "is_active"        BOOLEAN       NOT NULL,
    "is_deleted"       BOOLEAN       NOT NULL
);
CREATE UNIQUE INDEX "PK_securities" ON "investment_discipline"."securities" ("id" ASC NULLS LAST);
ALTER TABLE "investment_discipline"."securities" ADD CONSTRAINT "PK_securities" PRIMARY KEY USING INDEX "PK_securities" NOT DEFERRABLE;

-- 이행
CREATE TABLE "investment_discipline"."orders"
(
    "id"          SERIAL        NOT NULL,
    "security_id" INTEGER       NULL,
    "action_type" VARCHAR(20)   NULL,
    "order_type"  VARCHAR(20)   NULL,
    "side"        VARCHAR(20)   NULL,
    "quantity"    INTEGER       NULL,
    "limit_price" NUMERIC(15,2) NULL,
    "executed_at" TIMESTAMP     NULL,
    "remarks"     TEXT          NULL,
    "is_deleted"  BOOLEAN       NOT NULL,
    "created_at"  DATE          NULL
);
CREATE UNIQUE INDEX "PK_orders" ON "investment_discipline"."orders" ("id" ASC NULLS LAST);
ALTER TABLE "investment_discipline"."orders" ADD CONSTRAINT "PK_orders" PRIMARY KEY USING INDEX "PK_orders" NOT DEFERRABLE;

-- 성과
CREATE TABLE "investment_discipline"."performance_records"
(
    "id"                    SERIAL        NOT NULL,
    "security_id"           INTEGER       NULL,
    "period_type"           VARCHAR(20)   NULL,
    "period_start"          DATE          NULL,
    "period_end"            DATE          NULL,
    "realized_profit"       NUMERIC(15,2) NULL,
    "unrealized_profit"     NUMERIC(15,2) NULL,
    "dividend_income"       NUMERIC(15,2) NULL,
    "interest_cost"         NUMERIC(15,2) NULL,
    "commission"            NUMERIC(15,2) NULL,
    "tax"                   NUMERIC(15,2) NULL,
    "etc_cost"              NUMERIC(15,2) NULL,
    "net_profit"            NUMERIC(15,2) NULL,
    "return_rate"           NUMERIC(5,2)  NULL,
    "benchmark_return_rate" NUMERIC(5,2)  NULL,
    "max_drawdown"          NUMERIC(5,2)  NULL,
    "created_at"            DATE          NULL,
    "updated_at"            DATE          NULL,
    "remarks"               TEXT          NULL,
    "is_deleted"            BOOLEAN       NOT NULL
);
CREATE UNIQUE INDEX "PK_performance_records" ON "investment_discipline"."performance_records" ("id" ASC NULLS LAST);
ALTER TABLE "investment_discipline"."performance_records" ADD CONSTRAINT "PK_performance_records" PRIMARY KEY USING INDEX "PK_performance_records" NOT DEFERRABLE;

-- AI모델
CREATE TABLE "investment_discipline"."ai_model_runs"
(
    "id"                  SERIAL       NOT NULL,
    "model_name"          VARCHAR(200) NULL,
    "model_version"       VARCHAR(100) NULL,
    "prompt_version"      VARCHAR(100) NULL,
    "started_at"          TIMESTAMP    NULL,
    "completed_at"        TIMESTAMP    NULL,
    "input_snapshot_json" JSONB        NULL,
    "output_json"         JSONB        NULL,
    "status"              VARCHAR(20)  NULL,
    "created_at"          DATE         NULL,
    "updated_at"          DATE         NULL,
    "remarks"             TEXT         NULL,
    "is_deleted"          BOOLEAN      NOT NULL
);
CREATE UNIQUE INDEX "PK_ai_model_runs" ON "investment_discipline"."ai_model_runs" ("id" ASC NULLS LAST);
ALTER TABLE "investment_discipline"."ai_model_runs" ADD CONSTRAINT "PK_ai_model_runs" PRIMARY KEY USING INDEX "PK_ai_model_runs" NOT DEFERRABLE;

-- 투자원칙
CREATE TABLE "investment_discipline"."investment_principles"
(
    "id"             SERIAL       NOT NULL,
    "source_id"      INTEGER      NULL,
    "teacher_name"   VARCHAR(200) NULL,
    "principle_type" VARCHAR(20)  NULL,
    "content"        TEXT         NULL,
    "rationale"      TEXT         NULL,
    "cautions"       TEXT         NULL,
    "created_at"     DATE         NULL,
    "remarks"        TEXT         NULL,
    "updated_at"     DATE         NULL,
    "is_deleted"     BOOLEAN      NOT NULL
);
CREATE UNIQUE INDEX "PK_investment_principles" ON "investment_discipline"."investment_principles" ("id" ASC NULLS LAST);
ALTER TABLE "investment_discipline"."investment_principles" ADD CONSTRAINT "PK_investment_principles" PRIMARY KEY USING INDEX "PK_investment_principles" NOT DEFERRABLE;

-- 투자원칙소스
CREATE TABLE "investment_discipline"."principle_sources"
(
    "id"          SERIAL       NOT NULL,
    "name"        VARCHAR(200) NULL,
    "source_type" VARCHAR(20)  NULL,
    "url"         TEXT         NULL,
    "content"     TEXT         NULL,
    "remarks"     TEXT         NULL,
    "updated_at"  DATE         NULL,
    "created_at"  DATE         NULL,
    "is_deleted"  BOOLEAN      NOT NULL
);
CREATE UNIQUE INDEX "PK_principle_sources" ON "investment_discipline"."principle_sources" ("id" ASC NULLS LAST);
ALTER TABLE "investment_discipline"."principle_sources" ADD CONSTRAINT "PK_principle_sources" PRIMARY KEY USING INDEX "PK_principle_sources" NOT DEFERRABLE;

-- 증권사계좌
CREATE TABLE "investment_discipline"."broker_accounts"
(
    "id"             SERIAL       NOT NULL,
    "broker_name"    VARCHAR(100) NULL,
    "account_number" VARCHAR(100) NULL,
    "is_deleted"     BOOLEAN      NOT NULL
);
CREATE UNIQUE INDEX "PK_broker_accounts" ON "investment_discipline"."broker_accounts" ("id" ASC NULLS LAST);
ALTER TABLE "investment_discipline"."broker_accounts" ADD CONSTRAINT "PK_broker_accounts" PRIMARY KEY USING INDEX "PK_broker_accounts" NOT DEFERRABLE;

-- 종목담보대출
CREATE TABLE "investment_discipline"."securities_loans"
(
    "id"               SERIAL        NOT NULL,
    "security_id"      INTEGER       NOT NULL,
    "principal_amount" NUMERIC(15,2) NULL,
    "interest_rate"    NUMERIC(5,2)  NULL,
    "opened_at"        DATE          NULL,
    "maturity_at"      DATE          NULL,
    "quantity"         INTEGER       NULL,
    "reference_price"  NUMERIC(15,2) NULL,
    "collateral_value" NUMERIC(15,2) NULL,
    "collateral_ratio" NUMERIC(5,2)  NULL,
    "evaluated_at"     TIMESTAMP     NULL,
    "is_deleted"       BOOLEAN       NOT NULL
);
CREATE UNIQUE INDEX "PK_securities_loans" ON "investment_discipline"."securities_loans" ("id" ASC NULLS LAST);
ALTER TABLE "investment_discipline"."securities_loans" ADD CONSTRAINT "PK_securities_loans" PRIMARY KEY USING INDEX "PK_securities_loans" NOT DEFERRABLE;

-- 매수매도방법
CREATE TABLE "investment_discipline"."trading_strategy_methods"
(
    "id"             SERIAL       NOT NULL,
    "strategy_id"    INTEGER      NULL,
    "strategy_type"  VARCHAR(20)  NULL,
    "step_no"        INTEGER      NULL,
    "price_ratio"    NUMERIC(5,2) NULL,
    "quantity_ratio" NUMERIC(5,2) NULL,
    "sector"         VARCHAR(100) NULL,
    "created_at"     DATE         NULL,
    "updated_at"     DATE         NULL,
    "remarks"        TEXT         NULL,
    "is_deleted"     BOOLEAN      NOT NULL
);
CREATE UNIQUE INDEX "PK_trading_strategy_methods" ON "investment_discipline"."trading_strategy_methods" ("id" ASC NULLS LAST);
ALTER TABLE "investment_discipline"."trading_strategy_methods" ADD CONSTRAINT "PK_trading_strategy_methods" PRIMARY KEY USING INDEX "PK_trading_strategy_methods" NOT DEFERRABLE;

-- 분기투자계획
CREATE TABLE "investment_discipline"."quarterly_investment_plan"
(
    "id"                     SERIAL       NOT NULL,
    "annual_plan_id"         INTEGER      NULL,
    "title"                  VARCHAR(200) NOT NULL,
    "rebalancing_ratio"      JSONB        NULL,
    "rebalancing_start_date" DATE         NULL,
    "rebalancing_end_date"   DATE         NULL,
    "buy_strategy"           TEXT         NULL,
    "sell_strategy"          TEXT         NULL,
    "sideways_strategy"      TEXT         NULL,
    "stop_loss_strategy"     TEXT         NULL,
    "direction"              VARCHAR(20)  NOT NULL,
    "thesis"                 TEXT         NOT NULL,
    "valid_from"             DATE         NOT NULL,
    "valid_until"            DATE         NOT NULL,
    "target_return_ratio"    NUMERIC(5,2) NULL,
    "stop_loss_ratio"        NUMERIC(5,2) NULL,
    "created_at"             DATE         NULL,
    "updated_at"             DATE         NULL,
    "remarks"                TEXT         NULL,
    "is_deleted"             BOOLEAN      NOT NULL
);
CREATE UNIQUE INDEX "PK_quarterly_investment_plan" ON "investment_discipline"."quarterly_investment_plan" ("id" ASC NULLS LAST);
ALTER TABLE "investment_discipline"."quarterly_investment_plan" ADD CONSTRAINT "PK_quarterly_investment_plan" PRIMARY KEY USING INDEX "PK_quarterly_investment_plan" NOT DEFERRABLE;

-- 월투자계획
CREATE TABLE "investment_discipline"."monthly_investment_plan"
(
    "id"                SERIAL       NOT NULL,
    "quarterly_plan_id" INTEGER      NULL,
    "title"             VARCHAR(200) NOT NULL,
    "scenario_planning" VARCHAR(20)  NOT NULL,
    "predicted_trend"   VARCHAR(20)  NOT NULL,
    "thesis"            TEXT         NOT NULL,
    "confidence_score"  INTEGER      NULL,
    "allocation_ratio"  JSONB        NULL,
    "valid_from"        DATE         NOT NULL,
    "valid_until"       DATE         NOT NULL,
    "created_at"        DATE         NULL,
    "updated_at"        DATE         NULL,
    "remarks"           TEXT         NULL,
    "is_deleted"        BOOLEAN      NOT NULL
);
CREATE UNIQUE INDEX "PK_monthly_investment_plan" ON "investment_discipline"."monthly_investment_plan" ("id" ASC NULLS LAST);
ALTER TABLE "investment_discipline"."monthly_investment_plan" ADD CONSTRAINT "PK_monthly_investment_plan" PRIMARY KEY USING INDEX "PK_monthly_investment_plan" NOT DEFERRABLE;

-- 월투자원칙
CREATE TABLE "investment_discipline"."monthly_investment_principles"
(
    "id"              SERIAL        NOT NULL,
    "monthly_plan_id" INTEGER       NULL,
    "security_id"     INTEGER       NULL,
    "direction"       VARCHAR(20)   NULL,
    "rationale"       TEXT          NULL,
    "predicted_price" NUMERIC(15,2) NULL,
    "stop_loss_price" NUMERIC(15,2) NULL,
    "updated_at"      DATE          NULL,
    "remarks"         TEXT          NULL,
    "is_deleted"      BOOLEAN       NOT NULL,
    "created_at"      DATE          NULL
);
CREATE UNIQUE INDEX "PK_monthly_investment_principles" ON "investment_discipline"."monthly_investment_principles" ("id" ASC NULLS LAST);
ALTER TABLE "investment_discipline"."monthly_investment_principles" ADD CONSTRAINT "PK_monthly_investment_principles" PRIMARY KEY USING INDEX "PK_monthly_investment_principles" NOT DEFERRABLE;

-- 주투자계획 (기간만 잡는 그룹, 종목 정보 없음)
CREATE TABLE "investment_discipline"."weekly_investment_plan"
(
    "id"                SERIAL       NOT NULL,
    "monthly_plan_id"   INTEGER      NULL,
    "title"             VARCHAR(200) NOT NULL,
    "scenario_planning" VARCHAR(20)  NOT NULL,
    "predicted_trend"   VARCHAR(20)  NOT NULL,
    "thesis"            TEXT         NOT NULL,
    "confidence_score"  INTEGER      NULL,
    "allocation_ratio"  JSONB        NULL,
    "valid_from"        DATE         NOT NULL,
    "valid_until"       DATE         NOT NULL,
    "created_at"        DATE         NULL,
    "updated_at"        DATE         NULL,
    "remarks"           TEXT         NULL,
    "is_deleted"        BOOLEAN      NOT NULL
);
CREATE UNIQUE INDEX "PK_weekly_investment_plan" ON "investment_discipline"."weekly_investment_plan" ("id" ASC NULLS LAST);
ALTER TABLE "investment_discipline"."weekly_investment_plan" ADD CONSTRAINT "PK_weekly_investment_plan" PRIMARY KEY USING INDEX "PK_weekly_investment_plan" NOT DEFERRABLE;

-- 일투자계획 (부모: 주투자종목별계획)
CREATE TABLE "investment_discipline"."daily_investment_plan"
(
    "id"                      SERIAL        NOT NULL,
    "weekly_security_plan_id" INTEGER       NULL,
    "title"                   VARCHAR(200)  NOT NULL,
    "scenario_planning"       VARCHAR(20)   NOT NULL,
    "predicted_trend"         VARCHAR(20)   NOT NULL,
    "thesis"                  TEXT          NOT NULL,
    "confidence_score"        INTEGER       NULL,
    "allocation_ratio"        JSONB         NULL,
    "valid_from"              DATE          NOT NULL,
    "valid_until"             DATE          NOT NULL,
    "predicted_price"         NUMERIC(15,2) NULL,
    "stop_loss_price"         NUMERIC(15,2) NULL,
    "created_at"              DATE          NULL,
    "updated_at"              DATE          NULL,
    "remarks"                 TEXT          NULL,
    "is_deleted"              BOOLEAN       NOT NULL
);
CREATE UNIQUE INDEX "PK_daily_investment_plan" ON "investment_discipline"."daily_investment_plan" ("id" ASC NULLS LAST);
ALTER TABLE "investment_discipline"."daily_investment_plan" ADD CONSTRAINT "PK_daily_investment_plan" PRIMARY KEY USING INDEX "PK_daily_investment_plan" NOT DEFERRABLE;

-- 분기투자원칙
CREATE TABLE "investment_discipline"."quarterly_investment_principles"
(
    "id"                      SERIAL        NOT NULL,
    "quarterly_plan_id"       INTEGER       NULL,
    "security_id"             INTEGER       NULL,
    "predicted_price"         NUMERIC(15,2) NULL,
    "stop_loss_price"         NUMERIC(15,2) NULL,
    "revenue"                 NUMERIC(15,2) NULL,
    "revenue_growth_rate"     NUMERIC(5,2)  NULL,
    "new_orders_amount"       NUMERIC(15,2) NULL,
    "order_backlog"           NUMERIC(15,2) NULL,
    "operating_margin"        NUMERIC(5,2)  NULL,
    "net_income"              NUMERIC(15,2) NULL,
    "roe"                     NUMERIC(5,2)  NULL,
    "roic"                    NUMERIC(5,2)  NULL,
    "free_cash_flow"          NUMERIC(15,2) NULL,
    "cash_conversion_rate"    NUMERIC(5,2)  NULL,
    "interest_coverage_ratio" NUMERIC(5,2)  NULL,
    "per"                     NUMERIC(5,2)  NULL,
    "pbr"                     NUMERIC(5,2)  NULL,
    "ev_ebitda"               NUMERIC(5,2)  NULL,
    "psr"                     NUMERIC(5,2)  NULL,
    "fcf_yield"               NUMERIC(5,2)  NULL,
    "valuation_type"          VARCHAR(20)   NULL,
    "performance_summary"     TEXT          NULL,
    "is_deleted"              BOOLEAN       NOT NULL
);
CREATE UNIQUE INDEX "PK_quarterly_investment_principles" ON "investment_discipline"."quarterly_investment_principles" ("id" ASC NULLS LAST);
ALTER TABLE "investment_discipline"."quarterly_investment_principles" ADD CONSTRAINT "PK_quarterly_investment_principles" PRIMARY KEY USING INDEX "PK_quarterly_investment_principles" NOT DEFERRABLE;

-- 시장방향
CREATE TABLE "investment_discipline"."market_directions"
(
    "id"               SERIAL       NOT NULL,
    "direction"        VARCHAR(20)  NULL,
    "factor_type"      VARCHAR(20)  NULL,
    "content"          TEXT         NULL,
    "rationale"        TEXT         NULL,
    "factor_value"     NUMERIC(5,2) NULL,
    "affected_targets" JSONB        NULL,
    "created_at"       DATE         NULL,
    "updated_at"       DATE         NULL,
    "remarks"          TEXT         NULL,
    "is_deleted"       BOOLEAN      NOT NULL
);
CREATE UNIQUE INDEX "PK_market_directions" ON "investment_discipline"."market_directions" ("id" ASC NULLS LAST);
ALTER TABLE "investment_discipline"."market_directions" ADD CONSTRAINT "PK_market_directions" PRIMARY KEY USING INDEX "PK_market_directions" NOT DEFERRABLE;

-- 매수매도전략
CREATE TABLE "investment_discipline"."trading_strategies"
(
    "id"            SERIAL       NOT NULL,
    "price_data_id" INTEGER      NULL,
    "policy_name"   VARCHAR(200) NULL,
    "sector"        VARCHAR(100) NULL,
    "created_at"    DATE         NULL,
    "updated_at"    DATE         NULL,
    "remarks"       TEXT         NULL,
    "is_deleted"    BOOLEAN      NOT NULL,
    "reference_at"  TIMESTAMP    NULL
);
CREATE UNIQUE INDEX "PK_trading_strategies" ON "investment_discipline"."trading_strategies" ("id" ASC NULLS LAST);
ALTER TABLE "investment_discipline"."trading_strategies" ADD CONSTRAINT "PK_trading_strategies" PRIMARY KEY USING INDEX "PK_trading_strategies" NOT DEFERRABLE;

-- 나의필수원칙
CREATE TABLE "investment_discipline"."mandatory_principles"
(
    "id"         SERIAL  NOT NULL,
    "priority"   INTEGER NULL,
    "content"    TEXT    NULL,
    "remarks"    TEXT    NULL,
    "created_at" DATE    NULL,
    "updated_at" DATE    NULL,
    "is_deleted" BOOLEAN NOT NULL
);
CREATE UNIQUE INDEX "PK_mandatory_principles" ON "investment_discipline"."mandatory_principles" ("id" ASC NULLS LAST);
ALTER TABLE "investment_discipline"."mandatory_principles" ADD CONSTRAINT "PK_mandatory_principles" PRIMARY KEY USING INDEX "PK_mandatory_principles" NOT DEFERRABLE;

-- 일별가격데이터
CREATE TABLE "investment_discipline"."daily_security_price_data"
(
    "id"          SERIAL        NOT NULL,
    "security_id" INTEGER       NULL,
    "price_at"    TIMESTAMP     NULL,
    "high_price"  NUMERIC(15,2) NULL,
    "low_price"   NUMERIC(15,2) NULL,
    "quote_price" NUMERIC(15,2) NULL,
    "created_at"  DATE          NULL,
    "updated_at"  DATE          NULL,
    "remarks"     TEXT          NULL,
    "is_deleted"  BOOLEAN       NOT NULL
);
CREATE UNIQUE INDEX "PK_daily_security_price_data" ON "investment_discipline"."daily_security_price_data" ("id" ASC NULLS LAST);
ALTER TABLE "investment_discipline"."daily_security_price_data" ADD CONSTRAINT "PK_daily_security_price_data" PRIMARY KEY USING INDEX "PK_daily_security_price_data" NOT DEFERRABLE;

-- 영향종목
CREATE TABLE "investment_discipline"."affected_securities"
(
    "affected_security_id" SERIAL  NOT NULL,
    "market_directions_id" INTEGER NULL,
    "security_id"          INTEGER NOT NULL,
    "created_at"           DATE    NULL,
    "updated_at"           DATE    NULL,
    "remarks"              TEXT    NULL,
    "is_deleted"           BOOLEAN NOT NULL
);
CREATE UNIQUE INDEX "PK_affected_securities" ON "investment_discipline"."affected_securities" ("affected_security_id" ASC NULLS LAST);
ALTER TABLE "investment_discipline"."affected_securities" ADD CONSTRAINT "PK_affected_securities" PRIMARY KEY USING INDEX "PK_affected_securities" NOT DEFERRABLE;

-- AI피드백의견
CREATE TABLE "investment_discipline"."ai_decision_feedback"
(
    "id"                SERIAL       NOT NULL,
    "model_id"          INTEGER      NULL,
    "opinion_type"      VARCHAR(20)  NULL,
    "object_id"         INTEGER      NULL,
    "table_name"        VARCHAR(200) NULL,
    "ai_decision"       TEXT         NULL,
    "score"             NUMERIC(5,2) NULL,
    "confidence_score"  NUMERIC(5,2) NULL,
    "reasoning_summary" TEXT         NULL,
    "risk_summary"      TEXT         NULL,
    "valid_until"       DATE         NULL,
    "created_at"        DATE         NULL,
    "updated_at"        DATE         NULL,
    "remarks"           TEXT         NULL,
    "is_deleted"        BOOLEAN      NOT NULL
);
CREATE UNIQUE INDEX "PK_ai_decision_feedback" ON "investment_discipline"."ai_decision_feedback" ("id" ASC NULLS LAST);
ALTER TABLE "investment_discipline"."ai_decision_feedback" ADD CONSTRAINT "PK_ai_decision_feedback" PRIMARY KEY USING INDEX "PK_ai_decision_feedback" NOT DEFERRABLE;

-- 주투자종목별계획
CREATE TABLE "investment_discipline"."weekly_security_investment_plan"
(
    "id"                SERIAL        NOT NULL,
    "weekly_plan_id"    INTEGER       NOT NULL,
    "security_id"       INTEGER       NOT NULL,
    "title"             VARCHAR(200)  NOT NULL,
    "scenario_planning" VARCHAR(20)   NOT NULL,
    "available_amount"  NUMERIC(15,2) NULL,
    "predicted_trend"   VARCHAR(20)   NOT NULL,
    "thesis"            TEXT          NOT NULL,
    "confidence_score"  INTEGER       NULL,
    "allocation_ratio"  JSONB         NULL,
    "predicted_price"   NUMERIC(15,2) NULL,
    "stop_loss_price"   NUMERIC(15,2) NULL,
    "created_at"        DATE          NULL,
    "updated_at"        DATE          NULL,
    "remarks"           TEXT          NULL,
    "is_deleted"        BOOLEAN       NOT NULL
);
CREATE UNIQUE INDEX "PK_weekly_security_investment_plan" ON "investment_discipline"."weekly_security_investment_plan" ("id" ASC NULLS LAST);
ALTER TABLE "investment_discipline"."weekly_security_investment_plan" ADD CONSTRAINT "PK_weekly_security_investment_plan" PRIMARY KEY USING INDEX "PK_weekly_security_investment_plan" NOT DEFERRABLE;

-- ─────────────────────────────────────────────
-- FOREIGN KEYS
-- ─────────────────────────────────────────────
ALTER TABLE "investment_discipline"."posts" ADD CONSTRAINT "FK_user_profile_TO_posts" FOREIGN KEY ("user_id") REFERENCES "investment_discipline"."user_profile" ("user_id");
ALTER TABLE "investment_discipline"."comments" ADD CONSTRAINT "FK_posts_TO_comments" FOREIGN KEY ("posts_id") REFERENCES "investment_discipline"."posts" ("posts_id");
ALTER TABLE "investment_discipline"."comments_like" ADD CONSTRAINT "FK_comments_TO_comments_like" FOREIGN KEY ("comments_id") REFERENCES "investment_discipline"."comments" ("comments_id");
ALTER TABLE "investment_discipline"."posts_like" ADD CONSTRAINT "FK_posts_TO_posts_like" FOREIGN KEY ("posts_id") REFERENCES "investment_discipline"."posts" ("posts_id");
ALTER TABLE "investment_discipline"."person" ADD CONSTRAINT "FK_user_profile_TO_person" FOREIGN KEY ("user_id") REFERENCES "investment_discipline"."user_profile" ("user_id");
ALTER TABLE "investment_discipline"."annual_investment_plan" ADD CONSTRAINT "FK_broker_accounts_TO_annual_investment_plan" FOREIGN KEY ("account_id") REFERENCES "investment_discipline"."broker_accounts" ("id");
ALTER TABLE "investment_discipline"."securities" ADD CONSTRAINT "FK_broker_accounts_TO_securities" FOREIGN KEY ("account_id") REFERENCES "investment_discipline"."broker_accounts" ("id");
ALTER TABLE "investment_discipline"."orders" ADD CONSTRAINT "FK_securities_TO_orders" FOREIGN KEY ("security_id") REFERENCES "investment_discipline"."securities" ("id");
ALTER TABLE "investment_discipline"."investment_principles" ADD CONSTRAINT "FK_principle_sources_TO_investment_principles" FOREIGN KEY ("source_id") REFERENCES "investment_discipline"."principle_sources" ("id");
ALTER TABLE "investment_discipline"."trading_strategy_methods" ADD CONSTRAINT "FK_trading_strategies_TO_trading_strategy_methods" FOREIGN KEY ("strategy_id") REFERENCES "investment_discipline"."trading_strategies" ("id");
ALTER TABLE "investment_discipline"."quarterly_investment_plan" ADD CONSTRAINT "FK_annual_investment_plan_TO_quarterly_investment_plan" FOREIGN KEY ("annual_plan_id") REFERENCES "investment_discipline"."annual_investment_plan" ("id");
ALTER TABLE "investment_discipline"."monthly_investment_plan" ADD CONSTRAINT "FK_quarterly_investment_plan_TO_monthly_investment_plan" FOREIGN KEY ("quarterly_plan_id") REFERENCES "investment_discipline"."quarterly_investment_plan" ("id");
ALTER TABLE "investment_discipline"."monthly_investment_principles" ADD CONSTRAINT "FK_monthly_investment_plan_TO_monthly_investment_principles" FOREIGN KEY ("monthly_plan_id") REFERENCES "investment_discipline"."monthly_investment_plan" ("id");
ALTER TABLE "investment_discipline"."weekly_investment_plan" ADD CONSTRAINT "FK_monthly_investment_plan_TO_weekly_investment_plan" FOREIGN KEY ("monthly_plan_id") REFERENCES "investment_discipline"."monthly_investment_plan" ("id");
ALTER TABLE "investment_discipline"."daily_investment_plan" ADD CONSTRAINT "FK_weekly_security_investment_plan_TO_daily_investment_plan" FOREIGN KEY ("weekly_security_plan_id") REFERENCES "investment_discipline"."weekly_security_investment_plan" ("id");
ALTER TABLE "investment_discipline"."quarterly_investment_principles" ADD CONSTRAINT "FK_quarterly_investment_plan_TO_quarterly_investment_principles" FOREIGN KEY ("quarterly_plan_id") REFERENCES "investment_discipline"."quarterly_investment_plan" ("id");
ALTER TABLE "investment_discipline"."trading_strategies" ADD CONSTRAINT "FK_daily_security_price_data_TO_trading_strategies" FOREIGN KEY ("price_data_id") REFERENCES "investment_discipline"."daily_security_price_data" ("id");
ALTER TABLE "investment_discipline"."daily_security_price_data" ADD CONSTRAINT "FK_securities_TO_daily_security_price_data" FOREIGN KEY ("security_id") REFERENCES "investment_discipline"."securities" ("id");
ALTER TABLE "investment_discipline"."affected_securities" ADD CONSTRAINT "FK_market_directions_TO_affected_securities" FOREIGN KEY ("market_directions_id") REFERENCES "investment_discipline"."market_directions" ("id");
ALTER TABLE "investment_discipline"."ai_decision_feedback" ADD CONSTRAINT "FK_ai_model_runs_TO_ai_decision_feedback" FOREIGN KEY ("model_id") REFERENCES "investment_discipline"."ai_model_runs" ("id");
ALTER TABLE "investment_discipline"."weekly_security_investment_plan" ADD CONSTRAINT "FK_weekly_investment_plan_TO_weekly_security_investment_plan" FOREIGN KEY ("weekly_plan_id") REFERENCES "investment_discipline"."weekly_investment_plan" ("id");
