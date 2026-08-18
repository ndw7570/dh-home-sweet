-- 주식원칙관리
CREATE SCHEMA "trading_discipline_management";

-- 주식원칙관리
COMMENT ON SCHEMA "trading_discipline_management" IS '주식원칙관리';

-- 게시글
CREATE TABLE "trading_discipline_management"."posts"
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

-- 게시글
COMMENT ON TABLE "trading_discipline_management"."posts" IS '게시글';

-- 게시글ID
COMMENT ON COLUMN "trading_discipline_management"."posts"."posts_id" IS '게시글ID';

-- 유저ID
COMMENT ON COLUMN "trading_discipline_management"."posts"."user_id" IS '유저ID';

-- 게시판유형
COMMENT ON COLUMN "trading_discipline_management"."posts"."posts_type" IS '게시판유형';

-- 노출순서
COMMENT ON COLUMN "trading_discipline_management"."posts"."sort_order" IS '노출순서';

-- 제목
COMMENT ON COLUMN "trading_discipline_management"."posts"."title" IS '제목';

-- 본문
COMMENT ON COLUMN "trading_discipline_management"."posts"."content" IS '본문';

-- 상단고정여부
COMMENT ON COLUMN "trading_discipline_management"."posts"."is_pinned" IS '상단고정여부';

-- 조회수
COMMENT ON COLUMN "trading_discipline_management"."posts"."view_count" IS '조회수';

-- 댓글수
COMMENT ON COLUMN "trading_discipline_management"."posts"."comment_count" IS '댓글수';

-- 좋아요수
COMMENT ON COLUMN "trading_discipline_management"."posts"."like_count" IS '좋아요수';

-- 첨부파일ID
COMMENT ON COLUMN "trading_discipline_management"."posts"."attachment_file_id" IS '첨부파일ID';

-- 생성일
COMMENT ON COLUMN "trading_discipline_management"."posts"."created_at" IS '생성일';

-- 수정일
COMMENT ON COLUMN "trading_discipline_management"."posts"."updated_at" IS '수정일';

-- 삭제일
COMMENT ON COLUMN "trading_discipline_management"."posts"."deleted_at" IS '삭제일';

-- 비고
COMMENT ON COLUMN "trading_discipline_management"."posts"."remarks" IS '비고';

-- 삭제여부
COMMENT ON COLUMN "trading_discipline_management"."posts"."is_deleted" IS '삭제여부';

-- 게시글 기본키
CREATE UNIQUE INDEX "PK_posts"
	ON "trading_discipline_management"."posts"
	( -- 게시글
		"posts_id" ASC NULLS LAST -- 게시글ID
	);

-- 게시글 기본키
COMMENT ON INDEX "trading_discipline_management"."PK_posts" IS '게시글 기본키';

-- 게시글
ALTER TABLE "trading_discipline_management"."posts"
	ADD CONSTRAINT "PK_posts"
		-- 게시글 기본키
	PRIMARY KEY
	USING INDEX "PK_posts"
	NOT DEFERRABLE;

-- 게시글 기본키
COMMENT ON CONSTRAINT "PK_posts" ON "trading_discipline_management"."posts" IS '게시글 기본키';

-- 댓글/대댓글
CREATE TABLE "trading_discipline_management"."comments"
(
	"comments_id" SERIAL       NOT NULL, -- 댓글ID
	"posts_id"    INTEGER      NULL,     -- 게시글ID
	"reply_count" INTEGER      NULL,     -- 대댓글수
	"depth"       INTEGER      NULL,     -- 수준
	"user_id"     VARCHAR(200) NULL,     -- 유저ID
	"parent_id"   VARCHAR(200) NULL,     -- 부모ID
	"content"     TEXT         NULL,     -- 댓글내용
	"like_count"  INTEGER      NULL,     -- 댓글좋아요수
	"created_at"  DATE         NULL,     -- 생성일
	"updated_at"  DATE         NULL,     -- 수정일
	"deleted_at"  DATE         NULL,     -- 삭제일
	"remarks"     TEXT         NULL,     -- 비고
	"is_deleted"  BOOLEAN      NOT NULL  -- 삭제여부
);

-- 댓글/대댓글
COMMENT ON TABLE "trading_discipline_management"."comments" IS '댓글/대댓글';

-- 댓글ID
COMMENT ON COLUMN "trading_discipline_management"."comments"."comments_id" IS '댓글ID';

-- 게시글ID
COMMENT ON COLUMN "trading_discipline_management"."comments"."posts_id" IS '게시글ID';

-- 대댓글수
COMMENT ON COLUMN "trading_discipline_management"."comments"."reply_count" IS '대댓글수';

-- 수준
COMMENT ON COLUMN "trading_discipline_management"."comments"."depth" IS '수준';

-- 유저ID
COMMENT ON COLUMN "trading_discipline_management"."comments"."user_id" IS '유저ID';

-- 부모ID
COMMENT ON COLUMN "trading_discipline_management"."comments"."parent_id" IS '부모ID';

-- 댓글내용
COMMENT ON COLUMN "trading_discipline_management"."comments"."content" IS '댓글내용';

-- 댓글좋아요수
COMMENT ON COLUMN "trading_discipline_management"."comments"."like_count" IS '댓글좋아요수';

-- 생성일
COMMENT ON COLUMN "trading_discipline_management"."comments"."created_at" IS '생성일';

-- 수정일
COMMENT ON COLUMN "trading_discipline_management"."comments"."updated_at" IS '수정일';

-- 삭제일
COMMENT ON COLUMN "trading_discipline_management"."comments"."deleted_at" IS '삭제일';

-- 비고
COMMENT ON COLUMN "trading_discipline_management"."comments"."remarks" IS '비고';

-- 삭제여부
COMMENT ON COLUMN "trading_discipline_management"."comments"."is_deleted" IS '삭제여부';

-- 댓글/대댓글 기본키
CREATE UNIQUE INDEX "PK_comments"
	ON "trading_discipline_management"."comments"
	( -- 댓글/대댓글
		"comments_id" ASC NULLS LAST -- 댓글ID
	);

-- 댓글/대댓글 기본키
COMMENT ON INDEX "trading_discipline_management"."PK_comments" IS '댓글/대댓글 기본키';

-- 댓글/대댓글
ALTER TABLE "trading_discipline_management"."comments"
	ADD CONSTRAINT "PK_comments"
		-- 댓글/대댓글 기본키
	PRIMARY KEY
	USING INDEX "PK_comments"
	NOT DEFERRABLE;

-- 댓글/대댓글 기본키
COMMENT ON CONSTRAINT "PK_comments" ON "trading_discipline_management"."comments" IS '댓글/대댓글 기본키';

-- 댓글좋아요
CREATE TABLE "trading_discipline_management"."comments_like"
(
	"comments_like_id" SERIAL       NOT NULL, -- 댓글좋아요ID
	"comments_id"      INTEGER      NOT NULL, -- 댓글ID
	"user_id"          VARCHAR(200) NULL,     -- 유저ID
	"remarks"          TEXT         NULL,     -- 비고
	"is_deleted"       BOOLEAN      NOT NULL  -- 삭제여부
);

-- 댓글좋아요
COMMENT ON TABLE "trading_discipline_management"."comments_like" IS '댓글좋아요';

-- 댓글좋아요ID
COMMENT ON COLUMN "trading_discipline_management"."comments_like"."comments_like_id" IS '댓글좋아요ID';

-- 댓글ID
COMMENT ON COLUMN "trading_discipline_management"."comments_like"."comments_id" IS '댓글ID';

-- 유저ID
COMMENT ON COLUMN "trading_discipline_management"."comments_like"."user_id" IS '유저ID';

-- 비고
COMMENT ON COLUMN "trading_discipline_management"."comments_like"."remarks" IS '비고';

-- 삭제여부
COMMENT ON COLUMN "trading_discipline_management"."comments_like"."is_deleted" IS '삭제여부';

-- 댓글좋아요 기본키
CREATE UNIQUE INDEX "PK_comments_like"
	ON "trading_discipline_management"."comments_like"
	( -- 댓글좋아요
		"comments_like_id" ASC NULLS LAST -- 댓글좋아요ID
	);

-- 댓글좋아요 기본키
COMMENT ON INDEX "trading_discipline_management"."PK_comments_like" IS '댓글좋아요 기본키';

-- 댓글좋아요
ALTER TABLE "trading_discipline_management"."comments_like"
	ADD CONSTRAINT "PK_comments_like"
		-- 댓글좋아요 기본키
	PRIMARY KEY
	USING INDEX "PK_comments_like"
	NOT DEFERRABLE;

-- 댓글좋아요 기본키
COMMENT ON CONSTRAINT "PK_comments_like" ON "trading_discipline_management"."comments_like" IS '댓글좋아요 기본키';

-- 게시글좋아요
CREATE TABLE "trading_discipline_management"."posts_like"
(
	"posts_like_id" SERIAL       NOT NULL, -- 게시글좋아요ID
	"posts_id"      INTEGER      NOT NULL, -- 게시글ID
	"user_id"       VARCHAR(200) NULL,     -- 유저ID
	"remarks"       TEXT         NULL,     -- 비고
	"is_deleted"    BOOLEAN      NOT NULL  -- 삭제여부
);

-- 게시글좋아요
COMMENT ON TABLE "trading_discipline_management"."posts_like" IS '게시글좋아요';

-- 게시글좋아요ID
COMMENT ON COLUMN "trading_discipline_management"."posts_like"."posts_like_id" IS '게시글좋아요ID';

-- 게시글ID
COMMENT ON COLUMN "trading_discipline_management"."posts_like"."posts_id" IS '게시글ID';

-- 유저ID
COMMENT ON COLUMN "trading_discipline_management"."posts_like"."user_id" IS '유저ID';

-- 비고
COMMENT ON COLUMN "trading_discipline_management"."posts_like"."remarks" IS '비고';

-- 삭제여부
COMMENT ON COLUMN "trading_discipline_management"."posts_like"."is_deleted" IS '삭제여부';

-- 게시글좋아요 기본키
CREATE UNIQUE INDEX "PK_posts_like"
	ON "trading_discipline_management"."posts_like"
	( -- 게시글좋아요
		"posts_like_id" ASC NULLS LAST -- 게시글좋아요ID
	);

-- 게시글좋아요 기본키
COMMENT ON INDEX "trading_discipline_management"."PK_posts_like" IS '게시글좋아요 기본키';

-- 게시글좋아요
ALTER TABLE "trading_discipline_management"."posts_like"
	ADD CONSTRAINT "PK_posts_like"
		-- 게시글좋아요 기본키
	PRIMARY KEY
	USING INDEX "PK_posts_like"
	NOT DEFERRABLE;

-- 게시글좋아요 기본키
COMMENT ON CONSTRAINT "PK_posts_like" ON "trading_discipline_management"."posts_like" IS '게시글좋아요 기본키';

-- 첨부파일
CREATE TABLE "trading_discipline_management"."attachment_files"
(
	"attachment_file_id" SERIAL       NOT NULL, -- 첨부파일ID
	"attachment_table"   VARCHAR(200) NOT NULL, -- 첨부테이블
	"search_id"          INTEGER      NOT NULL, -- 조회ID
	"file_url"           TEXT         NOT NULL, -- 파일URL
	"file_name"          VARCHAR(200) NOT NULL, -- 원본파일명
	"file_size"          INTEGER      NOT NULL, -- 파일크기
	"mime_type"          VARCHAR(100) NOT NULL, -- MIME종류
	"sort_order"         INTEGER      NULL,     -- 정렬순서
	"created_at"         DATE         NULL,     -- 생성일
	"updated_at"         DATE         NULL,     -- 수정일
	"remarks"            TEXT         NULL,     -- 비고
	"is_deleted"         BOOLEAN      NOT NULL  -- 삭제여부
);

-- 첨부파일
COMMENT ON TABLE "trading_discipline_management"."attachment_files" IS '첨부파일';

-- 첨부파일ID
COMMENT ON COLUMN "trading_discipline_management"."attachment_files"."attachment_file_id" IS '첨부파일ID';

-- 첨부테이블
COMMENT ON COLUMN "trading_discipline_management"."attachment_files"."attachment_table" IS '첨부테이블';

-- 조회ID
COMMENT ON COLUMN "trading_discipline_management"."attachment_files"."search_id" IS '조회ID';

-- 파일URL
COMMENT ON COLUMN "trading_discipline_management"."attachment_files"."file_url" IS '파일URL';

-- 원본파일명
COMMENT ON COLUMN "trading_discipline_management"."attachment_files"."file_name" IS '원본파일명';

-- 파일크기
COMMENT ON COLUMN "trading_discipline_management"."attachment_files"."file_size" IS '파일크기';

-- MIME종류
COMMENT ON COLUMN "trading_discipline_management"."attachment_files"."mime_type" IS 'MIME종류';

-- 정렬순서
COMMENT ON COLUMN "trading_discipline_management"."attachment_files"."sort_order" IS '정렬순서';

-- 생성일
COMMENT ON COLUMN "trading_discipline_management"."attachment_files"."created_at" IS '생성일';

-- 수정일
COMMENT ON COLUMN "trading_discipline_management"."attachment_files"."updated_at" IS '수정일';

-- 비고
COMMENT ON COLUMN "trading_discipline_management"."attachment_files"."remarks" IS '비고';

-- 삭제여부
COMMENT ON COLUMN "trading_discipline_management"."attachment_files"."is_deleted" IS '삭제여부';

-- 첨부파일 기본키
CREATE UNIQUE INDEX "PK_attachment_files"
	ON "trading_discipline_management"."attachment_files"
	( -- 첨부파일
		"attachment_file_id" ASC NULLS LAST -- 첨부파일ID
	);

-- 첨부파일 기본키
COMMENT ON INDEX "trading_discipline_management"."PK_attachment_files" IS '첨부파일 기본키';

-- 첨부파일
ALTER TABLE "trading_discipline_management"."attachment_files"
	ADD CONSTRAINT "PK_attachment_files"
		-- 첨부파일 기본키
	PRIMARY KEY
	USING INDEX "PK_attachment_files"
	NOT DEFERRABLE;

-- 첨부파일 기본키
COMMENT ON CONSTRAINT "PK_attachment_files" ON "trading_discipline_management"."attachment_files" IS '첨부파일 기본키';

-- 유저
CREATE TABLE "trading_discipline_management"."user_profile"
(
	"user_id"      VARCHAR(200) NOT NULL, -- 유저아이디
	"first_name"   VARCHAR(100) NULL,     -- 성
	"last_name"    VARCHAR(100) NULL,     -- 이름
	"phone_number" VARCHAR(30)  NOT NULL, -- 연락처
	"created_at"   DATE         NULL,     -- 생성일
	"updated_at"   DATE         NULL,     -- 수정일
	"remarks"      TEXT         NULL,     -- 비고
	"is_deleted"   BOOLEAN      NOT NULL  -- 삭제여부
);

-- 유저
COMMENT ON TABLE "trading_discipline_management"."user_profile" IS '유저';

-- 유저아이디
COMMENT ON COLUMN "trading_discipline_management"."user_profile"."user_id" IS '유저아이디';

-- 성
COMMENT ON COLUMN "trading_discipline_management"."user_profile"."first_name" IS '성';

-- 이름
COMMENT ON COLUMN "trading_discipline_management"."user_profile"."last_name" IS '이름';

-- 연락처
COMMENT ON COLUMN "trading_discipline_management"."user_profile"."phone_number" IS '연락처';

-- 생성일
COMMENT ON COLUMN "trading_discipline_management"."user_profile"."created_at" IS '생성일';

-- 수정일
COMMENT ON COLUMN "trading_discipline_management"."user_profile"."updated_at" IS '수정일';

-- 비고
COMMENT ON COLUMN "trading_discipline_management"."user_profile"."remarks" IS '비고';

-- 삭제여부
COMMENT ON COLUMN "trading_discipline_management"."user_profile"."is_deleted" IS '삭제여부';

