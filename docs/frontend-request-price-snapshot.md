# 프론트 작업 요청 — 가격데이터를 일자 선택 방식으로

작성: 2026-08-18 / 백엔드 세션 → 프론트 세션 인계
백엔드는 **구현 완료**. 아래는 프론트에서 바꿀 것만 적는다.

> 이 문서는 갱신됐다. 이전 버전에서 `quote_price`(호가) 였던 필드가 **`current_price`(현재가)**
> 로 바뀌었다. 컬럼 이름이 잘못돼 있었고 실제로 담으려던 것은 현재가다.

---

## 0. 무엇이 바뀌나

일별가격데이터는 **매수매도전략을 짜기 위해 특정 일자의 시세를 떠 두는 스냅샷**이다.
지금은 고가·저가·현재가를 손으로 입력하는데, 이걸 **일자를 골라 담는 방식**으로 바꾼다.

```
기존   드롭다운에서 기존 가격데이터를 고른다
변경   종목 → 일자 목록에서 하루를 고른다 → 그 날의 고가·저가·현재가가 담긴다
```

기준 일자는 자유다. 한 달 전일 수도, 어제일 수도, 오늘일 수도 있다.

| 기준일 | 무엇을 담나 | `price_source` |
|---|---|---|
| **과거 일자** | 그날 일봉의 고가·저가·**종가** | `DAILY` |
| **당일** | 장 시작~지금까지 분봉 집계 (고가=최댓값, 저가=최솟값, 현재가=최신 종가) | `MINUTE` |

**한 번 만들어진 행은 다시 바뀌지 않는다.** 수집이 아무리 돌아도 건드리지 않는다.
전략의 근거 가격이 나중에 따라 움직이면 "왜 이 가격대에 걸었지"를 되짚을 수 없다.

---

## 1. 일자 목록은 이미 있는 API로 뽑는다

새 API가 필요 없다. 수집된 일봉이 곧 고를 수 있는 날짜다.

```js
GET /api/trading/market-daily-candle/?symbol=005380&no_page=1&ordering=-date
```

```json
{ "date": "2026-08-14", "open": "...", "high": "456000.00", "low": "421500.00",
  "close": "453000.00", "volume": 1234567 }
```

**이 응답 자체를 일자 목록으로 쓰면 된다.** 날짜와 함께 고가·저가·종가가 이미 들어 있어서,
목록에 값까지 같이 보여 줄 수 있다:

```
날짜          고가        저가        종가
2026-08-18   459,500    435,500    437,000    ← 오늘 (진행 중)
2026-08-14   456,000    421,500    453,000
2026-08-13   451,000    438,000    442,500
...
```

휴장일은 애초에 목록에 안 나온다(그날 봉이 없으니). 실제 거래일만 고르게 된다.

> 현재 적재 현황: **240행 / 80거래일 (2026-04-21 ~ 08-18) / 3종목**.
> 더 과거가 필요하면 사용자가 `kis_backfill_daily --days 365`를 돌리면 된다.

---

## 2. 저장 전 미리보기

```
GET /api/trading/security-price-data/preview/?security_id=3&date=2026-08-14
GET /api/trading/security-price-data/preview/?security_id=3               (오늘)
GET /api/trading/security-price-data/preview/?security_id=3&price_at=2026-08-18T13:00:00Z
```

```json
{
  "security": 3, "security_name": "현대자동차", "symbol": "005380",
  "price_at": "2026-08-14T15:30:00+09:00",
  "high_price": "456000.00",
  "low_price": "421500.00",
  "current_price": "453000.00",
  "price_source": "DAILY"
}
```

- **아무것도 저장하지 않는다.** 값만 계산해 보여 준다
- `date`(YYYY-MM-DD)는 일자 목록 흐름용. 과거면 그날 15:30 KST 기준, 오늘이면 지금 기준
- `price_at`(ISO 8601)은 시각까지 지정할 때. 둘 다 보내면 `price_at`이 이긴다
- 미래 날짜는 400이다
- 받는 파라미터는 `security_id`, `date`, `price_at` 셋뿐. 다른 걸 붙이면 400

---

## 3. 저장

```js
POST /api/trading/security-price-data/
{ "security": 3, "price_at": "2026-08-14T15:30:00+09:00" }
```

**고가·저가·현재가를 보내지 않으면 백엔드가 채운다.** 값을 실어 보내면 그대로 저장되고
자동 채움은 건너뛴다(사람이 직접 넣고 싶을 때).

`price_at`은 datetime이다. 일자 목록에서 고른 날짜를 이렇게 만들면 된다:

```js
const priceAt = `${date}T15:30:00+09:00`;   // 과거 일자
const priceAt = new Date().toISOString();   // 오늘
```

### 시세가 없을 때

`price_source`가 `null`이면 그 시점 시세가 없다. 저장하면 400이 뜬다:

```json
{"high_price": ["현대자동차(005380) 의 해당 시점 시세가 수집되지 않았다. 일봉을 먼저 수집하거나(kis_backfill_daily), 고가·저가를 직접 입력하라."]}
```

일자 목록을 일봉에서 뽑으면 이 상황은 거의 안 생긴다. 다만 **일봉이 있는 종목과 없는 종목이
섞일 수 있으니**(수집 대상이 아닌 종목) 미리보기 단계에서 막고 직접 입력으로 빠질 수
있게 해 두면 안전하다.

---

## 4. 주의할 것

**필드명이 바뀌었다.** `quote_price` → `current_price`. 폼·표·목록에서 쓰던 이름을 전부 바꿔야 한다.

**`securities.current_price`와 이름이 같지만 뜻이 다르다.**

```
securities.current_price                 지금 이 종목 시세. 5분마다 갱신된다.
daily_security_price_data.current_price  스냅샷을 뜬 그 시점 가격. 다시 안 바뀐다.
```

**수정(PATCH)에는 자동 채움이 없다.** 빈 칸을 나중에 채우려고 보내면 그 시점 시세가 들어와
스냅샷이 오염된다. "시세로 다시 채우기" 버튼은 두지 말 것 — 값을 다시 뜨려면 새 스냅샷을
만드는 게 맞다.

## 5. 백엔드 변경 파일

| 파일 | 내용 |
|---|---|
| `backend/market_data/services/pricing.py` | `price_snapshot()` — 고가·저가·현재가를 캔들에서 읽는다 |
| `backend/trading_discipline/models/portfolio/daily_security_price_data.py` | `quote_price` → `current_price` |
| `backend/trading_discipline/migrations/0008_...py` | `RenameField` (기존 값 보존) |
| `backend/trading_discipline/serializers/portfolio/daily_security_price_data.py` | 생성 시 자동 채움 |
| `backend/trading_discipline/views/portfolio/daily_security_price_data.py` | `preview` 액션 (`date` 지원) |
| `investments-nam.sql` | 컬럼명·주석 반영 |
