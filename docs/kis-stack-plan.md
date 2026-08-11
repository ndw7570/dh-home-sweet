# KIS 시세·주문 스택 계획 (워크스트림 B)

이 문서는 **아직 코드가 없는** KIS 실시간 시세 수집 + 주문 발행 스택의 확정된 결정과
Phase 별 착수 순서를 담는다. 다음 세션에서 "KIS 스택 이어가자" 라고 하면 여기부터
읽고 진행하면 된다.

배경: 현 `dh-home-sweet` 은 계획·규율·이행 대조 앱이고 KIS 연동이 없다. 이 스택을
**같은 리포에 새 앱으로** 붙여서 규율 앱과 DB 를 공유한다 — "계획 ↔ 실체결" 조인이
규율 앱의 핵심이라 분리하면 손해다.

## 확정된 결정

| 항목 | 결정 | 근거 |
|---|---|---|
| DB | **PostgreSQL + TimescaleDB** (처음부터) | 초기 데이터 없음, 그린필드라 초기부터 hypertable 로 시작 |
| 메시지 큐 | **Redis Streams** (처음부터) | 소비자 다중화(저장/알림/전략)가 예정돼 있음 |
| 프론트 실시간 | **Django Channels** (처음부터) | 호가·체결 스트리밍 UI 가 목표 |
| 봉 집계 위치 | **별도 aggregator** (Celery Beat 매분 + TimescaleDB continuous aggregate) | collector 는 tick append-only, 봉은 결정론적 재계산 가능하게 |
| 스케줄러 | **Celery + Celery Beat** | Airflow 오버킬 |
| Airflow | **도입 안 함** | Beat 로 감당됨. DAG 재실행 UI 가 필요한 시점에 재검토 |
| 리포 배치 | `dh-home-sweet` **같은 리포** | 계획-실체결 조인 필요 |
| 앱 위치 | `backend/market_data/`, `backend/market_trading/` (기존 `trading_discipline/`, `users/` 옆) | `apps/` 로 안 묶는다 — 기존 구조 그대로 |
| KIS 실제 연동 | **인터페이스·mock 만** 이번 사이클에 | 실제 키·계정은 안전장치 확립 후 |
| 시각 표준 | DB 저장은 **UTC**, 표시할 때만 **KST** 변환 | `TIME_ZONE=Asia/Seoul`, `USE_TZ=True` |

## 아키텍처

```
KIS WebSocket
      │
      ▼
[collector 프로세스]  ── XADD ──▶  Redis Streams (ticks)
   (별도 프로세스,                            │
    manage.py run_kis_collector)              ├──▶ [aggregator worker] ──▶ Postgres/TimescaleDB
                                              │        (매분 + backfill)         (ticks, candles)
                                              ├──▶ [strategy worker]  ──▶ 주문 큐
                                              └──▶ [channels consumer] ──▶ 프론트 WebSocket

[web (Django+DRF)] ──▶ Postgres/TimescaleDB
[celery worker] ──▶ 배치 태스크 (보수·수리·집계)
[celery beat]   ──▶ 스케줄링
```

## 앱 · 프로세스 분할

**새 앱 (backend/ 아래)**

- `market_data/` — 종목, tick, candle, KIS 클라이언트, 봉 집계, rate limiter
- `market_trading/` — 주문 발행, 리스크 매니저, kill switch, 감사 로그, idempotency

**docker-compose 서비스**

| 서비스 | 명령 | 역할 |
|---|---|---|
| `db` | postgres+timescale 이미지 | 기존 `db` 교체 |
| `redis` | redis:alpine | broker + cache + streams |
| `web` | 기존 그대로 | Django/Gunicorn (ASGI 로 승격) |
| `worker` | `celery -A core worker` | 배치·집계 |
| `beat` | `celery -A core beat` | 스케줄 |
| `collector` | `python manage.py run_kis_collector` | KIS WebSocket (**필수 격리**) |

**절대 금지**: Django web 프로세스 안에서 KIS WebSocket 을 직접 돌리지 않는다.
재시작·오토스케일 시 중복 구독이 나서 데이터가 이중 저장되거나 KIS 세션이 끊긴다.

## Phase 별 착수 순서

각 phase 는 별도 커밋(가능하면 별도 PR)이 원칙. 위에서부터 순서대로 한다.

### Phase 1 — 인프라 스켈레톤 ✅ 완료

