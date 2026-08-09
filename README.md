# 자산 플래너 (scaffold)

계획 → 기록 → 관측 → 회고 루프를 도는 개인 자산·주식 관리 프로그램.
일반 자산앱의 "현재 상태 조회"가 아니라, **한 시간축 위에 실적과 예상을 겹쳐 놓고
지난 예상이 얼마나 맞았는지까지 남기는** 것이 이 프로그램의 정체성이다.

## 구조

```
backend/          Django 5 + DRF   (namssi-jikjehak 의 core 정책 승계)
  core/             ← 대부분 그대로 복사, filters.py / urls.py 만 교체
  users/            UserProfile (AUTH_USER_MODEL)
  asset_planning/   도메인 앱
    models/         portfolio · planning · journal
    serializers/    동일 3분할
    views/          동일 3분할 + dashboard.py (화면 전용 조회)
    services/       타임라인 조립 · 예상 계산 · 회고 · 홈 요약
frontend/         React 18 + Vite  (탭 라우팅, 컴포넌트별 css 페어)
  src/components/   TimelineChart(시그니처) · SummaryCard · MetricCard · JournalRow
  src/pages/        Home(토스형) · Plan · Journal · Review · Asset(대시보드형)
  src/data/mock.js  백엔드 없이 화면 확인용
docs/             scaffold-notes.md ← 설계 결정 · API 계약 · DDL 채울 자리
```

## 밀도 정책

| 화면 | 형태 | 이유 |
|---|---|---|
| 홈 | 토스형 단일 컬럼 카드 | 일지·회고를 붙잡는 것이 이 프로그램의 성패라, 홈은 시스템이 해석해서 행동 하나를 밀어준다 |
| 계획 · 자산 · 회고 · 일지 | 대시보드형 | 시나리오 조작, 태그 필터, 계획 대비 비교는 밀도가 있어야 한다 |

## 실행

```bash
# 프론트만 먼저 (백엔드 없이 화면 확인)
cd frontend && npm install && npm run dev      # http://localhost:5353

# 백엔드
cd backend
psql -c "CREATE SCHEMA IF NOT EXISTS planner;"
pip install -r requirements.txt
python manage.py runserver 0.0.0.0:8000
```

`backend/requirements.txt` 와 `core/` 의 나머지 파일은 namssi-jikjehak 에서 그대로
복사해 온다. 교체 대상은 `backend/README.md` 표에 정리해 두었다.

## 지금 상태

DDL 확정 전이라 **껍데기**다. 모델은 화면이 요구하는 최소 컬럼만 잡혀 있고,
서비스 계층은 반환 계약(응답 모양)만 확정한 채 안쪽은 TODO 로 비워 두었다.
채울 자리 목록은 `docs/scaffold-notes.md` 5절에 있다.
