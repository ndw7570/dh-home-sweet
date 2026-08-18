# 프론트 작업 요청 — 필수원칙 적용기간 · 이행 체크리스트

작성: 2026-08-18 / 백엔드 세션 → 프론트 세션 인계
백엔드는 **구현 완료**. 아래는 프론트에서 만들 것만 적는다.

---

## 0. 무엇을 하는 기능인가

필수원칙마다 **어느 계층에서 꺼내 볼지**를 고를 수 있다. 고른 기간이 곧 쓰임새를 정한다.

```
원칙 3번에 "일" + "월" 체크
   │
   ├─ 일(DAY)   → 이행 화면에 체크리스트로 뜨고, Y/N 입력이 필수
   └─ 월(MONTH) → 월계획 작성 화면에 문장으로 표시 (읽기만)
```

계획 계층(주/월/분기/연)은 **표시만** 한다. 아직 하지 않은 일에 "했다/안 했다"를 물을 수
없기 때문이다. 지켰는지 답할 수 있는 자리는 실제로 행동한 기록, 즉 이행뿐이다.

**기간을 하나도 안 고르면 어느 화면에도 안 나온다.** 지금 등록된 원칙들이 전부 그 상태라,
설정하기 전까지 기존 화면은 그대로다.

---

## 1. 필수원칙 화면 — 적용기간 체크박스

`GET/POST/PATCH /api/trading/mandatory-principle/` 응답·요청에 `period_types`가 추가됐다.

```json
{
  "id": 3, "priority": 3, "content": "10초 이후에 거래를 시작한다 ...",
  "period_types": ["DAY", "MONTH"]
}
```

### 요청사항

원칙 등록·수정 폼에 **체크박스 5개**를 추가한다.

```
적용기간   □ 일   □ 주   □ 월   □ 분기   □ 연
           DAY   WEEK  MONTH  QUARTER  YEAR
```

- 저장은 원칙 본문과 **한 번의 요청**으로 나간다. `period_types: ["DAY","MONTH"]`를 body에 실으면 된다
- 키를 아예 안 보내면 기존 설정이 유지된다. `[]`(빈 배열)을 보내면 전부 해제된다
- **"일"에는 설명을 붙여 달라.** 다른 기간과 동작이 다르다:
  ```
  ☑ 일   — 이행을 기록할 때마다 이 원칙을 지켰는지 묻습니다
  ☐ 월   — 월계획 작성 화면에 표시됩니다
  ```
- 목록에서도 배지로 보여 주면 좋다: `일 · 월`

---

## 2. 계획 작성 화면 — 원칙 표시

계획 작성 화면을 열 때 그 계층의 원칙을 불러 보여 준다.

```js
GET /api/trading/mandatory-principle/?period_type=MONTH&no_page=1   // 월계획 화면
GET /api/trading/mandatory-principle/?period_type=WEEK&no_page=1    // 주계획 화면
GET /api/trading/mandatory-principle/?period_type=QUARTER&...       // 분기
GET /api/trading/mandatory-principle/?period_type=YEAR&...          // 연
```

- 0건이면 아무것도 안 띄운다. 빈 박스도 만들지 말 것
- **읽기 전용**이다. 체크박스도 입력도 없다. `priority` 순으로 정렬돼 온다
- 계획 폼 상단이나 사이드에 접이식으로 두는 편이 낫다. 매번 크게 차지하면 곧 안 읽게 된다

---

## 3. 이행 화면 — 체크리스트 (핵심)

### 3-1. 무엇을 체크해야 하는지 먼저 조회

```js
GET /api/trading/mandatory-principle/?period_type=DAY&no_page=1
```

이 목록이 이행 폼에 뜰 체크리스트다. **0건이면 체크리스트 영역을 통째로 숨긴다.**

### 3-2. 이행 저장 시 함께 전송

