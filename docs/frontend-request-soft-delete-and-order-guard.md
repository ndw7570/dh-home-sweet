# 프론트 작업 요청 — 소프트딜리트 모드 토글 · 물리 삭제 · 이행 입력 경고

작성: 2026-08-18 / 백엔드 세션 → 프론트 세션 인계
백엔드 쪽은 **구현 완료**. 아래는 프론트에서 붙일 것만 적는다.

---

## 0. 배경 — 무슨 일이 있었나

현대자동차 보유수량이 **464,026주**로 표시됐다. 원인은 `orders.id=23` 한 행이다.

```
order id=23  security=3(현대차)  FILL  MARKET  BUY
             quantity = 464,000      ← 여기에 가격을 적었다
             limit_price = 20.00     ← 여기에 수량을 적었다
             is_deleted = False      ← 삭제된 행이 아니다. 살아 있다.
```

보유수량 464,026 = 기초 보유수량 26 + FILL 순증감 464,000.

처음엔 `is_deleted` 필터 누수를 의심했으나 **아니었다.** 리스트 annotation
(`backend/trading_discipline/views/portfolio/security.py:27`)에도 상세 fallback
(`models/portfolio/security.py:78`)에도 소프트딜리트 필터가 정상적으로 걸려 있다.
`forms/specs.js:599-605`의 `quantity`/`limit_price` 매핑도 정상이다.

**문제는 막는 것이 아무것도 없었다는 점이다.** 수량 칸에 46만을 적어도 경고 한 번 없이 저장됐다.
그래서 (1) 입력 단계에서 경고하고, (2) 이미 쌓인 가비지를 어드민이 지울 수 있게 한다.

> `orders.id=23` 데이터 자체는 **손대지 않았다.** 사용자가 직접 처리할 예정이다.

---

## 1. 소프트딜리트 모드 토글 (신규 UI)

백엔드는 **이미 지원한다.** 프론트가 안 쓰고 있을 뿐이다.

### API

모든 목록 엔드포인트에 쿼리 파라미터 하나:

```
GET /api/trading/{resource}/?soft_delete_mode=alive     # 기본값 — 살아 있는 행만 (현재 동작)
GET /api/trading/{resource}/?soft_delete_mode=deleted   # 삭제된 행만
GET /api/trading/{resource}/?soft_delete_mode=all       # 전부 (is_deleted 무관)
```

- 파라미터를 안 보내면 `alive`. 기존 화면은 그대로 동작한다.
- `soft_delete_mode`는 strict 검사 예외 목록에 이미 등록돼 있다
  (`backend/core/constants/filters.py:16`). 400 나지 않는다.
- 응답 각 행에 `is_deleted` 필드가 이미 들어 있다. 이걸로 행을 구분해 표시하면 된다.

### 요청사항

1. **목록 화면 공통 토글.** 라벨 예: `삭제분 포함 보기`. 3-state(살아있는 것만 / 삭제된 것만 / 전부)
   또는 체크박스 2개 중 편한 쪽. 최소한 `alive` ↔ `all` 은 오갈 수 있어야 한다.
2. **삭제분 행 시각 구분.** `is_deleted === true` 인 행은 회색 처리 + 취소선 + `삭제됨` 배지 정도.
   살아 있는 행과 섞여 보이면 판단이 오염된다.
3. **토글이 켜져 있다는 사실을 화면에 계속 표시.** 켠 걸 잊고 숫자를 읽으면 그게 이번 사고와
   같은 종류의 오해를 만든다. 목록 상단에 `삭제분 포함 — N건` 같은 배너 권장.
4. 적용 대상 화면: 최소한 **이행(ExecutionPage)** 과 **종목(SecurityPage)**. 나머지는 여력 되는 대로.

---

## 2. 복구 / 물리 삭제 버튼

### API

| 동작 | 메서드 | 경로 | 비고 |
|---|---|---|---|
| 소프트 삭제 | `DELETE` | `/{resource}/{id}/` | 기존. `api.del` 래퍼 있음 |
| 복구 | `PATCH` | `/{resource}/{id}/restore/` | 기존. `trading.js:21`에 래퍼 있으나 **UI 미연결** |
| **물리 삭제** | `DELETE` | `/{resource}/{id}/purge/` | **신규.** 프론트 래퍼 없음 |

`purge` 규칙 — 반드시 지켜야 UI가 안 깨진다:

- **이미 소프트딜리트된 행만 받는다.** 살아 있는 행에 호출하면 400 +
  `"살아 있는 행은 물리 삭제할 수 없다. 먼저 DELETE 로 삭제 표시한 뒤 다시 요청하라."`
  → 즉 **purge 버튼은 `is_deleted === true` 인 행에만 노출**해야 한다.
- 다른 데이터가 PROTECT/RESTRICT 로 참조 중이면 400 + `blocked_by: ["...", ...]` 배열이 온다.
  이 배열을 그대로 사용자에게 보여 주면 "무엇 때문에 못 지우는지"가 바로 읽힌다.
