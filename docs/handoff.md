# 인수인계 노트

작업 세션이 바뀔 때 이어서 읽는 문서다. **새 세션은 맨 아래에 날짜 절을 덧붙인다.**
결정된 것보다 **아직 안 정해진 것**과 **함정**을 먼저 적는다 — 코드에 없는 정보만
여기 남긴다는 뜻이다. 코드가 이미 말하는 것(구조·함수 이름)은 반복하지 않는다.

---

## 2026-08-12 ~ 08-13 세션

### 0. 지금 당장 알아야 할 것 세 가지

1. **`fulfillment_service` 는 잠정이다.** 통째로 버려질 수 있다. 지우는 법과 이유는
   그 파일 상단 주석에 박아 뒀다. 아래 「미결」 1번도 같이 볼 것.
2. **DDL(ERD)과 코드가 두 군데 다르다.** 의도적으로 안 따랐다. 아래 「미결」 2번.
3. **로컬 백엔드는 `manage.py runserver 9071` 로 떠 있다**(도커 아님). 오토리로드가
   붙어 있어 코드 저장이 바로 반영된다. `docker compose` 로 띄우면 `daphne` 라
   오토리로드가 없으니 `docker compose restart backend` 가 필요하다.

### 1. 마이그레이션

| | 내용 | 상태 |
|---|---|---|
| `0002` | `news` 신설 + `affected_securities` 부모를 시장방향→뉴스로 | 적용·커밋됨(`ac69dfb`) |
| `0003` | `affected_securities` 뉴스 FK 컬럼 `id` → `news_id` | 적용됨, **미커밋** |
| `0004` | `news.expected_impact_from/until` (예상 영향 구간) | 적용됨, **미커밋** |
| `0005` | `daily_investment_plan.target_fill_price` (목표체결가) | 적용됨, **미커밋** |

`0002` 는 `affected_securities` 를 **DROP 후 재생성**한다. 쓰기 전 그 테이블이 0건
이어서 안전했다. 행이 있는 DB 에 적용하려면 데이터 이관을 먼저 해야 한다.

`0003` 을 따로 뗀 이유: `0002` 를 이미 적용한 뒤라 내용을 고치면 히스토리가 어긋난다.
컬럼 RENAME 이라 데이터는 그대로 옮겨 간다.

### 2. 이번 세션에 바꾼 것 (영역별)

**계획 화면**
- 캐스케이드에서 **일계획에는 기준일 필터를 안 건다**. 일계획은 하루짜리라 기준일로
  거르면 '오늘 것' 하나만 남아, 내일 것을 저장하는 순간 트리에서 사라졌다. 기간 판정은
  이미 부모 주계획에서 하므로 살아남은 주 아래 일계획은 전부 보여 준다.
- 일계획 날짜 입력을 **한 칸**으로 합쳤다(`유효시작일`/`유효종료일` → `계획일자`).
  `specs.js` 의 `mirrorTo` 속성 + `EntityForm.toPayload` 가 종료일을 복제한다.
  서버(`DailyPlanListSerializer.validate`)도 두 값을 같은 날로 강제한다.
- 타임테이블은 `only_active=0` 으로 **따로 조회**한다. 기준일 하루로 걸러진 트리를
  1년 축에 얹으면 일 행이 절대 안 채워졌다.

**이행 화면**
- 대조 기준일이 `created_at`(입력일) → **`executed_at`(이행일)** 로 바뀌었다.
  `execution_service.EFFECTIVE_DATE` 가 그것이다. KST 기준으로 날짜를 끊는다.
- 계획 매칭이 **일계획 우선 → 주(종목별)계획 폴백** 이 됐다(`_plans_covering`).
- 화면을 **이행일별로 묶었다**. 묶는 키는 서버가 판정에 쓴 `row.date` 다.
- `action_type` 배지에 색을 넣었다. 매수/매도는 채움형, 행위종류는 테두리형으로
  채널을 갈랐고 체결만 채운다.

**시장 화면 — 시장방향 → 뉴스 → 종목**
- 계층이 한 단 늘었다. 종목은 이제 반드시 뉴스를 거쳐 시장방향에 닿는다.
- 뉴스에 **예상 영향 구간**(`expected_impact_from/until`)이 있다. 기사가 난 날과
  영향이 먹히는 구간은 다르다. `/news/?impact_on=YYYY-MM-DD` 로 조회한다.
- 시장방향 목록 응답이 뉴스·종목까지 통째로 내려온다. 예전에 하위를 **상세에만**
  담아 목록 화면이 늘 비어 보이던 버그가 있었다 — 같은 실수 주의.
- 접기/펼치기 + 뉴스 5건 초과 시 "더 보기".

**성과 화면 — 계획 대비 이행 탭 (신규)**
- `/performance/plan-execution/?bucket=DAY|WEEK` — 구간별 집계 + 구간 안 종목별 내역.
- **집행률은 주별에만 있다.** 가용금액이 종목별 *주*계획에 있어서, 주 예산을 하루에
  갖다 대면 거짓 숫자가 나온다. 일별에 그 칸을 만들지 말 것.
- 표는 `DataTable` 을 안 쓴다(그 컴포넌트는 한 행에 한 줄만 그린다). 자체 테이블 +
  구간 줄 펼치면 종목 줄.

**가격 100배 버그 (수정 완료)**
- `FormField.formatPriceDisplay` 가 숫자 아닌 문자를 전부 걷어내며 **소수점까지**
  지웠다. DRF `DecimalField` 는 `"10000000.00"` 처럼 문자열로 내려오므로 소수부
  `00` 이 정수부에 붙어 **정확히 100배**가 됐다. 수정 폼을 열면 100배로 보이고
  그대로 저장하면 DB 에 100배가 박히는 경로였다.
