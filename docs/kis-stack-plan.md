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
| ~~KIS 실제 연동~~ | ~~인터페이스·mock 만~~ → **2026-08-18 변경: mock 생략, 실 API 직결** | mock 을 거치면 검증되는 것이 mock 뿐이다. 모의투자(paper) 키로 실제 KIS 를 부르는 것이 위험도 낮고 얻는 것이 많다 |
| **시세 DB** | **본체 외부 Postgres (규율 앱과 같은 DB)** | 2026-08-18 결정. `securities.current_price` 자동 갱신과 계획↔체결 대조가 조인 한 번으로 끝난다. 분봉까지는 일반 Postgres 로 충분(연 500만 행 미만). tick 을 대량으로 쌓는 시점에 tick 테이블만 TimescaleDB 로 분리 |
| **수집 우선순위** | **REST 먼저, WebSocket 나중** | 2026-08-18 결정. REST 는 장 마감 후·휴장일에도 검증되고 과거 데이터 backfill 이 된다. 모의투자는 실시간 시세 제공 범위도 제한적 |
| **수집 대상 기준** | **화면 하나로 단일화** — `securities` 중 `is_active=True` 이고 삭제되지 않은 종목 | 2026-08-18 결정. 처음엔 `Symbol.is_subscribed` 라는 별도 스위치를 뒀는데, 화면에서 '관리대상' 을 꺼도 수집이 계속 도는 상태가 실제로 생겼다. 스위치가 둘이면 어긋나고, 어긋나면 어느 쪽이 참인지 알 수 없다. 컬럼을 제거하고 수집할 때마다 `securities` 를 다시 본다 |
| **거래소 구분** | **`UN`(KRX + NXT 통합)** 으로 조회. `KIS_MARKET_DIV` 로 바꿀 수 있음 | 2026-08-18 결정. 넥스트레이드가 열린 뒤로 거래가 두 거래소에 갈렸다. 실측 결과 삼성전자 하루 거래량이 KRX 2,400만주 / NXT 1,742만주였다 — `J`(KRX) 만 보면 **40% 를 못 본다.** 최종 체결가도 다르다(268,500 vs 269,000) |
| **수집 시간대** | **평일 08:00~20:00** (Beat `hour="8-19"`), 분봉 하한 08:00 | 2026-08-18 결정. NXT 프리마켓 08:00~08:50, 애프터마켓 15:30~20:00 에도 체결이 난다. 09~15시로 잡아 두면 장 마감 후 화면이 15:30 에 멈춘 것처럼 보인다(실제로 그 상태였다). 일봉 수집도 16:10 → 20:30 으로 미뤘다 — 애프터마켓이 끝나야 그날 값이 확정된다 |
| **현재주가** | `securities.current_price` 를 **수집기가 직접 갱신**한다. 스위치 없음 | 2026-08-18 결정. 컬럼 이름이 이미 '현재주가' 다 — 사람이 손으로 넣던 것은 시세 연동이 없어서였지 그 값이 사람의 판단이라서가 아니다. 처음엔 수기값을 보존하려고 `live` 라는 별도 객체로 시세를 실어 보냈는데, 계속 변하는 값이라 어제 적어 둔 주가는 오늘 아무 의미가 없었다. 켜고 끌 수 있게 하면 화면에 뜬 주가가 실제인지 수기인지 알 수 없어지므로 스위치도 두지 않는다. 응답에는 `price_at`·`price_source` 만 덧붙여 그 숫자를 읽는 맥락을 준다 |
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

### Phase 2 — 데이터 모델 ✅ 완료 (2026-08-18)

계획을 바꿨다. hypertable·continuous aggregate 는 **넣지 않았다** — 시세 DB 를 본체
Postgres 로 결정했고 그 서버에는 timescaledb 바이너리가 없다(`pg_available_extensions`
에 아예 없음). 분봉까지는 일반 테이블로 충분하다.

- `market_data/models.py`: `Symbol`, `DailyCandle`, `MinuteCandle`, `KisToken`
  - `Tick` 은 아직 만들지 않았다. WebSocket 단계에서 추가한다.
  - `Symbol` 은 `trading_discipline.Security` 와 **다른 것**이다. Security 는 계좌가 보유한
    종목(account FK 있음), Symbol 은 시세를 수집할 종목(계좌 무관). 종목코드 문자열로 잇는다.
  - 소프트딜리트는 `Symbol` 만 따른다. 봉 테이블은 기계가 쌓는 사실 기록이라 제외.
- 인덱스: `(symbol, -date)` / `(symbol, -ts)` — 나중에 파티셔닝할 때 그대로 기준축이 된다
- 유니크: `(symbol, date)` / `(symbol, ts)` — 재수집이 안전하도록(upsert)
- 산출: `python manage.py migrate market_data` 적용 완료 (외부 Postgres 에 테이블 4개 생성됨)