-- 유저 기본키
CREATE UNIQUE INDEX "PK_user_profile"
	ON "trading_discipline_management"."user_profile"
	( -- 유저
		"user_id" ASC NULLS LAST -- 유저아이디
	);

-- 유저 기본키
COMMENT ON INDEX "trading_discipline_management"."PK_user_profile" IS '유저 기본키';

-- 유저
ALTER TABLE "trading_discipline_management"."user_profile"
	ADD CONSTRAINT "PK_user_profile"
		-- 유저 기본키
	PRIMARY KEY
	USING INDEX "PK_user_profile"
	NOT DEFERRABLE;

-- 유저 기본키
COMMENT ON CONSTRAINT "PK_user_profile" ON "trading_discipline_management"."user_profile" IS '유저 기본키';

-- 사람
CREATE TABLE "trading_discipline_management"."person"
(
	"person_id"  SERIAL       NOT NULL, -- 사람아이디
	"user_id"    VARCHAR(200) NULL,     -- 유저아이디
	"first_name" VARCHAR(100) NULL,     -- 성
	"last_name"  VARCHAR(100) NULL,     -- 이름
	"region"     VARCHAR(100) NULL,     -- 지역
	"birth_date" DATE         NULL,     -- 생년월일
	"death_date" DATE         NULL,     -- 별세일자
	"created_at" DATE         NULL,     -- 생성일
	"updated_at" DATE         NULL,     -- 수정일
	"remarks"    TEXT         NULL,     -- 비고
	"is_deleted" BOOLEAN      NOT NULL  -- 삭제여부
);

-- 사람
COMMENT ON TABLE "trading_discipline_management"."person" IS '사람';

-- 사람아이디
COMMENT ON COLUMN "trading_discipline_management"."person"."person_id" IS '사람아이디';

-- 유저아이디
COMMENT ON COLUMN "trading_discipline_management"."person"."user_id" IS '유저아이디';

-- 성
COMMENT ON COLUMN "trading_discipline_management"."person"."first_name" IS '성';

-- 이름
COMMENT ON COLUMN "trading_discipline_management"."person"."last_name" IS '이름';

-- 지역
COMMENT ON COLUMN "trading_discipline_management"."person"."region" IS '지역';

-- 생년월일
COMMENT ON COLUMN "trading_discipline_management"."person"."birth_date" IS '생년월일';

-- 별세일자
COMMENT ON COLUMN "trading_discipline_management"."person"."death_date" IS '별세일자';

-- 생성일
COMMENT ON COLUMN "trading_discipline_management"."person"."created_at" IS '생성일';

-- 수정일
COMMENT ON COLUMN "trading_discipline_management"."person"."updated_at" IS '수정일';

-- 비고
COMMENT ON COLUMN "trading_discipline_management"."person"."remarks" IS '비고';

-- 삭제여부
COMMENT ON COLUMN "trading_discipline_management"."person"."is_deleted" IS '삭제여부';

-- 사람 기본키
CREATE UNIQUE INDEX "PK_person"
	ON "trading_discipline_management"."person"
	( -- 사람
		"person_id" ASC NULLS LAST -- 사람아이디
	);

-- 사람 기본키
COMMENT ON INDEX "trading_discipline_management"."PK_person" IS '사람 기본키';

-- 사람
ALTER TABLE "trading_discipline_management"."person"
	ADD CONSTRAINT "PK_person"
		-- 사람 기본키
	PRIMARY KEY
	USING INDEX "PK_person"
	NOT DEFERRABLE;

-- 사람 기본키
COMMENT ON CONSTRAINT "PK_person" ON "trading_discipline_management"."person" IS '사람 기본키';

-- 연투자계획
CREATE TABLE "trading_discipline_management"."annual_investment_plan"
(
	"id"                  SERIAL       NOT NULL, -- ID
	"account_id"          INTEGER      NOT NULL, -- 증권사계좌ID
	"market"              VARCHAR(20)  NOT NULL, -- 시장
	"title"               VARCHAR(200) NOT NULL, -- 계획명
	"thesis"              TEXT         NOT NULL, -- 투자논리
	"direction"           VARCHAR(20)  NOT NULL, -- 투자방향
	"status"              VARCHAR(20)  NOT NULL, -- 계획상태
	"valid_from"          DATE         NOT NULL, -- 유효시작일
	"valid_until"         DATE         NOT NULL, -- 유효종료일
	"target_return_ratio" NUMERIC(5,2) NULL,     -- 목표수익비율
	"stop_loss_ratio"     NUMERIC(5,2) NULL,     -- 손절비율
	"created_at"          DATE         NULL,     -- 생성일
	"updated_at"          DATE         NULL,     -- 수정일
	"remarks"             TEXT         NULL,     -- 비고
	"is_deleted"          BOOLEAN      NOT NULL  -- 삭제여부
);

-- 연투자계획
COMMENT ON TABLE "trading_discipline_management"."annual_investment_plan" IS '연투자계획';

-- ID
COMMENT ON COLUMN "trading_discipline_management"."annual_investment_plan"."id" IS 'ID';

-- 증권사계좌ID
COMMENT ON COLUMN "trading_discipline_management"."annual_investment_plan"."account_id" IS '증권사계좌ID';

-- 시장
COMMENT ON COLUMN "trading_discipline_management"."annual_investment_plan"."market" IS '시장';

-- 계획명
COMMENT ON COLUMN "trading_discipline_management"."annual_investment_plan"."title" IS '계획명';

-- 투자논리
COMMENT ON COLUMN "trading_discipline_management"."annual_investment_plan"."thesis" IS '투자논리';

-- 투자방향
COMMENT ON COLUMN "trading_discipline_management"."annual_investment_plan"."direction" IS '투자방향';

-- 계획상태
COMMENT ON COLUMN "trading_discipline_management"."annual_investment_plan"."status" IS '계획상태';

-- 유효시작일
COMMENT ON COLUMN "trading_discipline_management"."annual_investment_plan"."valid_from" IS '유효시작일';

-- 유효종료일
COMMENT ON COLUMN "trading_discipline_management"."annual_investment_plan"."valid_until" IS '유효종료일';

-- 목표수익비율
COMMENT ON COLUMN "trading_discipline_management"."annual_investment_plan"."target_return_ratio" IS '목표수익비율';

-- 손절비율
COMMENT ON COLUMN "trading_discipline_management"."annual_investment_plan"."stop_loss_ratio" IS '손절비율';

-- 생성일
COMMENT ON COLUMN "trading_discipline_management"."annual_investment_plan"."created_at" IS '생성일';

-- 수정일
COMMENT ON COLUMN "trading_discipline_management"."annual_investment_plan"."updated_at" IS '수정일';

-- 비고
COMMENT ON COLUMN "trading_discipline_management"."annual_investment_plan"."remarks" IS '비고';

-- 삭제여부
COMMENT ON COLUMN "trading_discipline_management"."annual_investment_plan"."is_deleted" IS '삭제여부';

-- 연투자계획 기본키
CREATE UNIQUE INDEX "PK_annual_investment_plan"
	ON "trading_discipline_management"."annual_investment_plan"
	( -- 연투자계획
		"id" ASC NULLS LAST -- ID
	);

-- 연투자계획 기본키
COMMENT ON INDEX "trading_discipline_management"."PK_annual_investment_plan" IS '연투자계획 기본키';

-- 연투자계획
ALTER TABLE "trading_discipline_management"."annual_investment_plan"
	ADD CONSTRAINT "PK_annual_investment_plan"
		-- 연투자계획 기본키
	PRIMARY KEY
	USING INDEX "PK_annual_investment_plan"
	NOT DEFERRABLE;

-- 연투자계획 기본키
COMMENT ON CONSTRAINT "PK_annual_investment_plan" ON "trading_discipline_management"."annual_investment_plan" IS '연투자계획 기본키';

-- 종목
CREATE TABLE "trading_discipline_management"."securities"
(
	"id"               INTEGER       NOT NULL, -- ID
	"account_id"       INTEGER       NOT NULL, -- 계좌ID
	"market"           VARCHAR(20)   NOT NULL, -- 시장
	"symbol"           VARCHAR(30)   NOT NULL, -- 종목코드
	"name"             VARCHAR(200)  NOT NULL, -- 종목명
	"asset_type"       VARCHAR(20)   NOT NULL, -- 자산유형
	"currency"         VARCHAR(3)    NOT NULL, -- 통화
	"holding_quantity" INTEGER       NULL,     -- 보유개수
	"current_price"    NUMERIC(15,2) NULL,     -- 현재주가
	"sector"           VARCHAR(100)  NULL,     -- 업종
	"remarks"          TEXT          NULL,     -- 비고
	"created_at"       DATE          NULL,     -- 생성일
	"updated_at"       DATE          NULL,     -- 수정일
	"is_active"        BOOLEAN       NOT NULL, -- 관리대상여부
	"is_deleted"       BOOLEAN       NOT NULL  -- 삭제여부
);

-- 종목
COMMENT ON TABLE "trading_discipline_management"."securities" IS '종목';

-- ID
COMMENT ON COLUMN "trading_discipline_management"."securities"."id" IS 'ID';

-- 계좌ID
COMMENT ON COLUMN "trading_discipline_management"."securities"."account_id" IS '계좌ID';

-- 시장
COMMENT ON COLUMN "trading_discipline_management"."securities"."market" IS '시장';

-- 종목코드
COMMENT ON COLUMN "trading_discipline_management"."securities"."symbol" IS '종목코드';

-- 종목명
COMMENT ON COLUMN "trading_discipline_management"."securities"."name" IS '종목명';

-- 자산유형
COMMENT ON COLUMN "trading_discipline_management"."securities"."asset_type" IS '자산유형';

-- 통화
COMMENT ON COLUMN "trading_discipline_management"."securities"."currency" IS '통화';

-- 보유개수
COMMENT ON COLUMN "trading_discipline_management"."securities"."holding_quantity" IS '보유개수';

-- 현재주가
COMMENT ON COLUMN "trading_discipline_management"."securities"."current_price" IS '현재주가';

-- 업종
COMMENT ON COLUMN "trading_discipline_management"."securities"."sector" IS '업종';

-- 비고
COMMENT ON COLUMN "trading_discipline_management"."securities"."remarks" IS '비고';

-- 생성일
COMMENT ON COLUMN "trading_discipline_management"."securities"."created_at" IS '생성일';

-- 수정일
COMMENT ON COLUMN "trading_discipline_management"."securities"."updated_at" IS '수정일';

-- 관리대상여부
COMMENT ON COLUMN "trading_discipline_management"."securities"."is_active" IS '관리대상여부';

-- 삭제여부
COMMENT ON COLUMN "trading_discipline_management"."securities"."is_deleted" IS '삭제여부';

-- 종목 기본키
CREATE UNIQUE INDEX "PK_securities"
	ON "trading_discipline_management"."securities"
	( -- 종목
		"id" ASC NULLS LAST -- ID
	);

-- 종목 기본키
COMMENT ON INDEX "trading_discipline_management"."PK_securities" IS '종목 기본키';

-- 종목
ALTER TABLE "trading_discipline_management"."securities"
	ADD CONSTRAINT "PK_securities"
		-- 종목 기본키
	PRIMARY KEY
	USING INDEX "PK_securities"
	NOT DEFERRABLE;

-- 종목 기본키
COMMENT ON CONSTRAINT "PK_securities" ON "trading_discipline_management"."securities" IS '종목 기본키';

-- 이행
CREATE TABLE "trading_discipline_management"."orders"
(
	"id"          SERIAL        NOT NULL, -- ID
	"security_id" INTEGER       NULL,     -- 종목ID
	"action_type" VARCHAR(20)   NULL,     -- 행위종류
	"order_type"  VARCHAR(20)   NULL,     -- 주문유형
	"side"        VARCHAR(20)   NULL,     -- 매수매도구분
	"quantity"    INTEGER       NULL,     -- 수량
	"limit_price" NUMERIC(15,2) NULL,     -- 지정가격
	"executed_at" TIMESTAMP     NULL,     -- 이행시각
	"remarks"     TEXT          NULL,     -- 비고
	"is_deleted"  BOOLEAN       NOT NULL, -- 삭제여부
	"created_at"  DATE          NULL      -- 생성일
);

-- 이행
COMMENT ON TABLE "trading_discipline_management"."orders" IS '이행';

-- ID
COMMENT ON COLUMN "trading_discipline_management"."orders"."id" IS 'ID';

-- 종목ID
COMMENT ON COLUMN "trading_discipline_management"."orders"."security_id" IS '종목ID';

-- 행위종류
COMMENT ON COLUMN "trading_discipline_management"."orders"."action_type" IS '행위종류';

-- 주문유형
COMMENT ON COLUMN "trading_discipline_management"."orders"."order_type" IS '주문유형';

-- 매수매도구분
COMMENT ON COLUMN "trading_discipline_management"."orders"."side" IS '매수매도구분';

-- 수량
COMMENT ON COLUMN "trading_discipline_management"."orders"."quantity" IS '수량';

-- 지정가격
COMMENT ON COLUMN "trading_discipline_management"."orders"."limit_price" IS '지정가격';

-- 이행시각
COMMENT ON COLUMN "trading_discipline_management"."orders"."executed_at" IS '이행시각';

-- 비고
COMMENT ON COLUMN "trading_discipline_management"."orders"."remarks" IS '비고';

-- 삭제여부
COMMENT ON COLUMN "trading_discipline_management"."orders"."is_deleted" IS '삭제여부';

-- 생성일
COMMENT ON COLUMN "trading_discipline_management"."orders"."created_at" IS '생성일';

-- 이행 기본키
CREATE UNIQUE INDEX "PK_orders"
	ON "trading_discipline_management"."orders"
	( -- 이행
		"id" ASC NULLS LAST -- ID
	);

-- 이행 기본키
COMMENT ON INDEX "trading_discipline_management"."PK_orders" IS '이행 기본키';

-- 이행
ALTER TABLE "trading_discipline_management"."orders"
	ADD CONSTRAINT "PK_orders"
		-- 이행 기본키
	PRIMARY KEY
	USING INDEX "PK_orders"
	NOT DEFERRABLE;

-- 이행 기본키
COMMENT ON CONSTRAINT "PK_orders" ON "trading_discipline_management"."orders" IS '이행 기본키';

-- 성과
CREATE TABLE "trading_discipline_management"."performance_records"
(
	"id"                    SERIAL        NOT NULL, -- id
	"security_id"           INTEGER       NULL,     -- 종목ID
	"period_type"           VARCHAR(20)   NULL,     -- 기간유형
	"period_start"          DATE          NULL,     -- 기간시작일
	"period_end"            DATE          NULL,     -- 기간종료일
	"realized_profit"       NUMERIC(15,2) NULL,     -- 실현손익
	"unrealized_profit"     NUMERIC(15,2) NULL,     -- 평가손익
	"dividend_income"       NUMERIC(15,2) NULL,     -- 배당수익
	"interest_cost"         NUMERIC(15,2) NULL,     -- 이자비용
	"commission"            NUMERIC(15,2) NULL,     -- 수수료
	"tax"                   NUMERIC(15,2) NULL,     -- 세금
	"etc_cost"              NUMERIC(15,2) NULL,     -- 기티비용
	"net_profit"            NUMERIC(15,2) NULL,     -- 순손익
	"return_rate"           NUMERIC(5,2)  NULL,     -- 수익률
	"benchmark_return_rate" NUMERIC(5,2)  NULL,     -- 벤치마크수익률
	"max_drawdown"          NUMERIC(5,2)  NULL,     -- 최대낙폭
	"created_at"            DATE          NULL,     -- 생성일
	"updated_at"            DATE          NULL,     -- 수정일
	"remarks"               TEXT          NULL,     -- 비고
	"is_deleted"            BOOLEAN       NOT NULL  -- 삭제여부
);

-- 성과
COMMENT ON TABLE "trading_discipline_management"."performance_records" IS '성과';