- 세 군데 고쳤다: `formatPriceDisplay`(소수점 보존) / `sanitizePriceInput`(점 하나
  허용) / `EntityForm.initialValues`(0뿐인 소수부 제거).
- **DB 는 안 망가졌다.** 저장된 가격 전부 확인함(2026-08-13 기준).

**공통 인프라**
- `BaseCommonViewSet.FILTER_FIELDS` 값에 **lookup 튜플**을 쓸 수 있다. 한 파라미터로
  여러 조건을 AND 로 건다(`"impact_on": ("...__lte", "...__gte")`).
- 잘못된 필터 값이 **500 → 400** 이 됐다. `?date_from=bogus` 가 Django 의
  `ValidationError` 로 새어 500 을 내고 있었다. 22개 뷰셋 전부에 적용된다.

### 3. 미결 — 사용자 답을 기다리는 것

**1) 횡보 이행 기준 (가장 큰 건)**
`fulfillment_service` 상단 주석에 후보 (a)~(d)와 실데이터 비교표를 적어 뒀다.
현재 (a)는 **한 방향 매매면 늘 200%** 라 못 쓴다. 추천은 (b) 가용금액 대비.
허용선 기본값도 같이 정해야 한다(현재 `SIDEWAYS_TOLERANCE_PCT = 20.0` 은 무의미).
→ **이 모듈 전체가 삭제될 수도 있다.**

**2) ERD 재추출 시 반영할 것**
`investment-discipline.sql` 은 구버전이다(`news` 없음). 다시 뽑을 때 세 가지:

| 대상 | ERD | 실제 코드/DB |
|---|---|---|
| `affected_securities` 뉴스 FK | `id` | **`news_id`** |
| `news.direction` 코멘트 | `소스` | **`방향`** |
| `securities → affected_securities` | 관계선 없음 | **FK 있음**(Django 가 생성) |

FK 컬럼명을 안 따른 이유: 그 테이블 PK 는 `affected_security_id` 다. 기본키가 아닌
컬럼에 `id` 를 붙이면 raw SQL 읽는 사람이 전부 한 번씩 틀린다.

**3) 규율 준수율의 분모**
`action_type=PLAN` 만 뺐기 때문에 `CANCEL`/`REJECT` 가 분모에 남는다. 거부된 주문에
`계획 없음` 이 붙으면 준수율이 깎인다. 뺄지 별도 표기할지 미정.

**4) 예상가/목표가 대비 평균의 가중치**
두 겹으로 단순평균이다(종목 안에서 건별, 합계에서 구간별). 1주 산 건과 100주 산 건이
같은 무게다. 준수율·집행률은 건수/금액을 다시 나눠 구하는데 이 둘만 예외라 일관성이
없다. 금액 가중으로 바꿀지 미정.

**5) 게시판/유저 테이블**
DDL 에 있으나 코드 없음: `posts` `comments` `comments_like` `posts_like`
`attachment_files` `user_profile` `person`. 사용자가 **"나중에"** 로 미뤘다.

### 4. 함정 · 관례

- **주는 일~토(일요일 시작)** 로 끊는다. `PlanTimetable.makeCells` 와
  `plan_execution_service._week_start` 가 같은 관습을 쓴다. 한쪽만 바꾸면 같은 매매가
  다른 주에 잡혀 대조가 깨진다.
- **`mock.js` 에 실제 투자 기록이 들어간다.** `manage.py dump_mock` 이 운영 DB 를 그대로
  뜬다. 공개 리포지토리로 옮길 계획이 있으면 먼저 확인할 것.
- **`num()` 은 float 을 낸다.** 사람이 읽는 문장에 그대로 쓰면 `4569000.0` 이 된다.
  금액 문구에는 `fulfillment_service._won()` 같은 포매터를 쓸 것.
- **하위 데이터는 목록 시리얼라이저에도 넣어야 한다.** 상세에만 넣으면 목록 화면이
  늘 비어 보인다(시장방향에서 실제로 겪음). 대신 뷰의 `prefetch_list` 를 같이 깊게.
- **`.filter().count()` 는 prefetch 를 무시한다.** 시리얼라이저 안에서 쓰면 행마다
  쿼리가 나간다. 이미 올라온 것을 파이썬에서 셀 것.
- **검증용 데이터는 남기지 않는다.** 이 세션에서 만든 프로브(일계획 7·10, 뉴스 1,
  영향종목 1, 임시 목표체결가·영향구간)는 전부 되돌렸다. 사용자 투자 기록에 지어낸
  숫자를 남기면 나중 회고가 오염된다.
- **파일 편집은 Edit 로.** 인덱스 기반 문자열 치환(`s.index`)으로 JSX 를 자르다가
  `PerformancePage.jsx` 를 깨뜨려 `git checkout` 으로 되돌린 적이 있다.

### 5. 빠른 검증

```bash
# 서버 확인 (로컬 runserver 9071)
curl -s "http://localhost:9071/api/trading/cascade/?on=2026-08-13&only_active=1"
curl -s "http://localhost:9071/api/trading/performance/plan-execution/?bucket=WEEK&date_from=2026-08-01&date_to=2026-08-31"
curl -s "http://localhost:9071/api/trading/news/?no_page=1&impact_on=2026-08-15"

# 모델·마이그레이션 동기 확인
cd backend && .venv/Scripts/python.exe manage.py makemigrations --check --dry-run

# 프론트 빌드 (경고 0 이어야 정상)
cd frontend && npm run build
```

셸에서 한글을 curl 본문에 직접 넣으면 인코딩이 깨진다. POST 검증은 ASCII 로 하거나
파일로 넘길 것. Django shell 스크립트는 `encoding='utf-8-sig'` 로 읽어야 BOM 에 안 걸린다.