착수 결과:
- `docker-compose.yml`: `db` 를 `timescale/timescaledb:2.16.1-pg16` 로 교체, `redis` 추가, `worker`·`beat` 서비스 추가, `collector` 는 `profiles: [collector]` 로 잠금 (phase 3 에 열림)
- `backend/requirements.txt`: `celery`, `redis`, `channels`, `channels-redis`, `daphne`, `django-celery-beat`, `websockets` 추가
- `backend/core/celery.py`: Celery 앱 정의, `autodiscover_tasks()`
- `backend/core/__init__.py`: `celery_app` 임포트
- `backend/core/asgi.py`: `ProtocolTypeRouter` (http + websocket), websocket 라우터는 빈 리스트로 자리만
- `backend/core/settings.py`: `daphne`·`channels`·`django_celery_beat` INSTALLED_APPS, `CELERY_*`, `CHANNEL_LAYERS`, `ASGI_APPLICATION`, `KIS_ENV`
- `backend/market_data/`, `backend/market_trading/` 앱 뼈대 (AppConfig · 빈 models/tasks/migrations)
- `backend/market_data/management/commands/run_kis_collector.py`: placeholder (5초 heartbeat 로그만)

검증:
- `python manage.py check` → 0 issues (필요 패키지 로컬 설치 후)
- `core.celery.app` 로드됨, `core.asgi.application` = `ProtocolTypeRouter`
- `manage.py help run_kis_collector` 로 발견됨

**사용자 확인 필요**:
- `docker compose build backend worker beat && docker compose up db redis backend worker beat` 로 5개 서비스가 뜨는지
- `docker compose --profile collector up collector` 로 placeholder collector 도 뜨는지 (heartbeat 로그 확인)
- 기존 pgdata 볼륨을 지우고(`docker volume rm dh-home-sweet_pgdata`) 재기동해야 timescaledb 이미지의 초기화가 실행됨. TimescaleDB extension 자체는 phase 2 hypertable 마이그레이션에서 `CREATE EXTENSION IF NOT EXISTS timescaledb` 로 활성화한다.

### Phase 2 — 데이터 모델
- `market_data/models.py`: `Symbol`, `Tick`, `Candle`
- 마이그레이션: `Candle` 을 `create_hypertable(...)` 로 hypertable 로 승격 (raw SQL RunPython)
- 5분·15분·1시간 continuous aggregate 생성 (raw SQL)
- 인덱스: (symbol_id, timestamp DESC) BRIN or B-tree
- 산출: `python manage.py migrate` 로 hypertable + continuous aggregate 가 만들어짐

### Phase 3 — Collector 스켈레톤 (KIS mock)
- `market_data/services/kis_client.py`: 인터페이스만 (WebSocket 재접속·heartbeat·구독 관리). 실제 KIS API 는 mock provider 로 대체
- `market_data/services/rate_limiter.py`: Redis 기반 토큰 버킷
- `market_data/management/commands/run_kis_collector.py`: 무한 루프, tick 을 Redis Streams `ticks:<symbol>` 으로 XADD
- 산출: mock provider 로 초당 N tick 을 Streams 에 넣는 collector 프로세스가 뜬다

### Phase 4 — Aggregator
- `market_data/services/candle_builder.py`: Streams consumer group. 매 tick 을 `Tick` 테이블에 bulk_insert
- `market_data/tasks.py`:
  - `aggregate_minute_bars` (Beat 매분 :05초): 지난 1분 tick 을 1분봉으로 upsert
  - `repair_minute_bars` (Beat 장마감 후): REST 대조 + 누락 재수집 (아직 REST 없으니 skeleton)
  - `refresh_symbols` (Beat 장시작 전): 종목·구독 목록 갱신
- 산출: mock tick 이 흘러가면 1분봉이 자동으로 쌓임

### Phase 5 — 실시간 프론트 (Channels)
- `market_data/consumers.py`: 종목 구독 WebSocket. Streams 를 그대로 group 으로 fan-out
- `core/asgi.py` 라우팅 연결
- 프론트: 종목 화면에서 `wss://.../market/ticks/<symbol>/` 구독 → 현재가/호가 표시
- 산출: 프론트에서 mock tick 이 실시간으로 흐른다

### Phase 6 — 주문 발행 · 안전장치
- `market_trading/models.py`: `Order` (idempotency_key UNIQUE, 상태: planned/submitted/filled/cancelled/rejected)
- `market_trading/services/order_service.py`: 잔고 재확인 → risk_manager 통과 → idempotent submit
- `market_trading/services/risk_manager.py`:
  - 종목별·일별 최대 주문 금액
  - 중복 주문 방지
  - Kill switch (Redis flag `trading:killed`)
