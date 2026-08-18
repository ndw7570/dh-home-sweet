# 프론트 작업 요청 — 시세(KIS) 화면 연결

작성: 2026-08-18 / 백엔드 세션 → 프론트 세션 인계
백엔드 API는 **구현 완료**. 아래는 프론트에서 붙일 것만 적는다.

---

## 0. 배경

한국투자증권(KIS) 오픈API로 시세를 수집하는 백엔드가 붙었다. 일봉·분봉·현재가가 DB에
쌓이지만 **지금은 화면에서 볼 방법이 없다** — 조회 API가 없었기 때문이다. 그 API를 열었다.

수집 대상은 **화면이 정한다.** 종목 화면에서 종목을 등록하고 `관리대상`(`is_active`)을
켜면 수집되고, 끄면 멈춘다. 별도의 구독 스위치는 없다(있었는데 화면과 어긋나서 없앴다).
반영 시점은 다음 수집 주기 — 현재가 5분, 분봉 10분이다.

---

## 1. 엔드포인트

기존과 같은 base(`/api/trading/`)다. `api.get` 래퍼를 그대로 쓰면 된다.
응답 봉투(`success` / `results` / `meta`)와 `no_page`, `page_size`, `ordering` 도 동일하다.

### 1-1. 수집 종목 — `GET /market-symbol/`

```
필터: symbol, symbol_in, market, name
```

```json
{
  "success": true,
  "results": [
    {
      "id": 3, "market": "KOSPI", "market_label": "코스피",
      "symbol": "005930", "name": "삼성전자",
      "last_price": "73800.00",
      "last_price_at": "2026-08-18T05:35:00Z",
      "is_target": true,
      "is_deleted": false,
      "created_at": "...", "updated_at": "..."
    }
  ],
  "meta": { "count": 3, "page": null }
}
```

- **`is_target`** — 지금 수집 중인지. `securities`의 `is_active`를 확인해 붙인 값이다.
  `false`면 과거에 수집했지만 지금은 대상이 아니라는 뜻(쌓인 봉은 남아 있다).
- `last_price` / `last_price_at` — 마지막으로 조회한 현재가와 그 시각. 장중 5분마다 갱신된다.

### 1-2. 일봉 — `GET /market-daily-candle/`

```
필터: symbol(종목코드) 또는 symbol_id, date_from, date_to
정렬 기본값: -date
```

```json
{
  "id": 101, "symbol": 3, "date": "2026-08-18",
  "open": "73000.00", "high": "74200.00", "low": "72800.00", "close": "73800.00",
  "volume": 12345678, "trade_amount": 910000000000,
  "collected_at": "...",
  "symbol_detail": { "id": 3, "symbol": "005930", "name": "삼성전자", "market": "KOSPI" }
}
```

### 1-3. 분봉 — `GET /market-minute-candle/`

```
필터: symbol 또는 symbol_id, date(KST 기준 날짜), ts_from, ts_to
정렬 기본값: -ts
```

`ts`는 **봉이 시작하는 시각이고 UTC로 내려간다.** 09:00 KST 봉은 `2026-08-18T00:00:00Z`다.
화면에 찍을 때 KST로 바꿔야 한다. `date` 필터는 KST 기준이라 `?date=2026-08-18`이면
그날 09:00~15:30 구간이 나온다.

---

## 2. 반드시 지켜야 할 제약 두 가지

### 2-1. 봉 조회는 종목 지정이 필수다

```
GET /market-daily-candle/                    → 400
GET /market-daily-candle/?symbol=005930      → 200
```

종목 없이 전체 봉을 긁는 질의는 화면에 쓸 일이 없는데 양은 수백만 행까지 간다.
한 번 실수로 나가면 DB와 화면이 함께 멈춘다. 400 메시지는 이렇게 온다:

```json
{ "success": false, "results": { "symbol": ["종목을 지정해야 한다. `?symbol=005930` 또는 …"] } }
```

**종목 선택 전에는 봉 API를 호출하지 말 것.** 종목 목록을 먼저 받아 하나를 고른 뒤 호출한다.

### 2-2. 전부 읽기 전용이다

`POST` / `PUT` / `PATCH` / `DELETE` 는 **405**다. 봉과 종목은 수집기가 쌓는 사실 기록이라
화면에서 만들거나 고칠 수 없다. 종목을 수집 대상에 넣고 빼는 건 **기존 종목 화면의
`관리대상` 체크박스**로 한다 — 이미 있는 폼 필드다(`forms/specs.js:51`).

---

## 3. 요청사항

### 3-1. 종목 화면(SecurityPage)에 현재가 표시

지금 종목 목록은 `securities.current_price`(사람이 입력한 값)를 보여 준다. 여기에
**수집된 시세**를 나란히 붙여 달라.

1. 종목 목록을 띄울 때 `GET /market-symbol/?no_page=1`을 함께 불러 `symbol`(종목코드)로 매칭
2. 각 행에 `last_price`와 `last_price_at`을 표시. 예: `73,800 (5분 전)`
3. `is_target === false`면 `수집 안 함` 배지. 사용자가 왜 시세가 안 도는지 알 수 있어야 한다
4. `last_price`가 `null`이면 `미조회` — 아직 한 번도 안 가져온 종목이다

**`securities.current_price`와 값이 다를 수 있고, 그게 정상이다.** 하나는 사람이 입력한
값이고 다른 하나는 수집한 값이다. 둘을 나란히 보여 주는 것이 이 화면의 쓸모다 —
사람이 입력한 값이 얼마나 낡았는지 그 자리에서 드러난다.

### 3-2. 종목 상세에 차트

종목을 선택하면 일봉 차트를 띄운다.

```js
GET /market-daily-candle/?symbol=005930&date_from=2026-05-20&date_to=2026-08-18&no_page=1
```

- 기본 구간은 최근 3개월 정도. 구간 선택(1개월/3개월/1년) 버튼이 있으면 좋다
- 데이터가 0건일 수 있다 — 아직 수집 전이거나 관리대상이 아닌 종목이다.
  빈 차트 대신 `수집된 시세가 없습니다` 안내를 띄워 달라
- 분봉 차트는 당일치만 있다(`?date=오늘`). 장 시작 전이면 0건이 정상이다

### 3-3. 수집 상태 표시 (선택)

`last_price_at`이 장중인데 30분 이상 낡았다면 수집이 멈춘 것이다. 종목 화면 상단에
경고를 띄우면 사용자가 바로 알 수 있다. 우선순위는 낮다.

---

## 4. 지금 데이터가 비어 있다

KIS 앱키를 아직 안 넣어서 봉 테이블이 전부 0건이다. 화면을 만들 때는 **0건 상태가 기본**이라
생각하고 빈 상태 처리를 먼저 해 달라. 키가 들어가고 `kis_backfill_daily`가 돌면 일봉부터
채워진다(장 마감 후·휴장일에도 수집된다).

## 5. 백엔드 변경 파일

| 파일 | 내용 |
|---|---|
| `backend/market_data/views.py` | **신규** — 읽기 전용 뷰셋 3개 |
| `backend/market_data/serializers.py` | **신규** |
| `backend/market_data/urls.py` | **신규** — 라우터 |
| `backend/core/urls.py` | `api/trading/` 에 market_data 라우팅 추가 |
| `backend/core/constants/filters.py` | 필터 화이트리스트 3종 추가 |
| `backend/market_data/models.py` | `Symbol.is_subscribed` 제거 (화면이 단일 기준) |
