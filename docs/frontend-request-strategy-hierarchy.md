# 프론트 작업 요청 — 전략/방법 계층 뒤집기

작성: 2026-08-18 / 백엔드 세션 → 프론트 세션 인계
백엔드는 **구현 완료**. 기존 전략 데이터는 사용자 승인 하에 **전부 삭제**했다(4행).

---

## 0. 무엇이 바뀌었나

**매수매도방법과 매수매도전략의 상하 관계가 뒤집혔다.**

```
[기존]  매수매도전략(상위)  1:N  매수매도방법(n차 줄)
[변경]  매수매도방법(상위)  1:N  매수매도전략(n차 줄)
```

이름과 실제 역할이 어긋나 있었다. n차 한 줄은 '방법'이 아니라 그 방법을 이루는 한 단계다.

```
매수매도방법 #1                      ← 분할 계획 한 벌의 머리
  가격데이터: 현대차 8/14
             고 456,000 / 저 421,500 / 현재 453,000
             밴드 -6.95% ~ +0.66%
  정책명: 현대차 8월 분할매수
  업종: 자동차
   ├ 매수매도전략 BUY_SPLIT 1차  -3%   30%
   ├ 매수매도전략 BUY_SPLIT 2차  -7%   30%
   └ 매수매도전략 BUY_SPLIT 3차  -12%  40%
```

**컬럼이 통째로 자리를 바꿨다.** 엔드포인트 경로는 그대로다.

| | 기존 | 변경 |
|---|---|---|
| `trading-strategy-method` | `strategy`, `strategy_type`, `step_no`, `price_ratio`, `quantity_ratio`, `sector` | **`price_data`, `policy_name`, `sector`, `reference_at`** |
| `trading-strategy` | `price_data`, `policy_name`, `sector`, `reference_at` | **`method`, `strategy_type`, `step_no`, `price_ratio`, `quantity_ratio`, `sector`** |

---

## 1. 방법 (상위)

```
GET  /api/trading/trading-strategy-method/?no_page=1
GET  /api/trading/trading-strategy-method/{id}/
POST /api/trading/trading-strategy-method/
```

목록 응답:

```json
{
  "id": 1, "policy_name": "현대차 8월 분할매수", "sector": "자동차",
  "reference_at": "2026-08-14T15:30:00+09:00",
  "price_data": 3,
  "price_data_detail": {
    "id": 3, "security": 3, "price_at": "...",
    "high_price": "456000.00", "low_price": "421500.00", "current_price": "453000.00"
  },
  "strategy_count": 3
}
```

**상세(`{id}/`)를 부르면 분할표가 전략종류별로 묶여서 온다:**

```json
"strategies": {
  "BUY_SPLIT": [
    { "id": 1, "step_no": 1, "price_ratio": "-3.00",  "quantity_ratio": "30.00" },
    { "id": 2, "step_no": 2, "price_ratio": "-7.00",  "quantity_ratio": "30.00" },
    { "id": 3, "step_no": 3, "price_ratio": "-12.00", "quantity_ratio": "40.00" }
  ],
  "SELL_SPLIT": [ ... ]
}
```

필터: `price_data_id`, `policy_name`, `sector`, `reference_from`, `reference_to`

## 2. 전략 (n차 줄)

```
GET  /api/trading/trading-strategy/?method_id=1&no_page=1
POST /api/trading/trading-strategy/
{ "method": 1, "strategy_type": "BUY_SPLIT", "step_no": 1,
  "price_ratio": "-3.00", "quantity_ratio": "30.00", "sector": "자동차" }
```

필터: `method_id`, `strategy_type`, `sector`

### 부호 검증이 새로 생겼다

```
분할매수(BUY_SPLIT)  → price_ratio 는 음수여야 한다   (-3 = 3% 하락 시 산다)
분할매도(SELL_SPLIT) → price_ratio 는 양수여야 한다
```

어기면 400이다:

```json
{"price_ratio": ["분할매수는 하락 시 사는 계획이라 음수여야 한다 (입력: 3.00). 오를 때 사는 계획이라면 전략종류를 다시 보라."]}
```

부호가 방향과 어긋나면 표를 읽는 사람이 정반대로 이해한다. 분할매수 +3%는 "3% 오르면 산다"가
되어 물타기 계획이 불타기 계획이 된다. 폼에서 미리 막아 주면 좋다 — 전략종류를 고르면
입력칸에 부호를 힌트로 띄우는 식이 자연스럽다.

---

## 3. 요청사항 — `StrategyPage` 재구성

지금 화면은 전략이 상위인 전제로 짜여 있다. 뒤집어야 한다.

### 3-1. 목록은 **방법** 기준

```
정책명                  종목        기준일       분할  업종
현대차 8월 분할매수     현대자동차  8/14        3단계  자동차
삼성전자 3분할 매수     삼성전자    8/18        5단계  반도체
```

`strategy_count`가 단계 수다. 종목은 `price_data_detail`을 통해 얻는다.

### 3-2. 방법 만들기 = 2단계

```
1) 가격데이터 고르기      ← docs/frontend-request-price-snapshot.md 의 일자 선택 흐름
   종목 → 일자 → 미리보기 → 저장
2) 그 위에 방법 만들기    { price_data, policy_name, sector, reference_at }
3) 방법 아래 n차 줄 추가  { method, strategy_type, step_no, price_ratio, quantity_ratio }
```