-- id
COMMENT ON COLUMN "trading_discipline_management"."performance_records"."id" IS 'id';

-- 종목ID
COMMENT ON COLUMN "trading_discipline_management"."performance_records"."security_id" IS '종목ID';

-- 기간유형
COMMENT ON COLUMN "trading_discipline_management"."performance_records"."period_type" IS '기간유형';

-- 기간시작일
COMMENT ON COLUMN "trading_discipline_management"."performance_records"."period_start" IS '기간시작일';

-- 기간종료일
COMMENT ON COLUMN "trading_discipline_management"."performance_records"."period_end" IS '기간종료일';

-- 실현손익
COMMENT ON COLUMN "trading_discipline_management"."performance_records"."realized_profit" IS '실현손익';

-- 평가손익
COMMENT ON COLUMN "trading_discipline_management"."performance_records"."unrealized_profit" IS '평가손익';

-- 배당수익
COMMENT ON COLUMN "trading_discipline_management"."performance_records"."dividend_income" IS '배당수익';

-- 이자비용
COMMENT ON COLUMN "trading_discipline_management"."performance_records"."interest_cost" IS '이자비용';

-- 수수료
COMMENT ON COLUMN "trading_discipline_management"."performance_records"."commission" IS '수수료';

-- 세금
COMMENT ON COLUMN "trading_discipline_management"."performance_records"."tax" IS '세금';

-- 기티비용
COMMENT ON COLUMN "trading_discipline_management"."performance_records"."etc_cost" IS '기티비용';

-- 순손익
COMMENT ON COLUMN "trading_discipline_management"."performance_records"."net_profit" IS '순손익';

-- 수익률
COMMENT ON COLUMN "trading_discipline_management"."performance_records"."return_rate" IS '수익률';

-- 벤치마크수익률
COMMENT ON COLUMN "trading_discipline_management"."performance_records"."benchmark_return_rate" IS '벤치마크수익률';

-- 최대낙폭
COMMENT ON COLUMN "trading_discipline_management"."performance_records"."max_drawdown" IS '최대낙폭';

-- 생성일
COMMENT ON COLUMN "trading_discipline_management"."performance_records"."created_at" IS '생성일';

-- 수정일
COMMENT ON COLUMN "trading_discipline_management"."performance_records"."updated_at" IS '수정일';

-- 비고
COMMENT ON COLUMN "trading_discipline_management"."performance_records"."remarks" IS '비고';

-- 삭제여부
COMMENT ON COLUMN "trading_discipline_management"."performance_records"."is_deleted" IS '삭제여부';

-- 성과 기본키
CREATE UNIQUE INDEX "PK_performance_records"
	ON "trading_discipline_management"."performance_records"
	( -- 성과
		"id" ASC NULLS LAST -- id
	);

-- 성과 기본키
COMMENT ON INDEX "trading_discipline_management"."PK_performance_records" IS '성과 기본키';

-- 성과
ALTER TABLE "trading_discipline_management"."performance_records"
	ADD CONSTRAINT "PK_performance_records"
		-- 성과 기본키
	PRIMARY KEY
	USING INDEX "PK_performance_records"
	NOT DEFERRABLE;

-- 성과 기본키
COMMENT ON CONSTRAINT "PK_performance_records" ON "trading_discipline_management"."performance_records" IS '성과 기본키';

-- AI모델
CREATE TABLE "trading_discipline_management"."ai_model_runs"
(
	"id"                  INTEGER      NOT NULL, -- id
	"model_name"          VARCHAR(200) NULL,     -- 모델명
	"model_version"       VARCHAR(100) NULL,     -- 모델버전
	"prompt_version"      VARCHAR(100) NULL,     -- 프롬프트버전
	"started_at"          TIMESTAMP    NULL,     -- started_at
	"completed_at"        TIMESTAMP    NULL,     -- completed_at
	"input_snapshot_json" JSONB        NULL,     -- input_snapshot_json
	"output_json"         JSONB        NULL,     -- output_json
	"status"              VARCHAR(20)  NULL,     -- status
	"created_at"          DATE         NULL,     -- 생성일
	"updated_at"          DATE         NULL,     -- 수정일
	"remarks"             TEXT         NULL,     -- 비고
	"is_deleted"          BOOLEAN      NOT NULL  -- 삭제여부
);

-- AI모델
COMMENT ON TABLE "trading_discipline_management"."ai_model_runs" IS 'AI모델';

-- id
COMMENT ON COLUMN "trading_discipline_management"."ai_model_runs"."id" IS 'id';

-- 모델명
COMMENT ON COLUMN "trading_discipline_management"."ai_model_runs"."model_name" IS '모델명';

-- 모델버전
COMMENT ON COLUMN "trading_discipline_management"."ai_model_runs"."model_version" IS '모델버전';

-- 프롬프트버전
COMMENT ON COLUMN "trading_discipline_management"."ai_model_runs"."prompt_version" IS '프롬프트버전';

-- started_at
COMMENT ON COLUMN "trading_discipline_management"."ai_model_runs"."started_at" IS 'started_at';

-- completed_at
COMMENT ON COLUMN "trading_discipline_management"."ai_model_runs"."completed_at" IS 'completed_at';

-- input_snapshot_json
COMMENT ON COLUMN "trading_discipline_management"."ai_model_runs"."input_snapshot_json" IS 'input_snapshot_json';

-- output_json
COMMENT ON COLUMN "trading_discipline_management"."ai_model_runs"."output_json" IS 'output_json';

-- status
COMMENT ON COLUMN "trading_discipline_management"."ai_model_runs"."status" IS 'status';

-- 생성일
COMMENT ON COLUMN "trading_discipline_management"."ai_model_runs"."created_at" IS '생성일';

-- 수정일
COMMENT ON COLUMN "trading_discipline_management"."ai_model_runs"."updated_at" IS '수정일';

-- 비고
COMMENT ON COLUMN "trading_discipline_management"."ai_model_runs"."remarks" IS '비고';

-- 삭제여부
COMMENT ON COLUMN "trading_discipline_management"."ai_model_runs"."is_deleted" IS '삭제여부';

-- AI모델 기본키
CREATE UNIQUE INDEX "PK_ai_model_runs"
	ON "trading_discipline_management"."ai_model_runs"
	( -- AI모델
		"id" ASC NULLS LAST -- id
	);

-- AI모델 기본키
COMMENT ON INDEX "trading_discipline_management"."PK_ai_model_runs" IS 'AI모델 기본키';

-- AI모델
ALTER TABLE "trading_discipline_management"."ai_model_runs"
	ADD CONSTRAINT "PK_ai_model_runs"
		-- AI모델 기본키
	PRIMARY KEY
	USING INDEX "PK_ai_model_runs"
	NOT DEFERRABLE;

-- AI모델 기본키
COMMENT ON CONSTRAINT "PK_ai_model_runs" ON "trading_discipline_management"."ai_model_runs" IS 'AI모델 기본키';

-- 투자원칙
CREATE TABLE "trading_discipline_management"."investment_principles"
(
	"id"             SERIAL       NOT NULL, -- 투자원칙ID
	"source_id"      INTEGER      NULL,     -- 원칙소스ID
	"teacher_name"   VARCHAR(200) NULL,     -- 원칙가르치는사람
	"principle_type" VARCHAR(20)  NULL,     -- 원칙종류
	"content"        TEXT         NULL,     -- 내용
	"rationale"      TEXT         NULL,     -- 투자근거
	"cautions"       TEXT         NULL,     -- 주의사항
	"created_at"     DATE         NULL,     -- 생성일
	"remarks"        TEXT         NULL,     -- 비고
	"updated_at"     DATE         NULL,     -- 수정일
	"is_deleted"     BOOLEAN      NOT NULL  -- 삭제여부
);

-- 투자원칙
COMMENT ON TABLE "trading_discipline_management"."investment_principles" IS '투자원칙';

-- 투자원칙ID
COMMENT ON COLUMN "trading_discipline_management"."investment_principles"."id" IS '투자원칙ID';

-- 원칙소스ID
COMMENT ON COLUMN "trading_discipline_management"."investment_principles"."source_id" IS '원칙소스ID';

-- 원칙가르치는사람
COMMENT ON COLUMN "trading_discipline_management"."investment_principles"."teacher_name" IS '원칙가르치는사람';

-- 원칙종류
COMMENT ON COLUMN "trading_discipline_management"."investment_principles"."principle_type" IS '원칙종류';

-- 내용
COMMENT ON COLUMN "trading_discipline_management"."investment_principles"."content" IS '내용';

-- 투자근거
COMMENT ON COLUMN "trading_discipline_management"."investment_principles"."rationale" IS '투자근거';

-- 주의사항
COMMENT ON COLUMN "trading_discipline_management"."investment_principles"."cautions" IS '주의사항';

-- 생성일
COMMENT ON COLUMN "trading_discipline_management"."investment_principles"."created_at" IS '생성일';

-- 비고
COMMENT ON COLUMN "trading_discipline_management"."investment_principles"."remarks" IS '비고';

-- 수정일
COMMENT ON COLUMN "trading_discipline_management"."investment_principles"."updated_at" IS '수정일';

-- 삭제여부
COMMENT ON COLUMN "trading_discipline_management"."investment_principles"."is_deleted" IS '삭제여부';

-- 투자원칙 기본키
CREATE UNIQUE INDEX "PK_investment_principles"
	ON "trading_discipline_management"."investment_principles"
	( -- 투자원칙
		"id" ASC NULLS LAST -- 투자원칙ID
	);

-- 투자원칙 기본키
COMMENT ON INDEX "trading_discipline_management"."PK_investment_principles" IS '투자원칙 기본키';

-- 투자원칙
ALTER TABLE "trading_discipline_management"."investment_principles"
	ADD CONSTRAINT "PK_investment_principles"
		-- 투자원칙 기본키
	PRIMARY KEY
	USING INDEX "PK_investment_principles"
	NOT DEFERRABLE;

-- 투자원칙 기본키
COMMENT ON CONSTRAINT "PK_investment_principles" ON "trading_discipline_management"."investment_principles" IS '투자원칙 기본키';

-- 투자원칙소스
CREATE TABLE "trading_discipline_management"."principle_sources"
(
	"id"          INTEGER      NOT NULL, -- 원칙소스ID
	"name"        VARCHAR(200) NULL,     -- 소스명
	"source_type" VARCHAR(20)  NULL,     -- 소스유형
	"url"         TEXT         NULL,     -- 소스URL
	"content"     TEXT         NULL,     -- 내용
	"remarks"     TEXT         NULL,     -- 비고
	"updated_at"  DATE         NULL,     -- 수정일
	"created_at"  DATE         NULL,     -- 생성일
	"is_deleted"  BOOLEAN      NOT NULL  -- 삭제여부
);

-- 투자원칙소스
COMMENT ON TABLE "trading_discipline_management"."principle_sources" IS '투자원칙소스';

-- 원칙소스ID
COMMENT ON COLUMN "trading_discipline_management"."principle_sources"."id" IS '원칙소스ID';

-- 소스명
COMMENT ON COLUMN "trading_discipline_management"."principle_sources"."name" IS '소스명';

-- 소스유형
COMMENT ON COLUMN "trading_discipline_management"."principle_sources"."source_type" IS '유뷰브/책/뉴스';

-- 소스URL
COMMENT ON COLUMN "trading_discipline_management"."principle_sources"."url" IS '소스URL';

-- 내용
COMMENT ON COLUMN "trading_discipline_management"."principle_sources"."content" IS '내용';

-- 비고
COMMENT ON COLUMN "trading_discipline_management"."principle_sources"."remarks" IS '비고';

-- 수정일
COMMENT ON COLUMN "trading_discipline_management"."principle_sources"."updated_at" IS '수정일';

-- 생성일
COMMENT ON COLUMN "trading_discipline_management"."principle_sources"."created_at" IS '생성일';

-- 삭제여부
COMMENT ON COLUMN "trading_discipline_management"."principle_sources"."is_deleted" IS '삭제여부';

-- 투자원칙소스 기본키
CREATE UNIQUE INDEX "PK_principle_sources"
	ON "trading_discipline_management"."principle_sources"
	( -- 투자원칙소스
		"id" ASC NULLS LAST -- 원칙소스ID
	);

-- 투자원칙소스 기본키
COMMENT ON INDEX "trading_discipline_management"."PK_principle_sources" IS '투자원칙소스 기본키';

-- 투자원칙소스
ALTER TABLE "trading_discipline_management"."principle_sources"
	ADD CONSTRAINT "PK_principle_sources"
		-- 투자원칙소스 기본키
	PRIMARY KEY
	USING INDEX "PK_principle_sources"
	NOT DEFERRABLE;

-- 투자원칙소스 기본키
COMMENT ON CONSTRAINT "PK_principle_sources" ON "trading_discipline_management"."principle_sources" IS '투자원칙소스 기본키';

-- 증권사계좌
CREATE TABLE "trading_discipline_management"."broker_accounts"
(
	"id"             INTEGER      NOT NULL, -- id
	"broker_name"    VARCHAR(100) NULL,     -- 증권사명
	"account_number" VARCHAR(100) NULL,     -- 계좌번호
	"is_deleted"     BOOLEAN      NOT NULL  -- 삭제여부
);

-- 증권사계좌
COMMENT ON TABLE "trading_discipline_management"."broker_accounts" IS '증권사계좌';

-- id
COMMENT ON COLUMN "trading_discipline_management"."broker_accounts"."id" IS 'id';

-- 증권사명
COMMENT ON COLUMN "trading_discipline_management"."broker_accounts"."broker_name" IS '증권사명';

-- 계좌번호
COMMENT ON COLUMN "trading_discipline_management"."broker_accounts"."account_number" IS '계좌번호';

-- 삭제여부
COMMENT ON COLUMN "trading_discipline_management"."broker_accounts"."is_deleted" IS '삭제여부';

-- 증권사계좌 기본키
CREATE UNIQUE INDEX "PK_broker_accounts"
	ON "trading_discipline_management"."broker_accounts"
	( -- 증권사계좌
		"id" ASC NULLS LAST -- id
	);

-- 증권사계좌 기본키
COMMENT ON INDEX "trading_discipline_management"."PK_broker_accounts" IS '증권사계좌 기본키';

-- 증권사계좌
ALTER TABLE "trading_discipline_management"."broker_accounts"
	ADD CONSTRAINT "PK_broker_accounts"
		-- 증권사계좌 기본키
	PRIMARY KEY
	USING INDEX "PK_broker_accounts"
	NOT DEFERRABLE;

-- 증권사계좌 기본키
COMMENT ON CONSTRAINT "PK_broker_accounts" ON "trading_discipline_management"."broker_accounts" IS '증권사계좌 기본키';

-- 종목담보대출
CREATE TABLE "trading_discipline_management"."securities_loans"
(
	"id"               SERIAL        NOT NULL, -- id
	"security_id"      INTEGER       NOT NULL, -- 종목ID
	"principal_amount" NUMERIC(15,2) NULL,     -- 대출원금
	"interest_rate"    NUMERIC(5,2)  NULL,     -- 이자율
	"opened_at"        DATE          NULL,     -- 대출시작일
	"maturity_at"      DATE          NULL,     -- 만기일
	"quantity"         INTEGER       NULL,     -- 담보수량
	"reference_price"  NUMERIC(15,2) NULL,     -- 기준가격
	"collateral_value" NUMERIC(15,2) NULL,     -- 담보평가금액
	"collateral_ratio" NUMERIC(5,2)  NULL,     -- 담보비율
	"evaluated_at"     TIMESTAMP     NULL,     -- 평가시각
	"is_deleted"       BOOLEAN       NOT NULL  -- 삭제여부
);

-- 종목담보대출
COMMENT ON TABLE "trading_discipline_management"."securities_loans" IS '종목담보대출';

-- id
COMMENT ON COLUMN "trading_discipline_management"."securities_loans"."id" IS 'id';