```js
POST /api/trading/order/
{
  "security": 3, "action_type": "FILL", "side": "BUY",
  "quantity": 10, "limit_price": 438000, "executed_at": "...",

  "principle_checks": [
    { "principle": 1, "is_done": true,  "note": "근거 확인함" },
    { "principle": 3, "is_done": false, "note": "" }
  ]
}
```

### 3-3. 빠뜨리면 400이다

**DAY 원칙 전부에 답해야 저장된다.** 하나라도 빠지면:

```json
{
  "success": false,
  "results": {
    "principle_checks": [
      "점검하지 않은 필수원칙이 있다: [3] 10초 이후에 거래를 시작한다. 지켰는지 아닌지를 반드시 답해야 한다 (아니라고 답해도 저장된다)."
    ]
  }
}
```

그러니 프론트에서 **저장 버튼을 누르기 전에 미응답을 막아 달라.** 각 원칙에 라디오
`지킴 / 못 지킴` 두 개를 두고, 하나도 안 고른 항목이 있으면 저장을 막는 식이 좋다.

### 3-4. `못 지킴`을 고르기 어렵게 만들지 말 것

이게 중요하다. **`is_done: false`도 정상적으로 저장된다.** "안 지켰다"는 실패 신고가 아니라
이 앱이 가장 알고 싶어 하는 기록이다 — 어떤 원칙을 언제 어겼고 그 매매가 어떻게 됐는지가
규율의 성과 자체다.

그래서:
- `못 지킴`을 선택할 때 경고 모달을 띄우지 말 것
- 빨간 경고색으로 겁주지 말 것 (중립적인 회색이면 충분하다)
- 기본 선택값을 `지킴`으로 두지 말 것 — 사람이 그냥 넘기게 된다. **둘 다 미선택이 기본**이다

### 3-5. 수정할 때는 강제되지 않는다

`PATCH`에는 체크가 필수가 아니다. 이 규칙이 생기기 전에 쌓인 이행이 22건 있고, 그것들을
고칠 때마다 원칙 체크를 요구하면 과거 기록에 손을 댈 수 없게 된다.

수정 화면에서는 기존 체크를 보여 주고 고칠 수 있게만 하면 된다. 보낸 항목만 갱신된다.

### 3-6. 이행 조회 응답

목록·상세 모두 `principle_checks`가 함께 온다.

```json
"principle_checks": [
  {
    "id": 1, "principle": 3, "is_done": false, "note": "",
    "principle_detail": { "id": 3, "priority": 3, "content": "10초 이후에 ..." }
  }
]
```

이행 목록에서 원칙을 어긴 건에 표시를 남기면(예: 작은 `!` 배지) 회고할 때 눈에 띈다.

---

## 4. 주의할 것

**대상이 아닌 원칙을 보내면 400이다.** DAY로 지정되지 않은 원칙 id를 `principle_checks`에
넣으면 거부된다. 반드시 `?period_type=DAY` 조회 결과만 보낼 것.

**같은 원칙을 두 번 보내면 400이다.** 원칙당 한 줄이다.

**원칙의 적용기간을 바꾸면 이행 화면이 즉시 바뀐다.** 사용자가 원칙 3번의 "일"을 끄면
그다음 이행부터는 체크 항목에서 빠진다. 이미 저장된 점검 기록은 남는다.

## 5. 백엔드 변경 파일

| 파일 | 내용 |
|---|---|
| `backend/trading_discipline/models/principle/mandatory_principle_scope.py` | **신규** — 원칙 × 기간 |
| `backend/trading_discipline/models/execution/order_principle_check.py` | **신규** — 이행 × 원칙 점검 |
| `backend/trading_discipline/serializers/principle/mandatory_principle.py` | `period_types` 읽기·쓰기 |
| `backend/trading_discipline/serializers/execution/order.py` | `principle_checks` 중첩 + 누락 검증 |
| `backend/core/views/common.py` | 수정 응답의 prefetch 캐시 무효화 (DRF 표준 처리 복원) |
| `backend/core/constants/filters.py` | `period_type` 필터 |
| `investments-nam.sql` | 테이블 2개 DDL 추가 |