### Phase 3 — KIS REST 클라이언트 ✅ 완료 (2026-08-18)

mock provider 를 건너뛰고 실 API 를 직접 붙였다.

- `market_data/services/kis_client.py`
  - 접근토큰 발급·DB 캐시·만료 전 재발급. **DB 에 캐시하는 이유**: KIS 는 토큰 발급을
    1분 1회로 제한한다(EGW00133). 프로세스마다 각자 발급하면 서로를 막는다.
    `select_for_update` 로 잠그고 재확인해서 동시 발급도 막는다.
  - `rt_cd` 판정. **KIS 는 실패해도 HTTP 200 을 준다** — 이걸 안 보면 빈 응답을 정상으로
    착각하고 "수집은 도는데 데이터가 안 쌓이는" 상태가 된다.
  - 재시도: 토큰 만료(EGW00121/00123)·유량 초과(EGW00201)·통신 실패만. 없는 종목코드처럼
    다시 불러도 같은 답이 오는 오류는 즉시 예외.
  - 조회 3종: `inquire_price`(FHKST01010100) / `inquire_daily_candles`(FHKST03010100) /
    `inquire_today_minutes`(FHKST03010200)
- `market_data/services/rate_limiter.py`: 토큰 버킷. **Redis 가 아니라 프로세스 내부**다 —
  Redis 가 죽으면 수집도 같이 죽는 구조를 피했다. 수집 프로세스를 여럿으로 늘릴 때
  `acquire()` 구현만 갈아 끼우면 된다.
- 산출: `python manage.py kis_check` 로 설정 → 토큰 → 시세 조회를 단계별로 진단

### Phase 4 — 수집 서비스 · 커맨드 · 스케줄 ✅ 완료 (2026-08-18)

- `market_data/services/collector.py`: KIS 응답 파싱 → 모델 upsert
  - 전부 upsert 다. 같은 구간을 두 번 수집해도 행이 늘지 않고 값만 최신으로 수렴한다.
  - 일봉은 100일씩 끊어 **최신 → 과거** 방향으로 받는다(중간에 실패해도 최근 것이 남는다).
  - 분봉은 한 번에 30건이라 시각을 거슬러 페이지를 넘긴다. 상한 20페이지.
- 커맨드 (Celery·Redis 없이 단독 실행된다 — 이게 설계 의도다):
  | 커맨드 | 하는 일 |
  |---|---|
  | `kis_check` | 설정→토큰→시세 단계별 진단. **키 넣고 제일 먼저 돌릴 것** |
  | `kis_symbols` | 지금 수집 대상이 무엇인지 확인 (`--all` 로 빠진 종목까지) |
  | `kis_fetch_price` | 현재가 갱신. `--update-securities` 로 규율 앱 `current_price` 까지 |
  | `kis_backfill_daily` | 일봉 수집. `--days 365` / `--from --to` |
  | `kis_fetch_minutes` | 당일 분봉 수집 (당일치만 — KIS API 제약) |

  종목을 **추가하거나 끄는 커맨드는 없다.** 화면에서 종목을 등록하고 '관리대상' 을
  켜고 끄는 것이 유일한 방법이다(위 '수집 대상 기준' 결정 참조).
- `market_data/tasks.py` + `CELERY_BEAT_SCHEDULE`(core/settings.py):
  | 스케줄 | 주기 | 태스크 |
  |---|---|---|
  | 현재가 | 평일 **08~20시** 5분마다 | `refresh_current_prices` |
  | 분봉 | 평일 **08~20시** 10분마다 | `collect_today_minutes` |
  | 일봉 확정치 | 평일 **20:30** | `collect_daily_candles` (최근 5일 겹쳐 받아 구멍 메움) |

  시간대가 정규장(09~15시)보다 넓은 이유는 NXT 프리마켓(08:00~08:50)·애프터마켓
  (15:30~20:00) 때문이다. 실제로 08시대 분봉 60건이 이 확대로 새로 들어왔다.
  - 종목 동기화 스케줄은 **없다.** 수집 대상을 매 실행마다 `securities` 에서 다시 계산하므로
    미리 맞춰 둘 것이 없다. 화면에서 켜고 끈 결과가 다음 수집 주기(현재가 5분·분봉 10분)에
    바로 반영된다.
  - 공휴일은 스케줄로 거르지 않는다. 휴장일엔 KIS 가 빈 응답을 주고 0건으로 끝난다.
    공휴일 달력을 코드에 넣으면 매년 관리 대상이 하나 더 는다.
- 산출: 키만 넣으면 `kis_backfill_daily` 한 줄로 실제 시세가 쌓인다

### Phase 5 — 시세 조회 API ✅ 완료 (2026-08-18)