-- 종목ID
COMMENT ON COLUMN "trading_discipline_management"."securities_loans"."security_id" IS '종목ID';

-- 대출원금
COMMENT ON COLUMN "trading_discipline_management"."securities_loans"."principal_amount" IS '대출원금';

-- 이자율
COMMENT ON COLUMN "trading_discipline_management"."securities_loans"."interest_rate" IS '이자율';

-- 대출시작일
COMMENT ON COLUMN "trading_discipline_management"."securities_loans"."opened_at" IS '대출시작일';

-- 만기일
COMMENT ON COLUMN "trading_discipline_management"."securities_loans"."maturity_at" IS '만기일';

-- 담보수량
COMMENT ON COLUMN "trading_discipline_management"."securities_loans"."quantity" IS '담보수량';

-- 기준가격
COMMENT ON COLUMN "trading_discipline_management"."securities_loans"."reference_price" IS '기준가격';

-- 담보평가금액
COMMENT ON COLUMN "trading_discipline_management"."securities_loans"."collateral_value" IS '담보평가금액';

-- 담보비율
COMMENT ON COLUMN "trading_discipline_management"."securities_loans"."collateral_ratio" IS '담보비율';

-- 평가시각
COMMENT ON COLUMN "trading_discipline_management"."securities_loans"."evaluated_at" IS '평가시각';

-- 삭제여부
COMMENT ON COLUMN "trading_discipline_management"."securities_loans"."is_deleted" IS '삭제여부';

-- 종목담보대출 기본키
CREATE UNIQUE INDEX "PK_securities_loans"
	ON "trading_discipline_management"."securities_loans"
	( -- 종목담보대출
		"id" ASC NULLS LAST -- id
	);

-- 종목담보대출 기본키
COMMENT ON INDEX "trading_discipline_management"."PK_securities_loans" IS '종목담보대출 기본키';

-- 종목담보대출
ALTER TABLE "trading_discipline_management"."securities_loans"
	ADD CONSTRAINT "PK_securities_loans"
		-- 종목담보대출 기본키
	PRIMARY KEY
	USING INDEX "PK_securities_loans"
	NOT DEFERRABLE;

-- 종목담보대출 기본키
COMMENT ON CONSTRAINT "PK_securities_loans" ON "trading_discipline_management"."securities_loans" IS '종목담보대출 기본키';

-- 매수매도방법
CREATE TABLE "trading_discipline_management"."trading_strategy_methods"
(
	"id"            SERIAL       NOT NULL, -- ID
	"price_data_id" INTEGER      NULL,     -- 가격데이터ID
	"policy_name"   VARCHAR(200) NULL,     -- 정책명
	"sector"        VARCHAR(100) NULL,     -- 업종
	"reference_at"  TIMESTAMP    NULL,     -- 기준시각
	"created_at"    DATE         NULL,     -- 생성일
	"updated_at"    DATE         NULL,     -- 수정일
	"remarks"       TEXT         NULL,     -- 비고
	"is_deleted"    BOOLEAN      NOT NULL  -- 삭제여부
);

-- 매수매도방법
COMMENT ON TABLE "trading_discipline_management"."trading_strategy_methods" IS '매수매도방법';

-- ID
COMMENT ON COLUMN "trading_discipline_management"."trading_strategy_methods"."id" IS 'ID';

-- 전략ID
COMMENT ON COLUMN "trading_discipline_management"."trading_strategy_methods"."strategy_id" IS '전략ID';

-- 전략종류
COMMENT ON COLUMN "trading_discipline_management"."trading_strategy_methods"."strategy_type" IS '전략종류';

-- n차
COMMENT ON COLUMN "trading_discipline_management"."trading_strategy_methods"."step_no" IS 'n차';

-- 전략가격비율
COMMENT ON COLUMN "trading_discipline_management"."trading_strategy_methods"."price_ratio" IS '전략가격비율';

-- 전략수량비율
COMMENT ON COLUMN "trading_discipline_management"."trading_strategy_methods"."quantity_ratio" IS '전략수량비율';

-- 업종
COMMENT ON COLUMN "trading_discipline_management"."trading_strategy_methods"."sector" IS '업종';

-- 생성일
COMMENT ON COLUMN "trading_discipline_management"."trading_strategy_methods"."created_at" IS '생성일';

-- 수정일
COMMENT ON COLUMN "trading_discipline_management"."trading_strategy_methods"."updated_at" IS '수정일';

-- 비고
COMMENT ON COLUMN "trading_discipline_management"."trading_strategy_methods"."remarks" IS '비고';

-- 삭제여부
COMMENT ON COLUMN "trading_discipline_management"."trading_strategy_methods"."is_deleted" IS '삭제여부';

-- 매수매도방법 기본키
CREATE UNIQUE INDEX "PK_trading_strategy_methods"
	ON "trading_discipline_management"."trading_strategy_methods"
	( -- 매수매도방법
		"id" ASC NULLS LAST -- ID
	);

-- 매수매도방법 기본키
COMMENT ON INDEX "trading_discipline_management"."PK_trading_strategy_methods" IS '매수매도방법 기본키';

-- 매수매도방법
ALTER TABLE "trading_discipline_management"."trading_strategy_methods"
	ADD CONSTRAINT "PK_trading_strategy_methods"
		-- 매수매도방법 기본키
	PRIMARY KEY
	USING INDEX "PK_trading_strategy_methods"
	NOT DEFERRABLE;

-- 매수매도방법 기본키
COMMENT ON CONSTRAINT "PK_trading_strategy_methods" ON "trading_discipline_management"."trading_strategy_methods" IS '매수매도방법 기본키';

-- 분기투자계획
CREATE TABLE "trading_discipline_management"."quarterly_investment_plan"
(
	"id"                     SERIAL       NOT NULL, -- ID
	"annual_plan_id"         INTEGER      NULL,     -- 연계획ID
	"title"                  VARCHAR(200) NOT NULL, -- 계획명
	"rebalancing_ratio"      JSONB        NULL,     -- 리벨런싱비율
	"rebalancing_start_date" DATE         NULL,     -- 리벨런싱시작일
	"rebalancing_end_date"   DATE         NULL,     -- 리벨런싱종료일
	"buy_strategy"           TEXT         NULL,     -- 매수전략
	"sell_strategy"          TEXT         NULL,     -- 매도전략
	"sideways_strategy"      TEXT         NULL,     -- 횡보전략
	"stop_loss_strategy"     TEXT         NULL,     -- 손절전략
	"direction"              VARCHAR(20)  NOT NULL, -- 투자방향
	"thesis"                 TEXT         NOT NULL, -- 투자논리
	"valid_from"             DATE         NOT NULL, -- 유효시작일
	"valid_until"            DATE         NOT NULL, -- 유효종료일
	"target_return_ratio"    NUMERIC(5,2) NULL,     -- 목표수익비율
	"stop_loss_ratio"        NUMERIC(5,2) NULL,     -- 손절비율
	"created_at"             DATE         NULL,     -- 생성일
	"updated_at"             DATE         NULL,     -- 수정일
	"remarks"                TEXT         NULL,     -- 비고
	"is_deleted"             BOOLEAN      NOT NULL  -- 삭제여부
);

-- 분기투자계획
COMMENT ON TABLE "trading_discipline_management"."quarterly_investment_plan" IS '분기투자계획';

-- ID
COMMENT ON COLUMN "trading_discipline_management"."quarterly_investment_plan"."id" IS 'ID';

-- 연계획ID
COMMENT ON COLUMN "trading_discipline_management"."quarterly_investment_plan"."annual_plan_id" IS '연계획ID';

-- 계획명
COMMENT ON COLUMN "trading_discipline_management"."quarterly_investment_plan"."title" IS '계획명';

-- 리벨런싱비율
COMMENT ON COLUMN "trading_discipline_management"."quarterly_investment_plan"."rebalancing_ratio" IS '투자자산의 비중이 시장 움직임으로 달라졌을 때, 이를 미리 정한 목표 비중으로 되돌리는 과정입니다.
예를 들어 목표가 주식 60%, 채권 40%였는데 주식이 많이 올라 현재 비중이 70:30이 됐다면, 주식 일부를 줄이고 채권을 늘려 다시 60:40에 가깝게 맞춥니다.

1. 정기 리벨런싱
2. 허용범위 리벨런싱
3. 정기 점검 + 허용범위
4. 신규 자금 활용 방식
5. 부분 리벨런싱
6. 세금 최적화 리벨런싱
7. 생애주기 리벨런싱';

-- 리벨런싱시작일
COMMENT ON COLUMN "trading_discipline_management"."quarterly_investment_plan"."rebalancing_start_date" IS '리벨런싱시작일';

-- 리벨런싱종료일
COMMENT ON COLUMN "trading_discipline_management"."quarterly_investment_plan"."rebalancing_end_date" IS '리벨런싱종료일';

-- 매수전략
COMMENT ON COLUMN "trading_discipline_management"."quarterly_investment_plan"."buy_strategy" IS '매수전략';

-- 매도전략
COMMENT ON COLUMN "trading_discipline_management"."quarterly_investment_plan"."sell_strategy" IS '매도전략';

-- 횡보전략
COMMENT ON COLUMN "trading_discipline_management"."quarterly_investment_plan"."sideways_strategy" IS '횡보전략';

-- 손절전략
COMMENT ON COLUMN "trading_discipline_management"."quarterly_investment_plan"."stop_loss_strategy" IS '손절전략';

-- 투자방향
COMMENT ON COLUMN "trading_discipline_management"."quarterly_investment_plan"."direction" IS '투자방향';

-- 투자논리
COMMENT ON COLUMN "trading_discipline_management"."quarterly_investment_plan"."thesis" IS '투자논리';

-- 유효시작일
COMMENT ON COLUMN "trading_discipline_management"."quarterly_investment_plan"."valid_from" IS '유효시작일';

-- 유효종료일
COMMENT ON COLUMN "trading_discipline_management"."quarterly_investment_plan"."valid_until" IS '유효종료일';

-- 목표수익비율
COMMENT ON COLUMN "trading_discipline_management"."quarterly_investment_plan"."target_return_ratio" IS '목표수익비율';

-- 손절비율
COMMENT ON COLUMN "trading_discipline_management"."quarterly_investment_plan"."stop_loss_ratio" IS '손절비율';

-- 생성일
COMMENT ON COLUMN "trading_discipline_management"."quarterly_investment_plan"."created_at" IS '생성일';

-- 수정일
COMMENT ON COLUMN "trading_discipline_management"."quarterly_investment_plan"."updated_at" IS '수정일';

-- 비고
COMMENT ON COLUMN "trading_discipline_management"."quarterly_investment_plan"."remarks" IS '비고';

-- 삭제여부
COMMENT ON COLUMN "trading_discipline_management"."quarterly_investment_plan"."is_deleted" IS '삭제여부';

-- 분기투자계획 기본키
CREATE UNIQUE INDEX "PK_quarterly_investment_plan"
	ON "trading_discipline_management"."quarterly_investment_plan"
	( -- 분기투자계획
		"id" ASC NULLS LAST -- ID
	);

-- 분기투자계획 기본키
COMMENT ON INDEX "trading_discipline_management"."PK_quarterly_investment_plan" IS '분기투자계획 기본키';

-- 분기투자계획
ALTER TABLE "trading_discipline_management"."quarterly_investment_plan"
	ADD CONSTRAINT "PK_quarterly_investment_plan"
		-- 분기투자계획 기본키
	PRIMARY KEY
	USING INDEX "PK_quarterly_investment_plan"
	NOT DEFERRABLE;

-- 분기투자계획 기본키
COMMENT ON CONSTRAINT "PK_quarterly_investment_plan" ON "trading_discipline_management"."quarterly_investment_plan" IS '분기투자계획 기본키';

-- 월투자계획
CREATE TABLE "trading_discipline_management"."monthly_investment_plan"
(
	"id"                INTEGER      NOT NULL, -- ID
	"quarterly_plan_id" INTEGER      NULL,     -- 분기계획ID
	"title"             VARCHAR(200) NOT NULL, -- 계획명
	"scenario_planning" VARCHAR(20)  NOT NULL, -- 시나리오계획
	"predicted_trend"   VARCHAR(20)  NOT NULL, -- 예상추세
	"thesis"            TEXT         NOT NULL, -- 투자논리
	"confidence_score"  INTEGER      NULL,     -- 계획확신도
	"allocation_ratio"  JSONB        NULL,     -- 벨런싱비율
	"valid_from"        DATE         NOT NULL, -- 유효시작일
	"valid_until"       DATE         NOT NULL, -- 유효종료일
	"created_at"        DATE         NULL,     -- 생성일
	"updated_at"        DATE         NULL,     -- 수정일
	"remarks"           TEXT         NULL,     -- 비고
	"is_deleted"        BOOLEAN      NOT NULL  -- 삭제여부
);

-- 월투자계획
COMMENT ON TABLE "trading_discipline_management"."monthly_investment_plan" IS '월투자계획';

-- ID
COMMENT ON COLUMN "trading_discipline_management"."monthly_investment_plan"."id" IS 'ID';

-- 분기계획ID
COMMENT ON COLUMN "trading_discipline_management"."monthly_investment_plan"."quarterly_plan_id" IS '분기계획ID';

-- 계획명
COMMENT ON COLUMN "trading_discipline_management"."monthly_investment_plan"."title" IS '계획명';

-- 시나리오계획
COMMENT ON COLUMN "trading_discipline_management"."monthly_investment_plan"."scenario_planning" IS '시나리오계획';

-- 예상추세
COMMENT ON COLUMN "trading_discipline_management"."monthly_investment_plan"."predicted_trend" IS '예상추세';

-- 투자논리
COMMENT ON COLUMN "trading_discipline_management"."monthly_investment_plan"."thesis" IS '투자논리';

-- 계획확신도
COMMENT ON COLUMN "trading_discipline_management"."monthly_investment_plan"."confidence_score" IS '계획확신도';

-- 벨런싱비율
COMMENT ON COLUMN "trading_discipline_management"."monthly_investment_plan"."allocation_ratio" IS '현금20% 주식50% 채권10% 달러10%';

-- 유효시작일
COMMENT ON COLUMN "trading_discipline_management"."monthly_investment_plan"."valid_from" IS '유효시작일';

-- 유효종료일
COMMENT ON COLUMN "trading_discipline_management"."monthly_investment_plan"."valid_until" IS '유효종료일';

-- 생성일
COMMENT ON COLUMN "trading_discipline_management"."monthly_investment_plan"."created_at" IS '생성일';

-- 수정일
COMMENT ON COLUMN "trading_discipline_management"."monthly_investment_plan"."updated_at" IS '수정일';

-- 비고
COMMENT ON COLUMN "trading_discipline_management"."monthly_investment_plan"."remarks" IS '비고';

-- 삭제여부
COMMENT ON COLUMN "trading_discipline_management"."monthly_investment_plan"."is_deleted" IS '삭제여부';

-- 월투자계획 기본키
CREATE UNIQUE INDEX "PK_monthly_investment_plan"
	ON "trading_discipline_management"."monthly_investment_plan"
	( -- 월투자계획
		"id" ASC NULLS LAST -- ID
	);

-- 월투자계획 기본키
COMMENT ON INDEX "trading_discipline_management"."PK_monthly_investment_plan" IS '월투자계획 기본키';

-- 월투자계획
ALTER TABLE "trading_discipline_management"."monthly_investment_plan"
	ADD CONSTRAINT "PK_monthly_investment_plan"
		-- 월투자계획 기본키
	PRIMARY KEY
	USING INDEX "PK_monthly_investment_plan"
	NOT DEFERRABLE;

-- 월투자계획 기본키
COMMENT ON CONSTRAINT "PK_monthly_investment_plan" ON "trading_discipline_management"."monthly_investment_plan" IS '월투자계획 기본키';