- 감사 로그: 모든 신호·주문 요청·응답을 별도 append-only 테이블
- 모의·실전 키 분리: `KIS_ENV=paper|live` 로 settings 분기
- 산출: mock 주문이 안전장치를 통과해 로그에 남는다

### Phase 7 — 관측 (배포 시점)
- Sentry (`SENTRY_DSN`)
- Prometheus/Grafana (또는 Django admin 대시보드로 우선)
- Nginx / Caddy 리버스 프록시
- 이 phase 는 실배포가 결정되고 나서 착수

## 미정 사항 (결정 시점에 이 문서에 기록)

- **KIS 실제 계정·키 연동 시점**: Phase 6 완료 후 mock → 실계정 전환. 정확한 시점 미정
- **`market_trading` vs `trading_discipline/services/execution_service.py` 역할 경계**:
  - `execution_service` = 계획 vs 실체결 사후 대조 (이미 존재)
  - `market_trading` = 실체결 발행 (신규)
  - 두 앱이 공유하는 것은 `Order` 모델. `trading_discipline.models.Order` 를 `market_trading` 으로 옮길지, 둘로 나눌지 미결정
- **관심 종목 규모**: 20~50개면 Streams·Timescale 오버킬일 수도 있음. 확정 시 조정
- **호가창 UI 스펙**: Channels 로 전달할 데이터의 최소·최대 필드 (10호가? 5호가? 체결가만?) 미결정

## 다음 세션 진입 시

1. 이 문서를 먼저 읽는다 (`docs/kis-stack-plan.md`).
2. `git log --oneline -20` 로 Phase 어디까지 진행됐는지 확인.
3. 이 문서의 각 phase 헤더에 붙은 ✅ 로 완료 상태를 파악.
4. 아래 "검증 대기" 항목을 사용자와 먼저 확인 (아직 안 됐으면 그것부터).
5. 미정 사항 중 해당 phase 를 막는 것이 있으면 먼저 사용자에게 확정 요청.
6. 다음 phase 착수.

## 검증 대기 (이전 세션에서 넘어옴)

### 워크스트림 A (v0.0.2 스키마) — 코드 반영 완료, 사용자 실행 대기
migration `0002_rename_securitypricedata_dailysecuritypricedata_and_more.py` 가 준비됨.
사용자가 postgres 붙은 환경에서 다음을 실행하면 검증 완료:
```bash
cd backend
python manage.py migrate           # 0002 적용 (Rename + AddField monthly_plan + AlterField security NOT NULL + AlterModelTable)
python manage.py seed_demo --reset # 새 스키마로 재시드 (모든 weekly 가 monthly_plan 을 갖게 됨)
python manage.py dump_mock         # frontend/src/data/mock.js 재생성 (orphan 필드 제거됨)
```
실패 시 원인: 기존 weekly 행 중 security_id 가 NULL 이거나 monthly_plan 배정을 못 하는 경우.
seed 는 항상 security 를 세팅했으므로 --reset 후에는 안전.

### 워크스트림 B Phase 1 — 코드 반영 완료, docker 검증 대기
```bash
docker volume rm dh-home-sweet_pgdata   # timescaledb 이미지 초기화 위해 기존 볼륨 제거 (기존 데이터 잃음)
docker compose build backend worker beat
docker compose up db redis backend worker beat
# 5개 서비스가 뜨는지 확인. backend 는 daphne 로 8000 서브. worker/beat 는 celery.
# 다른 터미널
docker compose --profile collector up collector   # placeholder heartbeat 로그 확인
```
문제 시나리오:
- `timescale/timescaledb:2.16.1-pg16` 이미지 pull 실패 → 태그를 최신으로 교체
- Channels/celery 임포트 오류 → requirements 재빌드
- Redis 헬스체크 실패 → 이미지·포트 재확인

**현재 상태: Phase 1 완료. 위 두 검증 후 Phase 2(hypertable + continuous aggregate) 착수.**

## 관련 결정 문서

- `docs/schema-mapping.md` — 규율 앱의 DDL ↔ 모델 대조 (KIS 스택은 새 앱이므로 별도)
- `docs/scaffold-notes.md` — 규율 앱의 설계 노트