- 성공 시 200, `message: "purged"`. **되돌릴 수 없다.**

### 요청사항

1. `src/api/trading.js` 에 래퍼 추가:
   ```js
   purge: (id) => api.del(`/${path}/${id}/purge/`),   // 물리 삭제 — 복구 불가
   ```
2. 삭제분 행(`is_deleted === true`)에만 **`복구`** / **`영구 삭제`** 두 버튼 노출.
3. **`영구 삭제`는 반드시 확인 모달을 거친다.** 되돌릴 수 없다는 문구와 대상 요약
   (예: `현대자동차 BUY 464,000주 @20원`)을 모달에 표시할 것. 그냥 `정말 삭제할까요?`는 부족하다 —
   이번 사고처럼 값이 이상한 행을 지우는 게 주 용도라, **지우려는 값이 눈에 보여야** 한다.
4. 400 응답의 `results.detail` 과 `results.blocked_by` 를 사용자에게 노출할 것.

---

## 3. 이행 입력 경고 (수량 ↔ 가격 뒤바뀜)

백엔드에 검증을 넣었다. **프론트는 이 400을 받아 사람에게 물어보는 UI가 필요하다.**

### 백엔드가 막는 조건

`POST/PUT/PATCH /api/trading/orders/` 에서, 종목의 `current_price` 를 기준으로:

| 상황 | 판정 | 에러 필드 |
|---|---|---|
| 수량이 현재가와 ±30% 안 **그리고** 지정가격이 현재가의 1/10~10배 밖 | **뒤바뀜** | `quantity` |
| 지정가격이 현재가의 1/10~10배 밖 | 가격 자릿수 이상 | `limit_price` |
| 수량 > 1,000,000 | 수량 과대 | `quantity` |
| 현재가를 모르는 종목 + 수량 > 1,000,000 | 수량 과대 | `quantity` |

임계값은 `backend/trading_discipline/constants/validation.py` 한 곳에 있다.
기존 저장된 22건으로 회귀 검증했고 **오탐 0건**, 문제의 `id=23`만 걸린다.

### 우회 플래그 — `confirm_outlier`

에러 메시지는 모두 `"맞다면 confirm_outlier=true 로 다시 보내라."` 로 끝난다.

```js
// 1차 시도
POST /orders/  { security: 3, quantity: 464000, limit_price: 20, ... }
→ 400 { success:false, results: { quantity: ["수량과 지정가격이 뒤바뀐 것 같다. 수량 464,000 은 …"] } }

// 사용자가 모달에서 "그래도 저장" 을 누르면
POST /orders/  { security: 3, quantity: 464000, limit_price: 20, confirm_outlier: true, ... }
→ 201 저장됨
```

- `confirm_outlier` 는 **write-only**다. 응답 본문에 안 실려 오고, DB 컬럼도 아니다.
- 평상시에는 **보내지 말 것.** 항상 `true`로 박아 두면 검증이 통째로 죽는다.

### 요청사항

1. **저장 전 프론트 자체 경고 (1차 방어).** 백엔드 왕복 없이 입력 즉시 알려 주는 쪽이 낫다.
   - `수량 × 지정가격` 을 입력 칸 아래에 **실시간으로 표시.** 이번 사고는 체결금액이
     `464,000 × 20 = 9,280,000` 로 한 번만 보였어도 눈에 띄었다.
   - 수량이 해당 종목 `current_price` 의 ±30% 안에 들어오면 즉시 인라인 경고:
     `수량 자리에 가격을 적지 않았는지 확인하세요.`
   - 종목 `current_price` 는 종목 목록/상세 응답에 이미 들어 있다.
2. **400 응답 처리 (2차 방어).** `results.{quantity|limit_price}` 메시지를 해당 필드 밑에 붙이고,
   메시지에 `confirm_outlier` 가 포함돼 있으면 **[수정하기] / [값이 맞습니다 · 그대로 저장]**
   두 선택지를 주는 모달을 띄운다. 후자를 고르면 `confirm_outlier: true` 를 실어 재전송.
3. `[값이 맞습니다]` 를 **기본 버튼으로 두지 말 것.** 기본 동작은 `[수정하기]` 여야 한다.

---

## 4. 참고 — 손대지 않은 것

- `orders.id=23` 데이터. 사용자가 직접 처리한다.
- `securities.id=3` 의 `holding_quantity=26` (기초 보유수량). 의도된 값인지 미확인.
- 백엔드 `soft_delete_mode` / `restore` 는 원래 있던 기능이다. 이번에 만든 건 `purge` 와 이행 검증뿐이다.

## 5. 백엔드 변경 파일

| 파일 | 내용 |
|---|---|
| `backend/core/views/common.py` | `purge` 액션 추가 (22개 뷰셋 전체에 자동 적용) |
| `backend/trading_discipline/constants/validation.py` | **신규** — 이상값 임계값 |
| `backend/trading_discipline/serializers/execution/order.py` | 뒤바뀜/이상값 검증 + `confirm_outlier` |