-- 월투자원칙
CREATE TABLE "trading_discipline_management"."monthly_investment_principles"
(
	"id"              SERIAL        NOT NULL, -- ID
	"monthly_plan_id" INTEGER       NULL,     -- 월계획ID
	"security_id"     INTEGER       NULL,     -- 종목ID
	"direction"       VARCHAR(20)   NULL,     -- 투자방향
	"rationale"       TEXT          NULL,     -- 근거
	"predicted_price" NUMERIC(15,2) NULL,     -- 예상가격
	"stop_loss_price" NUMERIC(15,2) NULL,     -- 손절가격
	"updated_at"      DATE          NULL,     -- 수정일
	"remarks"         TEXT          NULL,     -- 비고
	"is_deleted"      BOOLEAN       NOT NULL, -- 삭제여부
	"created_at"      DATE          NULL      -- 생성일
);

-- 월투자원칙
COMMENT ON TABLE "trading_discipline_management"."monthly_investment_principles" IS '월투자원칙';

-- ID
COMMENT ON COLUMN "trading_discipline_management"."monthly_investment_principles"."id" IS 'ID';

-- 월계획ID
COMMENT ON COLUMN "trading_discipline_management"."monthly_investment_principles"."monthly_plan_id" IS '월계획ID';

-- 종목ID
COMMENT ON COLUMN "trading_discipline_management"."monthly_investment_principles"."security_id" IS '종목ID';

-- 투자방향
COMMENT ON COLUMN "trading_discipline_management"."monthly_investment_principles"."direction" IS '투자방향';

-- 근거
COMMENT ON COLUMN "trading_discipline_management"."monthly_investment_principles"."rationale" IS '근거';

-- 예상가격
COMMENT ON COLUMN "trading_discipline_management"."monthly_investment_principles"."predicted_price" IS '예상가격';

-- 손절가격
COMMENT ON COLUMN "trading_discipline_management"."monthly_investment_principles"."stop_loss_price" IS '손절가격';

-- 수정일
COMMENT ON COLUMN "trading_discipline_management"."monthly_investment_principles"."updated_at" IS '수정일';

-- 비고
COMMENT ON COLUMN "trading_discipline_management"."monthly_investment_principles"."remarks" IS '비고';

-- 삭제여부
COMMENT ON COLUMN "trading_discipline_management"."monthly_investment_principles"."is_deleted" IS '삭제여부';

-- 생성일
COMMENT ON COLUMN "trading_discipline_management"."monthly_investment_principles"."created_at" IS '생성일';

-- 월투자원칙 기본키
CREATE UNIQUE INDEX "PK_monthly_investment_principles"
	ON "trading_discipline_management"."monthly_investment_principles"
	( -- 월투자원칙
		"id" ASC NULLS LAST -- ID
	);

-- 월투자원칙 기본키
COMMENT ON INDEX "trading_discipline_management"."PK_monthly_investment_principles" IS '월투자원칙 기본키';

-- 월투자원칙
ALTER TABLE "trading_discipline_management"."monthly_investment_principles"
	ADD CONSTRAINT "PK_monthly_investment_principles"
		-- 월투자원칙 기본키
	PRIMARY KEY
	USING INDEX "PK_monthly_investment_principles"
	NOT DEFERRABLE;

-- 월투자원칙 기본키
COMMENT ON CONSTRAINT "PK_monthly_investment_principles" ON "trading_discipline_management"."monthly_investment_principles" IS '월투자원칙 기본키';

-- 주투자계획
CREATE TABLE "trading_discipline_management"."weekly_investment_plan"
(
	"id"                SERIAL        NOT NULL, -- ID
	"monthly_plan_id"   INTEGER       NULL,     -- monthly_plan_id
	"security_id"       INTEGER       NOT NULL,     -- 종목ID
	"title"             VARCHAR(200)  NOT NULL, -- 계획명
	"scenario_planning" VARCHAR(20)   NOT NULL, -- 시나리오계획
	"available_amount"  NUMERIC(15,2) NULL,     -- 가용금액
	"predicted_trend"   VARCHAR(20)   NOT NULL, -- 예측추세
	"thesis"            TEXT          NOT NULL, -- 투자논리
	"confidence_score"  INTEGER       NULL,     -- 계획확신도
	"allocation_ratio"  JSONB         NULL,     -- 벨런싱비율계획
	"valid_from"        DATE          NOT NULL, -- 유효시작일
	"valid_until"       DATE          NOT NULL, -- 유효종료일
	"predicted_price"   NUMERIC(15,2) NULL,     -- 예상가격
	"stop_loss_price"   NUMERIC(15,2) NULL,     -- 손절가격
	"created_at"        DATE          NULL,     -- 생성일
	"updated_at"        DATE          NULL,     -- 수정일
	"remarks"           TEXT          NULL,     -- 비고
	"is_deleted"        BOOLEAN       NOT NULL  -- 삭제여부
);

-- 주투자계획
COMMENT ON TABLE "trading_discipline_management"."weekly_investment_plan" IS '주투자계획';

-- ID
COMMENT ON COLUMN "trading_discipline_management"."weekly_investment_plan"."id" IS 'ID';

-- 종목ID
COMMENT ON COLUMN "trading_discipline_management"."weekly_investment_plan"."security_id" IS '종목ID';

-- 계획명
COMMENT ON COLUMN "trading_discipline_management"."weekly_investment_plan"."title" IS '계획명';

-- 시나리오계획
COMMENT ON COLUMN "trading_discipline_management"."weekly_investment_plan"."scenario_planning" IS '시나리오계획';

-- 가용금액
COMMENT ON COLUMN "trading_discipline_management"."weekly_investment_plan"."available_amount" IS '가용금액';

-- 예측추세
COMMENT ON COLUMN "trading_discipline_management"."weekly_investment_plan"."predicted_trend" IS '예측추세';

-- 투자논리
COMMENT ON COLUMN "trading_discipline_management"."weekly_investment_plan"."thesis" IS '투자논리';

-- 계획확신도
COMMENT ON COLUMN "trading_discipline_management"."weekly_investment_plan"."confidence_score" IS '계획확신도';

-- 벨런싱비율계획
COMMENT ON COLUMN "trading_discipline_management"."weekly_investment_plan"."allocation_ratio" IS '투자자산의 비중이 시장 움직임으로 달라졌을 때, 이를 미리 정한 목표 비중으로 되돌리는 과정입니다.
예를 들어 목표가 주식 60%, 채권 40%였는데 주식이 많이 올라 현재 비중이 70:30이 됐다면, 주식 일부를 줄이고 채권을 늘려 다시 60:40에 가깝게 맞춥니다.

1. 정기 리벨런싱
2. 허용범위 리벨런싱
3. 정기 점검 + 허용범위
4. 신규 자금 활용 방식
5. 부분 리벨런싱
6. 세금 최적화 리벨런싱
7. 생애주기 리벨런싱';

-- 유효시작일
COMMENT ON COLUMN "trading_discipline_management"."weekly_investment_plan"."valid_from" IS '유효시작일';

-- 유효종료일
COMMENT ON COLUMN "trading_discipline_management"."weekly_investment_plan"."valid_until" IS '유효종료일';

-- 예상가격
COMMENT ON COLUMN "trading_discipline_management"."weekly_investment_plan"."predicted_price" IS '예상가격';

-- 손절가격
COMMENT ON COLUMN "trading_discipline_management"."weekly_investment_plan"."stop_loss_price" IS '손절가격';

-- 생성일
COMMENT ON COLUMN "trading_discipline_management"."weekly_investment_plan"."created_at" IS '생성일';

-- 수정일
COMMENT ON COLUMN "trading_discipline_management"."weekly_investment_plan"."updated_at" IS '수정일';

-- 비고
COMMENT ON COLUMN "trading_discipline_management"."weekly_investment_plan"."remarks" IS '비고';

-- 삭제여부
COMMENT ON COLUMN "trading_discipline_management"."weekly_investment_plan"."is_deleted" IS '삭제여부';

-- 주투자계획 기본키
CREATE UNIQUE INDEX "PK_weekly_investment_plan"
	ON "trading_discipline_management"."weekly_investment_plan"
	( -- 주투자계획
		"id" ASC NULLS LAST -- ID
	);

-- 주투자계획 기본키
COMMENT ON INDEX "trading_discipline_management"."PK_weekly_investment_plan" IS '주투자계획 기본키';

-- 주투자계획
ALTER TABLE "trading_discipline_management"."weekly_investment_plan"
	ADD CONSTRAINT "PK_weekly_investment_plan"
		-- 주투자계획 기본키
	PRIMARY KEY
	USING INDEX "PK_weekly_investment_plan"
	NOT DEFERRABLE;

-- 주투자계획 기본키
COMMENT ON CONSTRAINT "PK_weekly_investment_plan" ON "trading_discipline_management"."weekly_investment_plan" IS '주투자계획 기본키';

-- 일투자계획
CREATE TABLE "trading_discipline_management"."daily_investment_plan"
(
	"id"                SERIAL        NOT NULL, -- ID
	"weekly_plan_id"    INTEGER       NULL,     -- 주계획ID
	"title"             VARCHAR(200)  NOT NULL, -- 계획명
	"scenario_planning" VARCHAR(20)   NOT NULL, -- 시나리오계획
	"predicted_trend"   VARCHAR(20)   NOT NULL, -- 예측추세
	"thesis"            TEXT          NOT NULL, -- 투자논리
	"confidence_score"  INTEGER       NULL,     -- 계획확신도
	"allocation_ratio"  JSONB         NULL,     -- 벨런싱비율계획
	"valid_from"        DATE          NOT NULL, -- 유효시작일
	"valid_until"       DATE          NOT NULL, -- 유효종료일
	"predicted_price"   NUMERIC(15,2) NULL,     -- 예상가격
	"stop_loss_price"   NUMERIC(15,2) NULL,     -- 손절가격
	"created_at"        DATE          NULL,     -- 생성일
	"updated_at"        DATE          NULL,     -- 수정일
	"remarks"           TEXT          NULL,     -- 비고
	"is_deleted"        BOOLEAN       NOT NULL  -- 삭제여부
);

-- 일투자계획
COMMENT ON TABLE "trading_discipline_management"."daily_investment_plan" IS '일투자계획';

-- ID
COMMENT ON COLUMN "trading_discipline_management"."daily_investment_plan"."id" IS 'ID';

-- 주계획ID
COMMENT ON COLUMN "trading_discipline_management"."daily_investment_plan"."weekly_plan_id" IS '주계획ID';

-- 계획명
COMMENT ON COLUMN "trading_discipline_management"."daily_investment_plan"."title" IS '계획명';

-- 시나리오계획
COMMENT ON COLUMN "trading_discipline_management"."daily_investment_plan"."scenario_planning" IS '시나리오계획';

-- 예측추세
COMMENT ON COLUMN "trading_discipline_management"."daily_investment_plan"."predicted_trend" IS '예측추세';

-- 투자논리
COMMENT ON COLUMN "trading_discipline_management"."daily_investment_plan"."thesis" IS '투자논리';

-- 계획확신도
COMMENT ON COLUMN "trading_discipline_management"."daily_investment_plan"."confidence_score" IS '계획확신도';

-- 벨런싱비율계획
COMMENT ON COLUMN "trading_discipline_management"."daily_investment_plan"."allocation_ratio" IS '투자자산의 비중이 시장 움직임으로 달라졌을 때, 이를 미리 정한 목표 비중으로 되돌리는 과정입니다.
예를 들어 목표가 주식 60%, 채권 40%였는데 주식이 많이 올라 현재 비중이 70:30이 됐다면, 주식 일부를 줄이고 채권을 늘려 다시 60:40에 가깝게 맞춥니다.

1. 정기 리벨런싱
2. 허용범위 리벨런싱
3. 정기 점검 + 허용범위
4. 신규 자금 활용 방식
5. 부분 리벨런싱
6. 세금 최적화 리벨런싱
7. 생애주기 리벨런싱';

-- 유효시작일
COMMENT ON COLUMN "trading_discipline_management"."daily_investment_plan"."valid_from" IS '유효시작일';

-- 유효종료일
COMMENT ON COLUMN "trading_discipline_management"."daily_investment_plan"."valid_until" IS '유효종료일';

-- 예상가격
COMMENT ON COLUMN "trading_discipline_management"."daily_investment_plan"."predicted_price" IS '예상가격';

-- 손절가격
COMMENT ON COLUMN "trading_discipline_management"."daily_investment_plan"."stop_loss_price" IS '손절가격';

-- 생성일
COMMENT ON COLUMN "trading_discipline_management"."daily_investment_plan"."created_at" IS '생성일';

-- 수정일
COMMENT ON COLUMN "trading_discipline_management"."daily_investment_plan"."updated_at" IS '수정일';

-- 비고
COMMENT ON COLUMN "trading_discipline_management"."daily_investment_plan"."remarks" IS '비고';

-- 삭제여부
COMMENT ON COLUMN "trading_discipline_management"."daily_investment_plan"."is_deleted" IS '삭제여부';

-- 일투자계획 기본키
CREATE UNIQUE INDEX "PK_daily_investment_plan"
	ON "trading_discipline_management"."daily_investment_plan"
	( -- 일투자계획
		"id" ASC NULLS LAST -- ID
	);

-- 일투자계획 기본키
COMMENT ON INDEX "trading_discipline_management"."PK_daily_investment_plan" IS '일투자계획 기본키';

-- 일투자계획
ALTER TABLE "trading_discipline_management"."daily_investment_plan"
	ADD CONSTRAINT "PK_daily_investment_plan"
		-- 일투자계획 기본키
	PRIMARY KEY
	USING INDEX "PK_daily_investment_plan"
	NOT DEFERRABLE;

-- 일투자계획 기본키
COMMENT ON CONSTRAINT "PK_daily_investment_plan" ON "trading_discipline_management"."daily_investment_plan" IS '일투자계획 기본키';

-- 분기투자원칙
CREATE TABLE "trading_discipline_management"."quarterly_investment_principles"
(
	"id"                      SERIAL        NOT NULL, -- ID
	"quarterly_plan_id"       INTEGER       NULL,     -- 분기계획ID
	"security_id"             INTEGER       NULL,     -- 종목ID
	"predicted_price"         NUMERIC(15,2) NULL,     -- 예상가격
	"stop_loss_price"         NUMERIC(15,2) NULL,     -- 손절가격
	"revenue"                 NUMERIC(15,2) NULL,     -- 매출액
	"revenue_growth_rate"     NUMERIC(5,2)  NULL,     -- 매출증가율
	"new_orders_amount"       NUMERIC(15,2) NULL,     -- 신규 수주액
	"order_backlog"           NUMERIC(15,2) NULL,     -- 수주잔고
	"operating_margin"        NUMERIC(5,2)  NULL,     -- 영업이익률
	"net_income"              NUMERIC(15,2) NULL,     -- 순이익
	"roe"                     NUMERIC(5,2)  NULL,     -- ROE
	"roic"                    NUMERIC(5,2)  NULL,     -- ROIC
	"free_cash_flow"          NUMERIC(15,2) NULL,     -- 잉여현금흐름
	"cash_conversion_rate"    NUMERIC(5,2)  NULL,     -- 현금전환율
	"interest_coverage_ratio" NUMERIC(5,2)  NULL,     -- 이자보상배율
	"per"                     NUMERIC(5,2)  NULL,     -- PER
	"pbr"                     NUMERIC(5,2)  NULL,     -- PBR
	"ev_ebitda"               NUMERIC(5,2)  NULL,     -- EV/EBITDA
	"psr"                     NUMERIC(5,2)  NULL,     -- PSR
	"fcf_yield"               NUMERIC(5,2)  NULL,     -- FCF수익률
	"valuation_type"          VARCHAR(20)   NULL,     -- 기업가치종류
	"performance_summary"     TEXT          NULL,     -- 실적
	"is_deleted"              BOOLEAN       NOT NULL  -- 삭제여부
);

-- 분기투자원칙
COMMENT ON TABLE "trading_discipline_management"."quarterly_investment_principles" IS '분기투자원칙';