가격데이터를 먼저 떠야 방법을 만들 수 있다. 1·2를 한 화면에서 이어지게 하면 흐름이 끊기지 않는다.

### 3-3. 분할표 입력에 변동폭을 같이 보여 줄 것

**이게 이번 구조 변경의 핵심 이유다.** 몇 %에 걸지는 그 종목이 실제로 얼마나 움직였는지를
보고 정하는 숫자다. 방법에 달린 가격데이터가 그 근거를 갖고 있다:

```
현대차 8/14 기준
  고가 +0.66%   저가 -6.95%   밴드 7.61%
  ─────────────────────────────────────
  1차  [-3.00] %   [30] %      ← 밴드 안에 들어오는지 눈으로 확인되게
  2차  [-7.00] %   [30] %      ← 저가(-6.95%)를 살짝 넘음. 표시해 주면 좋다
  3차  [-12.00] %  [40] %      ← 밴드 밖. 더 큰 하락을 가정한 것
```

`price_data_detail`에는 `high_rate`·`low_rate`·`band_width`가 **아직 안 들어간다**
(`DailySecurityPriceDataParentSerializer`가 최소 필드만 낸다). 필요하면 말해 달라 —
Parent 시리얼라이저에 추가하겠다. 지금은 가격데이터를 따로 조회하면 나온다.

### 3-4. 수량 비중 합계

`quantity_ratio` 합이 전략종류별로 100%가 되어야 한다. 백엔드는 이걸 강제하지 않는다
(입력 중간 상태를 막으면 표를 못 만든다). **화면에서 합계를 표시**해 달라.

```
BUY_SPLIT 합계 100%  ✔
SELL_SPLIT 합계  80%  ← 20% 남음
```

---

## 4. 주의할 것

**기존 전략 데이터는 없다.** 4행 전부 삭제했다(사용자 승인). 화면에서 빈 목록이 정상이다.

**엔드포인트 이름은 그대로다.** `trading-strategy`, `trading-strategy-method` 둘 다 유지된다.
바뀐 건 각각이 무엇을 담느냐다.

**`price_data_detail`은 방법 쪽에만 있다.** 전략(n차 줄)에는 `method_detail`이 온다.

## 5. 백엔드 변경 파일

| 파일 | 내용 |
|---|---|
| `backend/trading_discipline/models/strategy/trading_strategy.py` | n차 줄로 (method FK) |
| `backend/trading_discipline/models/strategy/trading_strategy_method.py` | 상위로 (price_data FK) |
| `backend/trading_discipline/migrations/0009_...py` | 컬럼 교체 |
| `backend/trading_discipline/serializers/strategy/*.py` | 역할 교체 + 부호 검증 |
| `backend/trading_discipline/views/strategy/*.py` | 역할 교체 |
| `backend/core/constants/filters.py` | 필터 교체 |
| `backend/trading_discipline/management/commands/seed_demo.py` | 새 구조로 |
| `investments-nam.sql` | 테이블 2개 + FK 2개 반영 |

---

## 6. 템플릿 (요청하신 두 가지, 구현 완료)

`docs/backend-request-method-template.md` 로 요청하신 것에 대한 답이다.

**`name` 컬럼은 만들지 않았다.** 계층을 뒤집으면서 `policy_name` 이 그 역할을 하게 됐다.
방법 한 행이 이미 "n차 표 한 벌" 이라 이름칸이 따로 필요 없다.

### 6-1. 템플릿 = 가격데이터가 안 붙은 방법

```
GET /api/trading/trading-strategy-method/?template=1&no_page=1   → 재사용 템플릿만
GET /api/trading/trading-strategy-method/?template=0&no_page=1   → 실제 계획만
```

`price_data` 가 비어 있으면 종목·시점과 무관한 순수 비율 패턴이다.

```
"3단 보수적 분할"     price_data 없음   ← 템플릿
   1차 -3% 30% / 2차 -7% 30% / 3차 -12% 40%

"현대차 8월 분할매수"  price_data 있음   ← 실제 계획
```

템플릿 만들기는 그냥 `POST` 에서 `price_data` 를 빼면 된다. 별도 엔드포인트 없다.

### 6-2. 적용 = 복사 (한 트랜잭션)

```js
POST /api/trading/trading-strategy-method/{대상id}/copy-from/
{ "source": 템플릿id }
```

응답은 대상 방법의 상세 + 두 숫자:

```json
{ "...방법 필드...", "strategies": {...}, "copied": 3, "removed": 2 }
```

- **덮어쓰기다.** `removed` 가 지워진 줄 수, `copied` 가 새로 넣은 줄 수다.
  화면에서 "2줄을 3줄로 바꿨습니다" 로 알릴 수 있다
- 지워진 줄은 소프트딜리트라 잘못 덮었으면 되살릴 수 있다
- **업종은 대상 것을 유지한다.** 템플릿 업종을 끌고 오면 반도체 템플릿을 쓴 자동차 계획이
  반도체로 뒤바뀐다
- 원본은 템플릿이 아니어도 된다 — 지난달 방법의 분할표를 이번 달로 가져오는 것도 같은 동작이다

400 나는 경우:
```
source 없음 / 못 찾음 / 자기 자신 / 원본에 분할표가 없음
```

마지막 것은 빈 표로 덮어써서 대상의 분할표만 사라지는 사고를 막는 것이다.
