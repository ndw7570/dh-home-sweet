"""실효 시세 — "이 종목 지금 얼마인가" 에 답하는 한 곳.

`securities.current_price` 는 컬럼 이름 그대로 **현재주가**다. 사람이 손으로 넣던 것은
시세 연동이 없어서였지, 그 값이 사람의 판단이라서가 아니다. 연동이 생긴 이상 이 컬럼은
수집한 시세로 채운다(`sync_security_prices`). 계속 변하는 값이라 과거 입력값을 남겨 둘
이유도 없다 — 어제 사람이 적어 둔 주가는 오늘 아무 의미가 없다.

수집되지 않는 종목(KIS 가 주지 않는 해외 종목 등) 은 손대지 않는다. 그런 종목은 수기
입력이 유일한 방법이라 덮으면 값을 잃는다.

## 어느 값을 고르나 — "가장 최근에 관측된 것"

장 시간을 코드로 판정하지 않는다. 세 후보의 **관측 시각을 비교해 가장 최근 것**을 고른다.

    현재가 스냅샷(SNAPSHOT)  `market_symbols.last_price`   장중 5분마다 갱신
    분봉(MINUTE)             `market_minute_candles.close` 장중 10분마다 수집
    일봉(DAILY)              `market_daily_candles.close`  장 마감 후 16:10 수집

이렇게 하면 장중/장후 분기가 저절로 맞는다. 장중에는 5분 전 스냅샷이 이기고, 마감
후에는 그날 일봉(15:30 종가)이 이긴다. 주말이면 마지막 거래일 일봉이 남는다.

공휴일 달력도, 장 시간 상수도 필요 없다. 휴장일에는 새 관측이 없으니 마지막 값이
그대로 최신이고, 그게 사실상 맞는 답이다. 시장 시간표를 코드에 넣으면 매년 관리
대상이 하나 더 늘고, 그 표가 틀리는 날 화면이 조용히 거짓말을 한다.

## 앱 의존 방향

규율 앱이 이 모듈 하나만 import 한다. `market_data` 의 모델을 규율 앱 곳곳에서
직접 부르기 시작하면 두 앱이 얽혀서 나중에 시세를 별도 DB 로 떼어낼 수 없게 된다.
창구를 여기 하나로 좁혀 둔다.
"""

from datetime import datetime, time
from decimal import Decimal
from zoneinfo import ZoneInfo

from django.db.models import Max, Min, OuterRef, Subquery
from django.utils import timezone

from market_data.models import DailyCandle, MinuteCandle, Symbol

KST = ZoneInfo("Asia/Seoul")

# 일봉에는 시각이 없다. 그날 정규장 종료 시각의 값으로 본다 — 종가가 확정되는 시점이다.
KRX_CLOSE_TIME = time(15, 30)

SOURCE_SNAPSHOT = "SNAPSHOT"
SOURCE_MINUTE = "MINUTE"
SOURCE_DAILY = "DAILY"

# 시리얼라이저가 읽어 갈 annotation 이름. 뷰셋과 시리얼라이저가 같은 이름을 봐야 하므로
# 문자열을 양쪽에 흩뿌리지 않고 여기서 한 번 정한다.
ANNOTATIONS = (
    "live_snapshot_price",
    "live_snapshot_at",
    "live_minute_price",
    "live_minute_at",
    "live_daily_price",
    "live_daily_date",
)


def annotate_live_price(queryset, symbol_field: str = "symbol", market_field: str = "market"):
    """종목 쿼리셋에 시세 후보 3종을 붙인다.

    서브쿼리로 붙이는 이유는 N+1 때문이다. 목록 한 화면에 종목이 수십 개면 종목마다
    봉 테이블을 뒤지게 되는데, 분봉은 종목당 하루 390행씩 쌓이는 테이블이다.

    `market` 까지 맞춰 조인한다. `market_symbols` 의 유니크 키가 (market, symbol) 이고,
    해외 종목을 담기 시작하면 종목코드만으로는 갈리지 않는다.
    """
    symbol_match = {"symbol": OuterRef(symbol_field), "market": OuterRef(market_field)}

    snapshot = Symbol.objects.filter(**symbol_match)
    minute = MinuteCandle.objects.filter(
        symbol__symbol=OuterRef(symbol_field), symbol__market=OuterRef(market_field)
    ).order_by("-ts")
    daily = DailyCandle.objects.filter(
        symbol__symbol=OuterRef(symbol_field), symbol__market=OuterRef(market_field)
    ).order_by("-date")

    return queryset.annotate(
        live_snapshot_price=Subquery(snapshot.values("last_price")[:1]),
        live_snapshot_at=Subquery(snapshot.values("last_price_at")[:1]),
        live_minute_price=Subquery(minute.values("close")[:1]),
        live_minute_at=Subquery(minute.values("ts")[:1]),
        live_daily_price=Subquery(daily.values("close")[:1]),
        live_daily_date=Subquery(daily.values("date")[:1]),
    )