-- ID
COMMENT ON COLUMN "trading_discipline_management"."quarterly_investment_principles"."id" IS 'ID';

-- 분기계획ID
COMMENT ON COLUMN "trading_discipline_management"."quarterly_investment_principles"."quarterly_plan_id" IS '분기계획ID';

-- 종목ID
COMMENT ON COLUMN "trading_discipline_management"."quarterly_investment_principles"."security_id" IS '종목ID';

-- 예상가격
COMMENT ON COLUMN "trading_discipline_management"."quarterly_investment_principles"."predicted_price" IS '예상가격';

-- 손절가격
COMMENT ON COLUMN "trading_discipline_management"."quarterly_investment_principles"."stop_loss_price" IS '손절가격';

-- 매출액
COMMENT ON COLUMN "trading_discipline_management"."quarterly_investment_principles"."revenue" IS '매출액';

-- 매출증가율
COMMENT ON COLUMN "trading_discipline_management"."quarterly_investment_principles"."revenue_growth_rate" IS '매출증가율';

-- 신규 수주액
COMMENT ON COLUMN "trading_discipline_management"."quarterly_investment_principles"."new_orders_amount" IS '신규 수주액';

-- 수주잔고
COMMENT ON COLUMN "trading_discipline_management"."quarterly_investment_principles"."order_backlog" IS '수주잔고';

-- 영업이익률
COMMENT ON COLUMN "trading_discipline_management"."quarterly_investment_principles"."operating_margin" IS '영업이익률';

-- 순이익
COMMENT ON COLUMN "trading_discipline_management"."quarterly_investment_principles"."net_income" IS '순이익';

-- ROE
COMMENT ON COLUMN "trading_discipline_management"."quarterly_investment_principles"."roe" IS 'ROE';

-- ROIC
COMMENT ON COLUMN "trading_discipline_management"."quarterly_investment_principles"."roic" IS 'ROIC';

-- 잉여현금흐름
COMMENT ON COLUMN "trading_discipline_management"."quarterly_investment_principles"."free_cash_flow" IS '잉여현금흐름';

-- 현금전환율
COMMENT ON COLUMN "trading_discipline_management"."quarterly_investment_principles"."cash_conversion_rate" IS '현금전환율';

-- 이자보상배율
COMMENT ON COLUMN "trading_discipline_management"."quarterly_investment_principles"."interest_coverage_ratio" IS '이자보상배율';

-- PER
COMMENT ON COLUMN "trading_discipline_management"."quarterly_investment_principles"."per" IS 'PER';

-- PBR
COMMENT ON COLUMN "trading_discipline_management"."quarterly_investment_principles"."pbr" IS 'PBR';

-- EV/EBITDA
COMMENT ON COLUMN "trading_discipline_management"."quarterly_investment_principles"."ev_ebitda" IS 'EV/EBITDA';

-- PSR
COMMENT ON COLUMN "trading_discipline_management"."quarterly_investment_principles"."psr" IS 'PSR';

-- FCF수익률
COMMENT ON COLUMN "trading_discipline_management"."quarterly_investment_principles"."fcf_yield" IS '1. 성장성: 사업이 커지고 있는가?
 1.1 매출액과 매출 증가율
 - 기업의 가장 위쪽 실적입니다.
 - 전년 동기 대비 매출 증가율
 - 최근 3~5년 연평균 성장률
 - 판매량 증가인지 가격 인상인지
 - 인수합병으로 늘어난 것인지 자체 성장인지
 * 매출이 증가하는데 이익이 줄어든다면 비용·가격경쟁 문제가 있을 수 있습니다

 1.2 수주와 수주잔고
  - 신규 수주액
  - 수주잔고
  - 매출 대비 수주잔고
  - 수주 가격과 예상 수익성
  - 취소 가능성
  * 조선·건설·방산·장비 기업에 중요합니다
  * 수주가 많아도 저가 수주라면 이익으로 이어지지 않을 수 있습니다
  
2. 수익성: 실제로 얼마나 남기는가?
 2.1 영업이익과 영업이익률
  - 매출 증가보다 영업이익이 더 빠르게 증가하는가?
  - 영업이익률이 상승하는가?
  - 경쟁사보다 높은가?
  - 일회성 비용을 제외해도 유지되는가?
  
 2.2 순이익
  * 영업이익에서 이자·세금·비영업손익을 반영한 최종 이익입니다
  * 순이익이 영업이익과 크게 다르면 다음을 확인합니다
  - 환율손익
  - 자각 매각이익
  - 파생상품 손익
  - 관계기업 손익
  - 이자비용
  - 법인세 효과
  
 2.3 ROE
  * 주주가 맡긴 자본으로 얼마나 벌었는지를 나타냅니다.
  * 대체로 ROE > 자기자본비용을 지속해야 기업가치가 증가합니다
  - 순이익 ÷ 평균자본금
  - 영업 경쟁력으로 높은가?
  - 부채를 많이 써서 높은가?
  - 자사주 매입으로 자기자본이 작아졌는가?
  - 일회성 이익 때문인가?
  
 2.4 ROIC
  - 세후영업이익 ÷ 영업투하자본
  * ROIC > WACC가 장기간 유지되는가
  * 유지된다면 기업이 투자할수록 가치가 늘어날 가능성이 큽니다
  
3. 이익의 질: 장부상으로 이익이 현금으로 들어오는가?
 3.1 영업현금흐름
  * 영업활동에서 실제로 발생한 현금입니다
  - 순이익은 흑자인데 영업현금흐름이 계속 적자인가?
  - 매출채권과 재고가 매출보다 빨리 증가하는가?
  - 선수금으로 일시적으로 현금이 좋아진 것인가?
 3.2 잉여현금흐름(FCF)
  - 영업현금흐름 - 자본적지출
  * 배당, 자사주 매입, 부채상황, 신규 투자에 쓸 수 있는 현금
 3.3 현금전환율
  - 영업현금흐름 ÷ 영업이익 or 영업현금흐름 ÷ 순이익

4. 재무안정성: 불황을 버틸 수 있는가?
 - 부채비율
 - 순차입금
 - 순차입금/EBITDA
 - 이자보상배율
 - 유동비율
 - 단기차입금 비중
 - 현금성자산
 - 차입금 만기 일정
 - 유상증자·전환사채 가능성
 4.1 이자보상배율
  - 영업이익 ÷ 이자비용
  * 영업이익으로 이자를 얼마나 감당할 수 있는가
  * 레버리지가 높은 시장에서는 기업 재무와 투자자 계좌 레버리지를 구분해야 함
 
 5. 가치평가: 좋은 기업을 너무 비싸게 사는 것은 아닌가?
  5.1 PER
   - REP = 주가 ÷ 주당순이익
   * 현재 가격이 연간 이익의 몇 배인지 봅니다
    - 기업 자신의 과거 PER
	- 같은 업종 경쟁사
	- 향후 성장률
	- 금리 자본비용
	- 이익의 경기순환 위치
	주의할 점:
	 - 경기민감주는 호황 정점에서 이익이 커져 PER이 아주 낮아보일 수 있습니다
	 - 적자기업에는 사용할 수 없습니다
	 - 일회성 이익으로 PER이 왜곡될 수 있습니다
	 - 후행 PER보다 12개월 선행 PER이 유용할 수 있지만 전망치가 틀릴 수 있습니다
   5.2 PBR
   - PBR = 주가 ÷ 주당순자산
   * 은행·보험·증권·자산보유기업에서 상대적으로 유용합니다
   * 하지만 낮은 PBR이 반드시 저평가는 아닙니다
    - ROE가 낮음
    - 자산의 질이 나쁨
    - 구조적으로 자본비용보다 못 벌고 있음
    - 지배구조가 나쁨
    - 자산 손상 가능성이 있음
   * PBR은 ROE와 함께 봐야 합니다
    - 낮은 PBR + 낮은 ROE = 저평가가 아닐 수 있음
    - 낮은 PBR + ROE 개선 + 주주환원 증가 = 재평가 가능성
   * KRX는 시장과 종목의 PER·PBR·배당수익률 자료를 제공합니다: https://data.krx.co.kr/contents/MDC/MAIN/main/index.cmd
  
 5.3 EV/EBITDA
  * EV = 시가총액 + 순차입금
  * EV/EBITDA = 기업가치 ÷ EBITDA
  * 부채가 서로 다른 기업을 비교할 때 PER보다 편리합니다
  * 통신·산업재·제조업처럼 감가상각이 큰 기업에서 많이 사용됩니다
  * 단, 설비 유지에 큰 현금이 계속 필요한 기업은 EBITDA가 실제 현금창출력을 과장할 수 있습니다.

 5.4 PSR
  - PSR = 시가총액 ÷ 매출액
  - 아직 이익이 적거나 적자인 성장기업에 사용하지만, 매출만 커지고 이익을 못 내는 기업을 비싸게 평가할 위험이 큽니다.
 
 5.5 FCF 수익률
  - FCF 수익률 = 잉여현금흐름 ÷ 시가총액
  * 현금 중심 가치평가에 유용합니다
  * 다만 투자 초기 기업은 대규모 설비투자로 FCF가 일시적으로 나쁠 수 있습니다
  
6. 전말의 방향: 현재 숫자보다 앞으로의 숫자가 좋아지는가?
 * 주가는 이미 발표된 실적보다 미래의 실적 변화에 반응하는 경우가 많습니다.
  - 올해와 내년 EPS 전망치
  - 영업이익 컨센서스
  - 최근 1개월·3개월 전망치 변화율
  - 상향 조정한 분석가 수 대 하향 조정한 수
  - 회사 가이던스 변화
  - 다음 분기의 전년 동기 대비 성장률
  - 수주·가격·원재료·환율 변화';

-- 기업가치종류
COMMENT ON COLUMN "trading_discipline_management"."quarterly_investment_principles"."valuation_type" IS '1. 성장성: 사업이 커지고 있는가?
 1.1 매출액과 매출 증가율
 1.2 수주와 수주잔고
2. 수익성: 실제로 얼마나 남기는가?
 2.1 영업이익과 영업이익률
 2.2 순이익
 2.3 ROE
   : 순이익 + 평균 자기자본
 2.4 ROIC
   : 세후영업이익 + 영업투하자본
3. 이익의 질: 장부상 이익이 현금으로 들어오는가?
 3.1 영업현금흐름
 3.2 잉여현금흐름
 3.3 현금전환율
4. 재무안정성: 불황을 버틸 수 있는가?';

-- 실적
COMMENT ON COLUMN "trading_discipline_management"."quarterly_investment_principles"."performance_summary" IS '실적';

-- 삭제여부
COMMENT ON COLUMN "trading_discipline_management"."quarterly_investment_principles"."is_deleted" IS '삭제여부';

-- 분기투자원칙 기본키
CREATE UNIQUE INDEX "PK_quarterly_investment_principles"
	ON "trading_discipline_management"."quarterly_investment_principles"
	( -- 분기투자원칙
		"id" ASC NULLS LAST -- ID
	);

-- 분기투자원칙 기본키
COMMENT ON INDEX "trading_discipline_management"."PK_quarterly_investment_principles" IS '분기투자원칙 기본키';

-- 분기투자원칙
ALTER TABLE "trading_discipline_management"."quarterly_investment_principles"
	ADD CONSTRAINT "PK_quarterly_investment_principles"
		-- 분기투자원칙 기본키
	PRIMARY KEY
	USING INDEX "PK_quarterly_investment_principles"
	NOT DEFERRABLE;

-- 분기투자원칙 기본키
COMMENT ON CONSTRAINT "PK_quarterly_investment_principles" ON "trading_discipline_management"."quarterly_investment_principles" IS '분기투자원칙 기본키';

-- 시장방향
CREATE TABLE "trading_discipline_management"."market_directions"
(
	"id"               INTEGER      NOT NULL, -- id
	"direction"        VARCHAR(20)  NULL,     -- 방향
	"factor_type"      VARCHAR(20)  NULL,     -- 요인종류
	"content"          TEXT         NULL,     -- 내용
	"rationale"        TEXT         NULL,     -- 투자근거
	"factor_value"     NUMERIC(5,2) NULL,     -- 수치
	"affected_targets" JSONB        NULL,     -- 영향대상
	"created_at"       DATE         NULL,     -- 생성일
	"updated_at"       DATE         NULL,     -- 수정일
	"remarks"          TEXT         NULL,     -- 비고
	"is_deleted"       BOOLEAN      NOT NULL  -- 삭제여부
);

-- 시장방향
COMMENT ON TABLE "trading_discipline_management"."market_directions" IS '시장방향';

-- id
COMMENT ON COLUMN "trading_discipline_management"."market_directions"."id" IS 'id';

-- 방향
COMMENT ON COLUMN "trading_discipline_management"."market_directions"."direction" IS '방향';

-- 요인종류
COMMENT ON COLUMN "trading_discipline_management"."market_directions"."factor_type" IS '요인: 시장호재요인-금리인하 / 시장악재요인-한국금리인상 / 시장경계요인-금리동결';

-- 내용
COMMENT ON COLUMN "trading_discipline_management"."market_directions"."content" IS '내용';

-- 투자근거
COMMENT ON COLUMN "trading_discipline_management"."market_directions"."rationale" IS '투자근거';

-- 수치
COMMENT ON COLUMN "trading_discipline_management"."market_directions"."factor_value" IS '수치';

-- 영향대상
COMMENT ON COLUMN "trading_discipline_management"."market_directions"."affected_targets" IS '주식 시장, 코스피, 코스닥, 금리';

-- 생성일
COMMENT ON COLUMN "trading_discipline_management"."market_directions"."created_at" IS '생성일';

-- 수정일
COMMENT ON COLUMN "trading_discipline_management"."market_directions"."updated_at" IS '수정일';

-- 비고
COMMENT ON COLUMN "trading_discipline_management"."market_directions"."remarks" IS '비고';

-- 삭제여부
COMMENT ON COLUMN "trading_discipline_management"."market_directions"."is_deleted" IS '삭제여부';

-- 시장방향 기본키
CREATE UNIQUE INDEX "PK_market_directions"
	ON "trading_discipline_management"."market_directions"
	( -- 시장방향
		"id" ASC NULLS LAST -- id
	);

-- 시장방향 기본키
COMMENT ON INDEX "trading_discipline_management"."PK_market_directions" IS '시장방향 기본키';

-- 시장방향
ALTER TABLE "trading_discipline_management"."market_directions"
	ADD CONSTRAINT "PK_market_directions"
		-- 시장방향 기본키
	PRIMARY KEY
	USING INDEX "PK_market_directions"
	NOT DEFERRABLE;

-- 시장방향 기본키
COMMENT ON CONSTRAINT "PK_market_directions" ON "trading_discipline_management"."market_directions" IS '시장방향 기본키';

-- 매수매도전략
CREATE TABLE "trading_discipline_management"."trading_strategies"
(
	"id"             SERIAL       NOT NULL, -- ID
	"method_id"      INTEGER      NULL,     -- 매수매도방법ID
	"strategy_type"  VARCHAR(20)  NULL,     -- 전략종류
	"step_no"        INTEGER      NULL,     -- n차
	"price_ratio"    NUMERIC(5,2) NULL,     -- 전략가격비율
	"quantity_ratio" NUMERIC(5,2) NULL,     -- 전략수량비율
	"sector"         VARCHAR(100) NULL,     -- 업종
	"created_at"     DATE         NULL,     -- 생성일
	"updated_at"     DATE         NULL,     -- 수정일
	"remarks"        TEXT         NULL,     -- 비고
	"is_deleted"     BOOLEAN      NOT NULL  -- 삭제여부
);

-- 매수매도전략
COMMENT ON TABLE "trading_discipline_management"."trading_strategies" IS '매수매도전략';

-- ID
COMMENT ON COLUMN "trading_discipline_management"."trading_strategies"."id" IS 'ID';

-- 가격데이터ID
COMMENT ON COLUMN "trading_discipline_management"."trading_strategies"."price_data_id" IS '가격데이터ID';