수집한 데이터를 화면이 읽을 수 있게 열었다. `api/trading/` 아래에 함께 붙는다.

| 엔드포인트 | 필터 |
|---|---|
| `GET /api/trading/market-symbol/` | `symbol` `symbol_in` `market` `name` |
| `GET /api/trading/market-daily-candle/` | `symbol` `symbol_id` `date_from` `date_to` |
| `GET /api/trading/market-minute-candle/` | `symbol` `symbol_id` `date`(KST) `ts_from` `ts_to` |

- **전부 읽기 전용(GET)** 이다. 봉은 수집기가 쌓는 사실 기록이라, 손으로 고친 값이 섞이면
  "이 봉이 실제 시세인가" 를 보장할 수 없다. POST/PUT/DELETE 는 405.
- **봉 조회는 종목 지정이 필수다.** 종목 없이 전체 봉을 긁는 질의는 화면에 쓸 일이 없는데
  양은 수백만 행까지 간다. 실수로 한 번 나가면 DB 와 화면이 함께 멈춘다. 400 으로 세운다.
- `market-symbol` 응답의 `is_target` 은 **지금 수집 중인지**를 뜻한다. 컬럼이 아니라
  `securities` 를 서브쿼리로 확인해 붙인 값이다.
- 프론트 붙이는 법: `docs/frontend-request-market-data-api.md`

### Phase 4.5 — WebSocket 실시간 (미착수)
- `Tick` 모델 추가, Redis Streams, `run_kis_collector` 실구현
- `KisClient.approval_key()` 는 이미 만들어 뒀다(`/oauth2/Approval`, 필드명이 `secretkey` 인 것에 주의)
- 모의투자는 실시간 시세 제공 범위가 제한적이라, 실전 키로 넘어갈 때 함께 보는 것이 낫다

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

### 워크스트림 B Phase 2~4 — 코드 반영 완료, **KIS 키 투입 대기**

키가 없어 실 API 호출만 미검증이다. 나머지(모델·마이그레이션·커맨드 등록·종목 동기화)는
실제로 실행해 확인했다.

```bash
# 1. backend/.env 에 값 채우기 (자리는 이미 만들어 뒀다)
#    KIS_APP_KEY=...
#    KIS_APP_SECRET=...
#    apiportal.koreainvestment.com 에서 모의투자용으로 발급

cd backend
python manage.py kis_check                      # 설정→토큰→시세 단계별 진단
python manage.py kis_sync_symbols               # 수집 대상 확인 (이미 3종목 등록됨)
python manage.py kis_backfill_daily --days 100  # 일봉 100일치 — 휴장일에도 된다
python manage.py kis_fetch_price                # 현재가
python manage.py kis_fetch_minutes              # 당일 분봉 (장중에만 데이터 있음)
```

실패 시나리오:
- `kis_check` 2단계에서 막힘 → 앱키가 이 환경(KIS_ENV)의 것이 아니다. 모의 키로 실전
  도메인을 부르면 여기서 막힌다.
- `EGW00201` 반복 → `KIS_RATE_LIMIT_PER_SEC` 를 낮춘다(모의 기본 2).
- `EGW00133` → 토큰 재발급 1분 제한. 기존 토큰이 있으면 자동으로 그것을 쓴다.

### 테스트 실행 제약 (기존 구조에서 넘어온 문제)

`market_data/tests/test_parsing.py` 10건은 DB 없이 돌아가고 **통과 확인했다**.
`test_kis_client.py` 는 `KisToken` 모델을 쓰므로 테스트 DB 가 필요한데, **현재 이 리포는
테스트 DB 를 만들 수 없다**:

- 모든 마이그레이션에 `db_table` 이 `'"investment_discipline"."orders"'` 처럼 스키마가
  하드코딩돼 있다(makemigrations 시점의 `table()` 결과가 그대로 박힌다).
- 그래서 sqlite 로 테스트 DB 를 만들면 `unknown database "investment_discipline"` 로 깨진다.
- Postgres 로 만들려면 테스트 DB 에 스키마를 먼저 생성해야 하는데 그 훅이 없다.

해결 방향(미착수): `connection_created` 시그널에서 sqlite 일 때
`ATTACH DATABASE ':memory:' AS investment_discipline` 를 실행하면 sqlite 테스트가 살아난다.
이건 KIS 스택 밖의 공통 인프라 문제라 별도로 다룬다.

**현재 상태: Phase 2·3·4 완료(코드). KIS 키 투입 후 실 API 검증 → 그다음 WebSocket 단계.**

## 관련 결정 문서

- `docs/schema-mapping.md` — 규율 앱의 DDL ↔ 모델 대조 (KIS 스택은 새 앱이므로 별도)
- `docs/scaffold-notes.md` — 규율 앱의 설계 노트