def resolve_live_price(instance) -> dict:
    """붙어 있는 후보 중 가장 최근 것을 고른다.

    annotation 이 없으면(단건 조회 등에서 `annotate_live_price` 를 안 거친 경우)
    조용히 빈 결과를 돌려준다 — 여기서 직접 쿼리를 돌면 N+1 을 막으려던 설계가 무너지고,
    "목록은 빠른데 상세만 느린" 이유를 나중에 찾기 어려워진다.
    """
    candidates = []

    snapshot_price = getattr(instance, "live_snapshot_price", None)
    snapshot_at = getattr(instance, "live_snapshot_at", None)
    if snapshot_price is not None and snapshot_at is not None:
        candidates.append((snapshot_at, snapshot_price, SOURCE_SNAPSHOT))

    minute_price = getattr(instance, "live_minute_price", None)
    minute_at = getattr(instance, "live_minute_at", None)
    if minute_price is not None and minute_at is not None:
        candidates.append((minute_at, minute_price, SOURCE_MINUTE))

    daily_price = getattr(instance, "live_daily_price", None)
    daily_date = getattr(instance, "live_daily_date", None)
    if daily_price is not None and daily_date is not None:
        candidates.append((_daily_close_at(daily_date), daily_price, SOURCE_DAILY))

    if not candidates:
        return {"price": None, "at": None, "source": None}

    at, price, source = max(candidates, key=lambda c: c[0])
    return {"price": price, "at": at, "source": source}


def _daily_close_at(day) -> datetime:
    """일봉 날짜를 그날 장 마감 시각(KST) 으로. 다른 후보와 시각으로 비교하기 위해서다."""
    return datetime.combine(day, KRX_CLOSE_TIME, tzinfo=KST)


def price_snapshot(security, at=None) -> dict:
    """`at` 시점까지의 고가·저가를 수집분에서 읽어 온다. **읽기만 하고 저장하지 않는다.**

    전략을 세울 때 "그때 그 가격" 을 한 번 뜨기 위한 함수다. 뜬 값은 `daily_security_price_data`
    행으로 굳고, 그 뒤로는 수집이 무엇을 갱신하든 따라 움직이지 않는다.

    상시로 미러링하지 않는 이유가 여기 있다. 봉은 upsert 라 장중 미확정치가 마감 후
    확정치로 덮인다. 근거 가격이 계속 따라 바뀌면 오전에 세운 전략을 오후에 열었을 때
    "왜 이 가격대에 걸었지" 를 되짚을 수 없다. 판단의 근거는 못박혀 있어야 한다.

    어느 봉을 읽는지는 기준일이 정한다:

        과거 날짜   그날 일봉 (확정된 고가·저가). 없으면 분봉으로 물러난다.
        당일        `at` 까지의 분봉을 집계 — 고가는 최댓값, 저가는 최솟값.

    당일에 분봉을 쓰는 이유는 일봉이 아직 없거나 미확정이라서다. `at` 이후의 분봉은
    빼고 센다. 13시에 세운 전략의 근거에 15시 고가가 섞이면 그건 그때 본 값이 아니다.
    """
    at = at or timezone.now()
    day = timezone.localtime(at).date()
    symbol = Symbol.objects.filter(symbol=security.symbol, market=security.market).first()
    empty = {"high": None, "low": None, "source": None, "at": at}
    if symbol is None:
        return empty

    if day < timezone.localdate():
        candle = DailyCandle.objects.filter(symbol=symbol, date=day).first()
        if candle is not None:
            return {"high": candle.high, "low": candle.low, "source": SOURCE_DAILY, "at": at}
        # 일봉이 아직 안 들어온 과거 날짜. 그날 분봉이 있으면 그것으로 낸다.

    agg = MinuteCandle.objects.filter(symbol=symbol, ts__date=day, ts__lte=at).aggregate(
        high=Max("high"), low=Min("low")
    )
    if agg["high"] is None:
        return empty
    return {"high": agg["high"], "low": agg["low"], "source": SOURCE_MINUTE, "at": at}


def sync_security_prices(codes: list[str] | None = None) -> int:
    """실효 시세를 `securities.current_price` 에 반영한다. 갱신된 행 수를 돌려준다.

    수집이 끝날 때마다 호출한다 — 현재가를 받았을 때도, 장 마감 후 일봉을 받았을 때도.
    그래서 장중에는 5분 전 시세가, 마감 후에는 그날 종가가 컬럼에 들어간다.

    **`updated_at` 은 일부러 건드리지 않는다.** `bulk_update` 가 `auto_now` 를 무시하는
    성질을 그대로 쓴다. 시세는 5분마다 바뀌는데 그때마다 수정일이 갱신되면 "사람이 이
    종목을 마지막으로 손본 날" 이라는 정보가 사라진다. 시세가 언제 것인지는 응답의
    `price_at` 이 알려 준다.
    """
    from trading_discipline.models import Security

    qs = annotate_live_price(Security.objects.all())
    if codes:
        qs = qs.filter(symbol__in=codes)

    changed = []
    for security in qs:
        price = resolve_live_price(security)["price"]
        # 수집된 시세가 없으면 손대지 않는다. 수기 입력이 유일한 값일 수 있다.
        if price is None or security.current_price == price:
            continue
        security.current_price = price
        changed.append(security)

    if changed:
        Security.objects.bulk_update(changed, ["current_price"])
    return len(changed)