-- 정책명
COMMENT ON COLUMN "trading_discipline_management"."trading_strategies"."policy_name" IS '정책명';

-- 업종
COMMENT ON COLUMN "trading_discipline_management"."trading_strategies"."sector" IS '업종';

-- 생성일
COMMENT ON COLUMN "trading_discipline_management"."trading_strategies"."created_at" IS '생성일';

-- 수정일
COMMENT ON COLUMN "trading_discipline_management"."trading_strategies"."updated_at" IS '수정일';

-- 비고
COMMENT ON COLUMN "trading_discipline_management"."trading_strategies"."remarks" IS '비고';

-- 삭제여부
COMMENT ON COLUMN "trading_discipline_management"."trading_strategies"."is_deleted" IS '삭제여부';

-- 기준시각
COMMENT ON COLUMN "trading_discipline_management"."trading_strategies"."reference_at" IS '전략
10시 기준: 고가-저가 대비
매수전략: 25%(수량25%) 50%(수량25%) 75%(수량25%) 100%(수량25%) 
매도전략: 25%(수량25%) 50%(수량25%) 75%(수량25%) 100%(수량25%) 
10시 기준: 저가 대비
손절전략: -3.5%(수량20%) -5%(수량20%) -7%(수량20%) -8.5%(수량20%) -10%(수량20%) 
';

-- 매수매도전략 기본키
CREATE UNIQUE INDEX "PK_trading_strategies"
	ON "trading_discipline_management"."trading_strategies"
	( -- 매수매도전략
		"id" ASC NULLS LAST -- ID
	);

-- 매수매도전략 기본키
COMMENT ON INDEX "trading_discipline_management"."PK_trading_strategies" IS '매수매도전략 기본키';

-- 매수매도전략
ALTER TABLE "trading_discipline_management"."trading_strategies"
	ADD CONSTRAINT "PK_trading_strategies"
		-- 매수매도전략 기본키
	PRIMARY KEY
	USING INDEX "PK_trading_strategies"
	NOT DEFERRABLE;

-- 매수매도전략 기본키
COMMENT ON CONSTRAINT "PK_trading_strategies" ON "trading_discipline_management"."trading_strategies" IS '매수매도전략 기본키';

-- 나의필수원칙
CREATE TABLE "trading_discipline_management"."mandatory_principles"
(
	"id"         SERIAL  NOT NULL, -- id
	"priority"   INTEGER NULL,     -- 중요순위
	"content"    TEXT    NULL,     -- 내용
	"remarks"    TEXT    NULL,     -- 비고
	"created_at" DATE    NULL,     -- 생성일
	"updated_at" DATE    NULL,     -- 수정일
	"is_deleted" BOOLEAN NOT NULL  -- 삭제여부
);

-- 나의필수원칙
COMMENT ON TABLE "trading_discipline_management"."mandatory_principles" IS '나의필수원칙';

-- id
COMMENT ON COLUMN "trading_discipline_management"."mandatory_principles"."id" IS 'id';

-- 중요순위
COMMENT ON COLUMN "trading_discipline_management"."mandatory_principles"."priority" IS '중요순위';

-- 내용
COMMENT ON COLUMN "trading_discipline_management"."mandatory_principles"."content" IS '내용';

-- 비고
COMMENT ON COLUMN "trading_discipline_management"."mandatory_principles"."remarks" IS '비고';

-- 생성일
COMMENT ON COLUMN "trading_discipline_management"."mandatory_principles"."created_at" IS '생성일';

-- 수정일
COMMENT ON COLUMN "trading_discipline_management"."mandatory_principles"."updated_at" IS '수정일';

-- 삭제여부
COMMENT ON COLUMN "trading_discipline_management"."mandatory_principles"."is_deleted" IS '삭제여부';

-- 나의필수원칙 기본키
CREATE UNIQUE INDEX "PK_mandatory_principles"
	ON "trading_discipline_management"."mandatory_principles"
	( -- 나의필수원칙
		"id" ASC NULLS LAST -- id
	);

-- 나의필수원칙 기본키
COMMENT ON INDEX "trading_discipline_management"."PK_mandatory_principles" IS '나의필수원칙 기본키';

-- 나의필수원칙
ALTER TABLE "trading_discipline_management"."mandatory_principles"
	ADD CONSTRAINT "PK_mandatory_principles"
		-- 나의필수원칙 기본키
	PRIMARY KEY
	USING INDEX "PK_mandatory_principles"
	NOT DEFERRABLE;

-- 나의필수원칙 기본키
COMMENT ON CONSTRAINT "PK_mandatory_principles" ON "trading_discipline_management"."mandatory_principles" IS '나의필수원칙 기본키';

-- 가격데이터
CREATE TABLE "trading_discipline_management"."daily_security_price_data"
(
	"id"          INTEGER       NOT NULL, -- ID
	"security_id" INTEGER       NULL,     -- security_id
	"price_at"    TIMESTAMP     NULL,     -- 시각
	"high_price"  NUMERIC(15,2) NULL,     -- 고가
	"low_price"   NUMERIC(15,2) NULL,     -- 저가
	"current_price" NUMERIC(15,2) NULL,     -- 현재가
	"created_at"  DATE          NULL,     -- 생성일
	"updated_at"  DATE          NULL,     -- 수정일
	"remarks"     TEXT          NULL,     -- 비고
	"is_deleted"  BOOLEAN       NOT NULL  -- 삭제여부
);

-- 가격데이터
COMMENT ON TABLE "trading_discipline_management"."daily_security_price_data" IS '가격데이터';

-- ID
COMMENT ON COLUMN "trading_discipline_management"."daily_security_price_data"."id" IS 'ID';

-- security_id
COMMENT ON COLUMN "trading_discipline_management"."daily_security_price_data"."security_id" IS 'security_id';

-- 시각
COMMENT ON COLUMN "trading_discipline_management"."daily_security_price_data"."price_at" IS '시각';

-- 고가
COMMENT ON COLUMN "trading_discipline_management"."daily_security_price_data"."high_price" IS '고가';

-- 저가
COMMENT ON COLUMN "trading_discipline_management"."daily_security_price_data"."low_price" IS '저가';

-- 호가
COMMENT ON COLUMN "trading_discipline_management"."daily_security_price_data"."current_price" IS '현재가';

-- 생성일
COMMENT ON COLUMN "trading_discipline_management"."daily_security_price_data"."created_at" IS '생성일';

-- 수정일
COMMENT ON COLUMN "trading_discipline_management"."daily_security_price_data"."updated_at" IS '수정일';

-- 비고
COMMENT ON COLUMN "trading_discipline_management"."daily_security_price_data"."remarks" IS '비고';

-- 삭제여부
COMMENT ON COLUMN "trading_discipline_management"."daily_security_price_data"."is_deleted" IS '삭제여부';

-- 가격데이터 기본키
CREATE UNIQUE INDEX "PK_daily_security_price_data"
	ON "trading_discipline_management"."daily_security_price_data"
	( -- 가격데이터
		"id" ASC NULLS LAST -- ID
	);

-- 가격데이터 기본키
COMMENT ON INDEX "trading_discipline_management"."PK_daily_security_price_data" IS '가격데이터 기본키';

-- 가격데이터
ALTER TABLE "trading_discipline_management"."daily_security_price_data"
	ADD CONSTRAINT "PK_daily_security_price_data"
		-- 가격데이터 기본키
	PRIMARY KEY
	USING INDEX "PK_daily_security_price_data"
	NOT DEFERRABLE;

-- 가격데이터 기본키
COMMENT ON CONSTRAINT "PK_daily_security_price_data" ON "trading_discipline_management"."daily_security_price_data" IS '가격데이터 기본키';

-- 영향종목
CREATE TABLE "trading_discipline_management"."affected_securities"
(
	"market_directions_id" INTEGER NULL,     -- 시장방향ID
	"affected_security_id" INTEGER NULL,     -- 영향받는종목ID
	"created_at"           DATE    NULL,     -- 생성일
	"updated_at"           DATE    NULL,     -- 수정일
	"remarks"              TEXT    NULL,     -- 비고
	"is_deleted"           BOOLEAN NOT NULL  -- 삭제여부
);

-- 영향종목
COMMENT ON TABLE "trading_discipline_management"."affected_securities" IS '영향종목';

-- 시장방향ID
COMMENT ON COLUMN "trading_discipline_management"."affected_securities"."market_directions_id" IS '시장방향ID';

-- 영향받는종목ID
COMMENT ON COLUMN "trading_discipline_management"."affected_securities"."affected_security_id" IS '영향받는종목ID';

-- 생성일
COMMENT ON COLUMN "trading_discipline_management"."affected_securities"."created_at" IS '생성일';

-- 수정일
COMMENT ON COLUMN "trading_discipline_management"."affected_securities"."updated_at" IS '수정일';

-- 비고
COMMENT ON COLUMN "trading_discipline_management"."affected_securities"."remarks" IS '비고';

-- 삭제여부
COMMENT ON COLUMN "trading_discipline_management"."affected_securities"."is_deleted" IS '삭제여부';

-- AI피드백의견
CREATE TABLE "trading_discipline_management"."ai_decision_feedback"
(
	"id"                SERIAL       NOT NULL, -- id
	"model_id"          INTEGER      NULL,     -- AI모델D
	"opinion_type"      VARCHAR(20)  NULL,     -- 의견종류
	"object_id"         INTEGER      NULL,     -- 대상ID
	"table_name"        VARCHAR(200) NULL,     -- 테이블명
	"ai_decision"       TEXT         NULL,     -- AI결정
	"score"             NUMERIC(5,2) NULL,     -- 점수
	"confidence_score"  NUMERIC(5,2) NULL,     -- 신뢰도점수
	"reasoning_summary" TEXT         NULL,     -- 판단근거요약
	"risk_summary"      TEXT         NULL,     -- 위험요약
	"valid_until"       DATE         NULL,     -- 유효종료일
	"created_at"        DATE         NULL,     -- 생성일
	"updated_at"        DATE         NULL,     -- 수정일
	"remarks"           TEXT         NULL,     -- 비고
	"is_deleted"        BOOLEAN      NOT NULL  -- 삭제여부
);

-- AI피드백의견
COMMENT ON TABLE "trading_discipline_management"."ai_decision_feedback" IS 'AI피드백의견';

-- id
COMMENT ON COLUMN "trading_discipline_management"."ai_decision_feedback"."id" IS 'id';

-- AI모델D
COMMENT ON COLUMN "trading_discipline_management"."ai_decision_feedback"."model_id" IS 'AI모델D';

-- 의견종류
COMMENT ON COLUMN "trading_discipline_management"."ai_decision_feedback"."opinion_type" IS '의견종류
1. 계획 타당도 분석
2. 행위 합리성 분석
3. 성과/결과 분석
4. 전략 분석
5. 기타';

-- 대상ID
COMMENT ON COLUMN "trading_discipline_management"."ai_decision_feedback"."object_id" IS '대상ID';

-- 테이블명
COMMENT ON COLUMN "trading_discipline_management"."ai_decision_feedback"."table_name" IS '테이블명';

-- AI결정
COMMENT ON COLUMN "trading_discipline_management"."ai_decision_feedback"."ai_decision" IS 'AI결정';

-- 점수
COMMENT ON COLUMN "trading_discipline_management"."ai_decision_feedback"."score" IS '점수';

-- 신뢰도점수
COMMENT ON COLUMN "trading_discipline_management"."ai_decision_feedback"."confidence_score" IS '신뢰도점수';

-- 판단근거요약
COMMENT ON COLUMN "trading_discipline_management"."ai_decision_feedback"."reasoning_summary" IS '판단근거요약';

-- 위험요약
COMMENT ON COLUMN "trading_discipline_management"."ai_decision_feedback"."risk_summary" IS '위험요약';

-- 유효종료일
COMMENT ON COLUMN "trading_discipline_management"."ai_decision_feedback"."valid_until" IS '유효종료일';

-- 생성일
COMMENT ON COLUMN "trading_discipline_management"."ai_decision_feedback"."created_at" IS '생성일';

-- 수정일
COMMENT ON COLUMN "trading_discipline_management"."ai_decision_feedback"."updated_at" IS '수정일';

-- 비고
COMMENT ON COLUMN "trading_discipline_management"."ai_decision_feedback"."remarks" IS '비고';

-- 삭제여부
COMMENT ON COLUMN "trading_discipline_management"."ai_decision_feedback"."is_deleted" IS '삭제여부';

-- AI피드백의견 기본키
CREATE UNIQUE INDEX "PK_ai_decision_feedback"
	ON "trading_discipline_management"."ai_decision_feedback"
	( -- AI피드백의견
		"id" ASC NULLS LAST -- id
	);

-- AI피드백의견 기본키
COMMENT ON INDEX "trading_discipline_management"."PK_ai_decision_feedback" IS 'AI피드백의견 기본키';

-- AI피드백의견
ALTER TABLE "trading_discipline_management"."ai_decision_feedback"
	ADD CONSTRAINT "PK_ai_decision_feedback"
		-- AI피드백의견 기본키
	PRIMARY KEY
	USING INDEX "PK_ai_decision_feedback"
	NOT DEFERRABLE;

-- AI피드백의견 기본키
COMMENT ON CONSTRAINT "PK_ai_decision_feedback" ON "trading_discipline_management"."ai_decision_feedback" IS 'AI피드백의견 기본키';

-- 게시글
ALTER TABLE "trading_discipline_management"."posts"
	ADD CONSTRAINT "FK_user_profile_TO_posts"
	 -- 유저 -> 게시글
		FOREIGN KEY (
			"user_id" -- 유저ID
		)
		REFERENCES "trading_discipline_management"."user_profile" ( -- 유저
			"user_id" -- 유저아이디
		);

-- 유저 -> 게시글
COMMENT ON CONSTRAINT "FK_user_profile_TO_posts" ON "trading_discipline_management"."posts" IS '유저 -> 게시글';

-- 댓글/대댓글
ALTER TABLE "trading_discipline_management"."comments"
	ADD CONSTRAINT "FK_posts_TO_comments"
	 -- 게시글 -> 댓글/대댓글
		FOREIGN KEY (
			"posts_id" -- 게시글ID
		)
		REFERENCES "trading_discipline_management"."posts" ( -- 게시글
			"posts_id" -- 게시글ID
		);

-- 게시글 -> 댓글/대댓글
COMMENT ON CONSTRAINT "FK_posts_TO_comments" ON "trading_discipline_management"."comments" IS '게시글 -> 댓글/대댓글';

-- 댓글좋아요
ALTER TABLE "trading_discipline_management"."comments_like"
	ADD CONSTRAINT "FK_comments_TO_comments_like"
	 -- 댓글/대댓글 -> 댓글좋아요
		FOREIGN KEY (
			"comments_id" -- 댓글ID
		)
		REFERENCES "trading_discipline_management"."comments" ( -- 댓글/대댓글
			"comments_id" -- 댓글ID
		);

-- 댓글/대댓글 -> 댓글좋아요
COMMENT ON CONSTRAINT "FK_comments_TO_comments_like" ON "trading_discipline_management"."comments_like" IS '댓글/대댓글 -> 댓글좋아요';

-- 게시글좋아요
ALTER TABLE "trading_discipline_management"."posts_like"
	ADD CONSTRAINT "FK_posts_TO_posts_like"
	 -- 게시글 -> 게시글좋아요
		FOREIGN KEY (
			"posts_id" -- 게시글ID
		)
		REFERENCES "trading_discipline_management"."posts" ( -- 게시글
			"posts_id" -- 게시글ID
		);

-- 게시글 -> 게시글좋아요
COMMENT ON CONSTRAINT "FK_posts_TO_posts_like" ON "trading_discipline_management"."posts_like" IS '게시글 -> 게시글좋아요';

