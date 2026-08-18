"""시세 수집 Celery 태스크.

전부 `services/collector.py` 를 부르는 얇은 껍데기다. 로직을 여기에 넣지 않는 이유는
Celery 없이도 같은 일을 할 수 있어야 하기 때문이다 — 브로커가 안 떠 있어도
`python manage.py kis_fetch_price` 로 똑같은 경로를 탄다.

스케줄은 `core/settings.py` 의 `CELERY_BEAT_SCHEDULE` 에 있다.

## 재시도 정책

KIS 오류는 두 종류다. **다시 부르면 되는 것**(통신 실패, 유량 초과, 토큰 만료) 은
`KisClient` 안에서 이미 재시도하고, 거기서도 안 되면 여기서 태스크 단위로 한 번 더 쉰다.
**다시 불러도 같은 것**(없는 종목코드, 잘못된 파라미터) 은 재시도가 무의미하므로
`CollectResult.errors` 에 담겨 조용히 리턴된다 — 종목 하나가 잘못됐다고 나머지 종목의
수집까지 멈추면 안 된다.
"""

import logging

from celery import shared_task

from market_data.services.collector import (
    backfill_daily_candles,
    collect_minute_candles,
    collection_targets,
    update_current_prices,
)
from market_data.services.kis_client import KisClient, KisConfigError, KisError
from market_data.services.pricing import sync_security_prices

logger = logging.getLogger(__name__)

# 재시도 대상 예외. 설정 오류(KisConfigError)는 재시도해도 소용없으니 제외한다.
RETRY_FOR = (KisError,)
RETRY_KWARGS = {"max_retries": 3, "countdown": 30}


def _client() -> KisClient | None:
    """클라이언트 생성. 키가 없으면 경고만 남기고 None — 태스크를 실패로 만들지 않는다.

    키를 아직 안 넣은 개발 환경에서 Beat 가 돌면 매 주기마다 실패 태스크가 쌓인다.
    그건 알람 노이즈일 뿐 고쳐야 할 장애가 아니다.
    """
    try:
        return KisClient()
    except KisConfigError as exc:
        logger.warning("KIS 설정 미완료로 수집을 건너뛴다: %s", exc)
        return None


@shared_task(bind=True, autoretry_for=RETRY_FOR, retry_kwargs=RETRY_KWARGS)
def refresh_current_prices(self) -> dict:
    """수집 대상 전체의 현재가를 갱신한다. 장중 주기 실행용.

    `securities.current_price` 까지 함께 갱신된다(`update_current_prices` 안에서).
    """
    client = _client()
    if client is None:
        return {"skipped": "no_credentials"}

    with client:
        symbols = collection_targets()
        if not symbols:
            return {"skipped": "no_symbols"}
        result = update_current_prices(client, symbols)

    return {"updated": result.updated, "skipped": result.skipped, "errors": result.errors}


@shared_task(bind=True, autoretry_for=RETRY_FOR, retry_kwargs=RETRY_KWARGS)
def collect_today_minutes(self) -> dict:
    """당일 분봉을 수집한다. 장중 주기 실행용.

    같은 봉을 여러 번 받는 것은 정상이다 — upsert 라 행이 늘지 않는다. 주기를 촘촘히
    잡을수록 장중 결측 구간이 줄어드는 대신 호출 수가 는다.
    """
    client = _client()
    if client is None:
        return {"skipped": "no_credentials"}

    created = updated = 0
    errors: list[str] = []
    with client:
        for sym in collection_targets():
            result = collect_minute_candles(client, sym)
            created += result.created
            updated += result.updated
            errors.extend(result.errors)

    return {"created": created, "updated": updated, "errors": errors}


@shared_task(bind=True, autoretry_for=RETRY_FOR, retry_kwargs=RETRY_KWARGS)
def collect_daily_candles(self, days: int = 5) -> dict:
    """일봉을 수집한다. 장 마감 후 실행용.

    기본 5일인 이유: 오늘 것만 받으면 그날 수집이 실패했을 때 구멍이 영구히 남는다.
    며칠치를 겹쳐 받아 두면 다음 성공한 실행이 이전의 구멍을 저절로 메운다.
    """
    from datetime import timedelta

    from django.utils import timezone

    client = _client()
    if client is None:
        return {"skipped": "no_credentials"}

    end = timezone.localdate()
    start = end - timedelta(days=max(days, 1) - 1)
    created = updated = 0
    errors: list[str] = []

    with client:
        for sym in collection_targets():
            result = backfill_daily_candles(client, sym, start, end)
            created += result.created
            updated += result.updated
            errors.extend(result.errors)

    # 장 마감 후에는 그날 일봉(15:30 종가) 이 가장 최근 관측이 된다. 현재주가를 여기서
    # 한 번 더 맞춰야 마감 후 화면이 종가를 보여 준다.
    synced = sync_security_prices()
    return {"created": created, "updated": updated, "synced": synced, "errors": errors}


# 종목 동기화 태스크는 없다. 수집 대상을 매 실행마다 `securities` 에서 다시 계산하므로
# 미리 맞춰 둘 것이 없다 — 화면에서 켜고 끈 결과가 다음 수집 주기에 바로 반영된다.
