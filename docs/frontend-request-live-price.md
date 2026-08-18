# 프론트 작업 요청 — 종목 시세를 수집값으로 표시

작성: 2026-08-18 / 백엔드 세션 → 프론트 세션 인계
백엔드는 **구현 완료**. 아래는 프론트에서 바꿀 것만 적는다.

---

## 0. 무엇이 바뀌었나

종목 API(`GET /api/trading/security/`) 응답에 **`live` 객체**가 추가됐다. 수집한 실제 시세다.

```json
{
  "id": 3, "symbol": "005380", "name": "현대자동차",
  "current_price": "446000.00",          // 사람이 입력한 값 (그대로 남아 있다)
  "computed_holding_quantity": 46,
  "market_value": 20516000.0,            // 수기값 × 보유수량 (기존 필드)

  "live": {
    "price": "438500.00",                        // 실제 시세
    "at": "2026-08-18T03:30:00.125795+00:00",    // 그 시세의 관측 시각 (UTC)
    "source": "SNAPSHOT",                        // 어디서 온 값인지
    "market_value": "20171000.00"                // 실제 시세 × 보유수량
  }
}
```

**추가 호출이 필요 없다.** 지금 부르는 종목 API 한 번에 시세까지 온다.
`market-symbol` API를 따로 불러 종목코드로 매칭하고 있다면 그 코드는 지워도 된다.

---

## 1. `source` — 어느 값이 선택됐는지

백엔드는 **장 시간을 판정하지 않는다.** 세 후보의 관측 시각을 비교해 가장 최근 것을 고른다.
그래서 장중/장후 분기가 저절로 맞는다.

| `source` | 뜻 | 언제 나오나 |
|---|---|---|
| `SNAPSHOT` | 현재가 조회값 | **장중.** 5분마다 갱신되는 값이라 대개 장중엔 이게 이긴다 |
| `MINUTE` | 분봉 종가 | 장중 일부 구간, 또는 마감 직후 |
| `DAILY` | 일봉 종가 | **장 마감 후·주말·휴장일.** 그날(또는 마지막 거래일) 15:30 종가 |
| `null` | 수집된 시세 없음 | 아직 한 번도 수집 안 된 종목 |

화면에서 굳이 `SNAPSHOT`/`MINUTE`을 구분해 보여 줄 필요는 없다. 둘 다 "장중 실시간"이다.
구분이 필요하면 이렇게 묶으면 된다:

```js
const isLive = live?.source === "SNAPSHOT" || live?.source === "MINUTE";  // 장중
const isClosed = live?.source === "DAILY";                                // 종가
```

---

## 2. 요청사항

### 2-1. 종목 목록·상세에서 시세를 `live.price` 로 표시

지금 `current_price`를 보여 주는 자리를 `live.price`로 바꾼다.

```js
const price = sec.live?.price ?? sec.current_price;   // live 없으면 수기값으로 폴백
```

**`current_price`를 화면에서 없애지는 말 것.** 둘을 나란히 두는 게 이 화면의 쓸모다.
실제로 이런 상태가 있었다:

```
현대자동차   수기 입력 446,000   실제 시세 438,500   (-7,500)
SK하이닉스  수기 입력 1,727,000  실제 시세 1,667,000  (-60,000)
```

수기 입력값이 얼마나 낡았는지가 그 자리에서 드러난다. 제안하는 표시:

```
현재가   438,500  ▼          ← live.price (크게)
         수기 446,000         ← current_price (작게, 회색)
```

값이 같으면 수기 줄은 생략해도 된다.

### 2-2. 관측 시각 표시

`live.at`은 **UTC**로 온다. KST로 바꿔 표시한다. 상대시간이 읽기 좋다.

```
438,500  (3분 전)          ← source: SNAPSHOT / MINUTE
438,500  (8/18 종가)        ← source: DAILY
```

`DAILY`일 때 "3분 전" 식으로 표시하면 장 마감 후에 "18시간 전"처럼 나와 이상해 보인다.
`source === "DAILY"`면 날짜 + `종가`로 쓰는 편이 낫다.

### 2-3. 평가금액도 `live.market_value` 로

기존 `market_value`(수기값 기준)는 그대로 남겨 뒀다. 화면에서는 `live.market_value`를
주로 쓰고, 없으면 기존 값으로 폴백한다.

```js
const value = sec.live?.market_value ?? sec.market_value;
```

포트폴리오 합계를 내는 곳이 있다면 그것도 `live.market_value` 기준으로 바꿔 달라.
수기값 기준 합계는 실제 자산과 어긋난다.

### 2-4. 시세가 없는 종목 처리

`live.price`가 `null`이면 아직 수집 전이다. `미수집` 배지 정도면 충분하다.
`current_price`만 표시하고 "수집된 시세 없음"을 알려 주면 된다.

---

## 3. 주의할 것

**`live`는 항상 존재한다.** 값이 없어도 `null`이 아니라 `{price: null, at: null, source: null, market_value: null}`
형태로 온다. `sec.live?.price` 처럼 optional chaining을 쓰면 안전하다.

**`live.price`와 `live.market_value`는 문자열이다.** 다른 금액 필드(`current_price` 등)와
형식을 맞췄다. 계산할 때 `Number()`로 변환해야 한다.

**`market_value`(기존)는 숫자, `live.market_value`는 문자열이다.** 타입이 다르니
폴백할 때 주의. 통일해서 쓰려면 양쪽 다 `Number()`를 거치는 게 안전하다.

---

## 4. 지금 데이터 상태

```
분봉  633건 적재됨
일봉  0건    ← 아직 backfill 안 함
```

일봉이 비어 있어도 동작한다(분봉·스냅샷으로 답이 나온다). 다만 장 마감 후에는 일봉이
있어야 정확한 종가가 나오므로, 사용자가 `kis_backfill_daily`를 돌리면 채워진다.

## 5. 백엔드 변경 파일

| 파일 | 내용 |
|---|---|
| `backend/market_data/services/pricing.py` | **신규** — 실효 시세 선택 로직 (관측 시각 비교) |
| `backend/trading_discipline/serializers/portfolio/security.py` | `live` 필드 추가 |
| `backend/trading_discipline/views/portfolio/security.py` | 서브쿼리 annotate (N+1 없음, 목록 조회 쿼리 1회) |
| `backend/market_data/tests/test_pricing.py` | **신규** — 장중/장후/주말 선택 테스트 8건 |