-- 사람
ALTER TABLE "trading_discipline_management"."person"
	ADD CONSTRAINT "FK_user_profile_TO_person"
	 -- 유저 -> 사람
		FOREIGN KEY (
			"user_id" -- 유저아이디
		)
		REFERENCES "trading_discipline_management"."user_profile" ( -- 유저
			"user_id" -- 유저아이디
		);

-- 유저 -> 사람
COMMENT ON CONSTRAINT "FK_user_profile_TO_person" ON "trading_discipline_management"."person" IS '유저 -> 사람';

-- 연투자계획
ALTER TABLE "trading_discipline_management"."annual_investment_plan"
	ADD CONSTRAINT "FK_broker_accounts_TO_annual_investment_plan"
	 -- 증권사계좌 -> 연투자계획
		FOREIGN KEY (
			"account_id" -- 증권사계좌ID
		)
		REFERENCES "trading_discipline_management"."broker_accounts" ( -- 증권사계좌
			"id" -- id
		);

-- 증권사계좌 -> 연투자계획
COMMENT ON CONSTRAINT "FK_broker_accounts_TO_annual_investment_plan" ON "trading_discipline_management"."annual_investment_plan" IS '증권사계좌 -> 연투자계획';

-- 종목
ALTER TABLE "trading_discipline_management"."securities"
	ADD CONSTRAINT "FK_broker_accounts_TO_securities"
	 -- 증권사계좌 -> 종목
		FOREIGN KEY (
			"account_id" -- 계좌ID
		)
		REFERENCES "trading_discipline_management"."broker_accounts" ( -- 증권사계좌
			"id" -- id
		);

-- 증권사계좌 -> 종목
COMMENT ON CONSTRAINT "FK_broker_accounts_TO_securities" ON "trading_discipline_management"."securities" IS '증권사계좌 -> 종목';

-- 이행
ALTER TABLE "trading_discipline_management"."orders"
	ADD CONSTRAINT "FK_securities_TO_orders"
	 -- 종목 -> 이행
		FOREIGN KEY (
			"security_id" -- 종목ID
		)
		REFERENCES "trading_discipline_management"."securities" ( -- 종목
			"id" -- ID
		);

-- 종목 -> 이행
COMMENT ON CONSTRAINT "FK_securities_TO_orders" ON "trading_discipline_management"."orders" IS '종목 -> 이행';

-- 투자원칙
ALTER TABLE "trading_discipline_management"."investment_principles"
	ADD CONSTRAINT "FK_principle_sources_TO_investment_principles"
	 -- 투자원칙소스 -> 투자원칙
		FOREIGN KEY (
			"source_id" -- 원칙소스ID
		)
		REFERENCES "trading_discipline_management"."principle_sources" ( -- 투자원칙소스
			"id" -- 원칙소스ID
		);

-- 투자원칙소스 -> 투자원칙
COMMENT ON CONSTRAINT "FK_principle_sources_TO_investment_principles" ON "trading_discipline_management"."investment_principles" IS '투자원칙소스 -> 투자원칙';

-- 매수매도방법
-- 2026-08-18 계층을 뒤집었다. 방법이 상위(가격데이터·정책명), 전략이 n차 줄이다.
ALTER TABLE "trading_discipline_management"."trading_strategies"
	ADD CONSTRAINT "FK_trading_strategy_methods_TO_trading_strategies"
	 -- 매수매도방법 -> 매수매도전략
		FOREIGN KEY (
			"method_id" -- 매수매도방법ID
		)
		REFERENCES "trading_discipline_management"."trading_strategy_methods" ( -- 매수매도방법
			"id" -- ID
		);

-- 매수매도방법 -> 매수매도전략
COMMENT ON CONSTRAINT "FK_trading_strategy_methods_TO_trading_strategies" ON "trading_discipline_management"."trading_strategies" IS '매수매도방법 -> 매수매도전략';

-- 분기투자계획
ALTER TABLE "trading_discipline_management"."quarterly_investment_plan"
	ADD CONSTRAINT "FK_annual_investment_plan_TO_quarterly_investment_plan"
	 -- 연투자계획 -> 분기투자계획
		FOREIGN KEY (
			"annual_plan_id" -- 연계획ID
		)
		REFERENCES "trading_discipline_management"."annual_investment_plan" ( -- 연투자계획
			"id" -- ID
		);

-- 연투자계획 -> 분기투자계획
COMMENT ON CONSTRAINT "FK_annual_investment_plan_TO_quarterly_investment_plan" ON "trading_discipline_management"."quarterly_investment_plan" IS '연투자계획 -> 분기투자계획';

-- 월투자계획
ALTER TABLE "trading_discipline_management"."monthly_investment_plan"
	ADD CONSTRAINT "FK_quarterly_investment_plan_TO_monthly_investment_plan"
	 -- 분기투자계획 -> 월투자계획
		FOREIGN KEY (
			"quarterly_plan_id" -- 분기계획ID
		)
		REFERENCES "trading_discipline_management"."quarterly_investment_plan" ( -- 분기투자계획
			"id" -- ID
		);

-- 분기투자계획 -> 월투자계획
COMMENT ON CONSTRAINT "FK_quarterly_investment_plan_TO_monthly_investment_plan" ON "trading_discipline_management"."monthly_investment_plan" IS '분기투자계획 -> 월투자계획';

-- 월투자원칙
ALTER TABLE "trading_discipline_management"."monthly_investment_principles"
	ADD CONSTRAINT "FK_monthly_investment_plan_TO_monthly_investment_principles"
	 -- 월투자계획 -> 월투자원칙
		FOREIGN KEY (
			"monthly_plan_id" -- 월계획ID
		)
		REFERENCES "trading_discipline_management"."monthly_investment_plan" ( -- 월투자계획
			"id" -- ID
		);

-- 월투자계획 -> 월투자원칙
COMMENT ON CONSTRAINT "FK_monthly_investment_plan_TO_monthly_investment_principles" ON "trading_discipline_management"."monthly_investment_principles" IS '월투자계획 -> 월투자원칙';

-- 주투자계획
ALTER TABLE "trading_discipline_management"."weekly_investment_plan"
	ADD CONSTRAINT "FK_securities_TO_weekly_investment_plan"
	 -- 종목 -> 주투자계획
		FOREIGN KEY (
			"security_id" -- 종목ID
		)
		REFERENCES "trading_discipline_management"."securities" ( -- 종목
			"id" -- ID
		);

-- 종목 -> 주투자계획
COMMENT ON CONSTRAINT "FK_securities_TO_weekly_investment_plan" ON "trading_discipline_management"."weekly_investment_plan" IS '종목 -> 주투자계획';

-- monthly_investment_plan -> weekly_investment_plan
ALTER TABLE "trading_discipline_management"."weekly_investment_plan"
	ADD CONSTRAINT "FK_monthly_investment_plan_TO_weekly_investment_plan"
	 -- monthly_investment_plan -> weekly_investment_plan
		FOREIGN KEY (
			"monthly_plan_id"
		)
		REFERENCES "trading_discipline_management"."monthly_investment_plan" (
			"id"
		);

COMMENT ON CONSTRAINT "FK_monthly_investment_plan_TO_weekly_investment_plan" ON "trading_discipline_management"."weekly_investment_plan" IS 'monthly_investment_plan -> weekly_investment_plan';


-- 일투자계획
ALTER TABLE "trading_discipline_management"."daily_investment_plan"
	ADD CONSTRAINT "FK_weekly_investment_plan_TO_daily_investment_plan"
	 -- 주투자계획 -> 일투자계획
		FOREIGN KEY (
			"weekly_plan_id" -- 주계획ID
		)
		REFERENCES "trading_discipline_management"."weekly_investment_plan" ( -- 주투자계획
			"id" -- ID
		);

-- 주투자계획 -> 일투자계획
COMMENT ON CONSTRAINT "FK_weekly_investment_plan_TO_daily_investment_plan" ON "trading_discipline_management"."daily_investment_plan" IS '주투자계획 -> 일투자계획';

-- 분기투자원칙
ALTER TABLE "trading_discipline_management"."quarterly_investment_principles"
	ADD CONSTRAINT "FK_quarterly_investment_plan_TO_quarterly_investment_principles"
	 -- 분기투자계획 -> 분기투자원칙
		FOREIGN KEY (
			"quarterly_plan_id" -- 분기계획ID
		)
		REFERENCES "trading_discipline_management"."quarterly_investment_plan" ( -- 분기투자계획
			"id" -- ID
		);

-- 분기투자계획 -> 분기투자원칙
COMMENT ON CONSTRAINT "FK_quarterly_investment_plan_TO_quarterly_investment_principles" ON "trading_discipline_management"."quarterly_investment_principles" IS '분기투자계획 -> 분기투자원칙';

-- 매수매도전략
ALTER TABLE "trading_discipline_management"."trading_strategy_methods"
	ADD CONSTRAINT "FK_daily_security_price_data_TO_trading_strategy_methods"
	 -- 가격데이터 -> 매수매도방법
		FOREIGN KEY (
			"price_data_id" -- 가격데이터ID
		)
		REFERENCES "trading_discipline_management"."daily_security_price_data" ( -- 가격데이터
			"id" -- ID
		);

-- 가격데이터 -> 매수매도전략
COMMENT ON CONSTRAINT "FK_daily_security_price_data_TO_trading_strategy_methods" ON "trading_discipline_management"."trading_strategy_methods" IS '가격데이터 -> 매수매도방법';

-- 가격데이터
ALTER TABLE "trading_discipline_management"."daily_security_price_data"
	ADD CONSTRAINT "FK_securities_TO_daily_security_price_data"
	 -- 종목 -> 가격데이터
		FOREIGN KEY (
			"security_id" -- security_id
		)
		REFERENCES "trading_discipline_management"."securities" ( -- 종목
			"id" -- ID
		);

-- 종목 -> 가격데이터
COMMENT ON CONSTRAINT "FK_securities_TO_daily_security_price_data" ON "trading_discipline_management"."daily_security_price_data" IS '종목 -> 가격데이터';

-- 영향종목
ALTER TABLE "trading_discipline_management"."affected_securities"
	ADD CONSTRAINT "FK_market_directions_TO_affected_securities"
	 -- 시장방향 -> 영향종목
		FOREIGN KEY (
			"market_directions_id" -- 시장방향ID
		)
		REFERENCES "trading_discipline_management"."market_directions" ( -- 시장방향
			"id" -- id
		);

-- 시장방향 -> 영향종목
COMMENT ON CONSTRAINT "FK_market_directions_TO_affected_securities" ON "trading_discipline_management"."affected_securities" IS '시장방향 -> 영향종목';

-- AI피드백의견
ALTER TABLE "trading_discipline_management"."ai_decision_feedback"
	ADD CONSTRAINT "FK_ai_model_runs_TO_ai_decision_feedback"
	 -- AI모델 -> AI피드백의견
		FOREIGN KEY (
			"model_id" -- AI모델D
		)
		REFERENCES "trading_discipline_management"."ai_model_runs" ( -- AI모델
			"id" -- id
		);

-- AI모델 -> AI피드백의견
COMMENT ON CONSTRAINT "FK_ai_model_runs_TO_ai_decision_feedback" ON "trading_discipline_management"."ai_decision_feedback" IS 'AI모델 -> AI피드백의견';

-- =========================================================
-- 필수원칙 적용기간 · 이행 원칙점검 (2026-08-18 추가)
-- 필수원칙을 어느 계층에서 꺼내 볼지 정하고, 일(DAY) 로 지정된 원칙은
-- 이행마다 지켰는지 Y/N 을 남긴다.
-- =========================================================

-- 필수원칙적용기간
CREATE TABLE "trading_discipline_management"."mandatory_principle_scopes"
(
	"id"           SERIAL      NOT NULL, -- ID
	"principle_id" INTEGER     NOT NULL, -- 필수원칙ID
	"period_type"  VARCHAR(20) NOT NULL  -- 적용기간
);

-- 필수원칙적용기간
COMMENT ON TABLE "trading_discipline_management"."mandatory_principle_scopes" IS '필수원칙적용기간';

-- ID
COMMENT ON COLUMN "trading_discipline_management"."mandatory_principle_scopes"."id" IS 'ID';

-- 필수원칙ID
COMMENT ON COLUMN "trading_discipline_management"."mandatory_principle_scopes"."principle_id" IS '필수원칙ID';

-- 적용기간
COMMENT ON COLUMN "trading_discipline_management"."mandatory_principle_scopes"."period_type" IS '적용기간';

-- 필수원칙적용기간
ALTER TABLE "trading_discipline_management"."mandatory_principle_scopes"
	ADD CONSTRAINT "PK_mandatory_principle_scopes" PRIMARY KEY ("id");

-- 원칙당 기간 하나씩만
ALTER TABLE "trading_discipline_management"."mandatory_principle_scopes"
	ADD CONSTRAINT "mandatory_scope_uniq" UNIQUE ("principle_id", "period_type");

-- 필수원칙 참조
ALTER TABLE "trading_discipline_management"."mandatory_principle_scopes"
	ADD CONSTRAINT "FK_mandatory_principles_TO_mandatory_principle_scopes"
	FOREIGN KEY ("principle_id")
	REFERENCES "trading_discipline_management"."mandatory_principles" ("id")
	ON DELETE CASCADE;

-- 이 테이블에는 is_deleted 가 없다. 체크박스의 on/off 라 삭제 이력이 의미가 없고,
-- 남겨 두면 조인 조회(?period_type=DAY)가 해제한 기간까지 잡는다.

-- 이행원칙점검
CREATE TABLE "trading_discipline_management"."order_principle_checks"
(
	"id"           SERIAL  NOT NULL, -- ID
	"order_id"     INTEGER NOT NULL, -- 이행ID
	"principle_id" INTEGER NOT NULL, -- 필수원칙ID
	"is_done"      BOOLEAN NOT NULL, -- 준수여부
	"note"         TEXT    NULL,     -- 점검메모
	"remarks"      TEXT    NULL,     -- 비고
	"created_at"   DATE    NULL,     -- 생성일
	"updated_at"   DATE    NULL,     -- 수정일
	"is_deleted"   BOOLEAN NOT NULL  -- 삭제여부
);

-- 이행원칙점검
COMMENT ON TABLE "trading_discipline_management"."order_principle_checks" IS '이행원칙점검';

-- ID
COMMENT ON COLUMN "trading_discipline_management"."order_principle_checks"."id" IS 'ID';

-- 이행ID
COMMENT ON COLUMN "trading_discipline_management"."order_principle_checks"."order_id" IS '이행ID';

-- 필수원칙ID
COMMENT ON COLUMN "trading_discipline_management"."order_principle_checks"."principle_id" IS '필수원칙ID';

-- 준수여부
COMMENT ON COLUMN "trading_discipline_management"."order_principle_checks"."is_done" IS '준수여부';

-- 점검메모
COMMENT ON COLUMN "trading_discipline_management"."order_principle_checks"."note" IS '점검메모';

-- 이행원칙점검
ALTER TABLE "trading_discipline_management"."order_principle_checks"
	ADD CONSTRAINT "PK_order_principle_checks" PRIMARY KEY ("id");

-- 이행당 원칙 하나씩만
ALTER TABLE "trading_discipline_management"."order_principle_checks"
	ADD CONSTRAINT "order_principle_check_uniq" UNIQUE ("order_id", "principle_id");

-- 이행 참조
ALTER TABLE "trading_discipline_management"."order_principle_checks"
	ADD CONSTRAINT "FK_orders_TO_order_principle_checks"
	FOREIGN KEY ("order_id")
	REFERENCES "trading_discipline_management"."orders" ("id")
	ON DELETE CASCADE;

-- 필수원칙 참조 (점검 기록이 남아 있으면 원칙을 지울 수 없다)
ALTER TABLE "trading_discipline_management"."order_principle_checks"
	ADD CONSTRAINT "FK_mandatory_principles_TO_order_principle_checks"
	FOREIGN KEY ("principle_id")
	REFERENCES "trading_discipline_management"."mandatory_principles" ("id")
	ON DELETE RESTRICT;
