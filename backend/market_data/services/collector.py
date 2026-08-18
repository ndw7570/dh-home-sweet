"""KIS 응답을 모델로 옮기는 수집 서비스.

`kis_client` 가 가져온 dict 를 파싱해 `Symbol` / `DailyCandle` / `MinuteCandle` 에 넣는다.
전부 **upsert** 다 — 같은 구간을 두 번 수집해도 행이 늘지 않고 값만 최신으로 수렴한다.
수집은 실패하면 다시 돌리는 것이 정상 운영이라, 재실행이 안전하지 않으면 쓸 수 없다.

## KIS 응답 파싱에서 주의할 것

- **숫자가 전부 문자열이다.** `"73800"`, `"-1200"`, 가끔 `""`. 빈 문자열을 0 으로 볼지
  결측으로 볼지 필드마다 다르다 — 거래량은 0 이 맞고, 가격은 결측이면 그 행을 버려야 한다.
- **시각이 KST 문자열이다.** `stck_bsop_date`(YYYYMMDD) + `stck_cntg_hour`(HHMMSS).
  저장은 UTC 이므로 aware datetime 으로 바꿔서 넣는다.
- **빈 배열이 정상 응답이다.** 휴장일·상장폐지·장 시작 전에는 `output2` 가 비어서 온다.
  실패가 아니므로 예외로 다루지 않고 0건으로 보고한다.
"""

import logging
from dataclasses import dataclass, field
from datetime import date, datetime, timedelta
from decimal import Decimal, InvalidOperation
from zoneinfo import ZoneInfo

from django.db import transaction
from django.utils import timezone

from market_data.models import DailyCandle, MinuteCandle, Symbol
from market_data.services.kis_client import KisApiError, KisClient

logger = logging.getLogger(__name__)

KST = ZoneInfo("Asia/Seoul")

# KIS 기간별시세가 한 번에 주는 최대 건수. 이보다 긴 구간은 호출을 나눈다.
DAILY_CHUNK_DAYS = 100
# 당일분봉이 한 번에 주는 최대 건수.
MINUTE_PAGE_SIZE = 30
# 분봉 페이지 루프 상한. 정규장 390분 / 30건 = 13회면 충분하지만, 응답이 예상과 다를 때
# 무한 루프로 KIS 를 두들기지 않도록 상한을 둔다.
MINUTE_MAX_PAGES = 20

KRX_OPEN = "090000"
KRX_CLOSE = "153000"


@dataclass
class CollectResult:
    """수집 결과 요약. 커맨드·태스크가 이걸 그대로 로그로 뱉는다."""

    created: int = 0
    updated: int = 0
    skipped: int = 0
    errors: list[str] = field(default_factory=list)

    @property
    def total(self) -> int:
        return self.created + self.updated

    def __str__(self):
        s = f"신규 {self.created} / 갱신 {self.updated} / 건너뜀 {self.skipped}"
        if self.errors:
            s += f" / 오류 {len(self.errors)}"
        return s


# ── 파싱 헬퍼 ────────────────────────────────────────
def _dec(raw, allow_zero: bool = True) -> Decimal | None:
    """KIS 문자열 숫자를 Decimal 로. 못 읽으면 None."""
    if raw is None:
        return None
    text = str(raw).strip().replace(",", "")
    if not text or text in ("-", "."):
        return None
    try:
        value = Decimal(text)
    except (InvalidOperation, ValueError):
        return None
    if not allow_zero and value == 0:
        return None
    return value


def _int(raw, default: int = 0) -> int:
    value = _dec(raw)
    return int(value) if value is not None else default


def _kst_datetime(yyyymmdd: str, hhmmss: str) -> datetime | None:
    """KIS 의 KST 날짜·시각 문자열을 aware datetime 으로."""
    try:
        naive = datetime.strptime(f"{yyyymmdd}{hhmmss:0>6}", "%Y%m%d%H%M%S")
    except (ValueError, TypeError):
        return None
    return naive.replace(tzinfo=KST)


# ── 수집 대상 ────────────────────────────────────────
def collection_targets(codes: list[str] | None = None) -> list[Symbol]:
    """이번에 수집할 종목. **화면이 유일한 기준이다.**

        수집 대상 = `securities` 중 is_active=True 이고 삭제되지 않은 종목

    별도의 구독 스위치를 두지 않는다. 스위치가 둘이면 어긋나고, 어긋나면 어느 쪽이
    참인지 알 수 없게 된다(화면에서 껐는데 수집은 계속 도는 상태가 실제로 있었다).

    수집이 돌 때마다 여기서 대상을 다시 계산하므로 **동기화 배치가 필요 없다.**
    화면에서 종목을 등록하거나 관리대상을 끄면 다음 수집 주기에 그대로 반영된다.
    `Symbol` 행이 아직 없는 종목은 이 자리에서 만든다 — 봉이 매달릴 곳이 필요해서다.

    `codes` 를 주면 그중에서 더 좁힌다. 대상 밖의 종목은 돌려주지 않는다 —
    화면에서 관리대상이 아닌 종목을 커맨드로 우회해 수집하면 기준이 다시 둘이 된다.
    """
    from trading_discipline.models import Security

    rows = Security.objects.filter(is_active=True).values("market", "symbol", "name")
    if codes:
        rows = rows.filter(symbol__in=codes)

    targets: dict[tuple[str, str], Symbol] = {}
    for row in rows:
        code = (row["symbol"] or "").strip()
        if not code:
            continue
        key = (row["market"], code)
        if key in targets:
            # 같은 종목을 여러 계좌가 보유하면 행이 여럿이다. 시세는 계좌와 무관하다.
            continue
        sym, created = Symbol.all_objects.get_or_create(
            market=row["market"], symbol=code, defaults={"name": row["name"] or code}
        )
        if sym.is_deleted:
            # 화면에서 되살린 종목은 수집도 되살린다. 기준이 화면 하나뿐이므로 여기서 맞춘다.
            sym.is_deleted = False
            sym.save(update_fields=["is_deleted", "updated_at"])
        if created:
            logger.info("수집 종목 생성: %s", sym)
        targets[key] = sym

    return list(targets.values())


# ── 현재가 ───────────────────────────────────────────
def update_current_prices(
    client: KisClient, symbols: list[Symbol], update_securities: bool = False
) -> CollectResult:
    """현재가를 조회해 `Symbol.last_price` 를 갱신한다.

    `update_securities=True` 면 규율 앱의 `securities.current_price` 까지 같은 값으로 덮는다.
    기본을 False 로 둔 이유: 그 컬럼은 지금까지 **사람이 입력**해 온 값이고, 자동 갱신은
    사람의 입력을 지우는 동작이다. 켜는 것은 명시적 선택이어야 한다.
    """
    result = CollectResult()
    now = timezone.now()

    for sym in symbols:
        try:
            output = client.inquire_price(sym.symbol)
        except KisApiError as exc:
            result.errors.append(f"{sym.symbol}: {exc}")
            logger.warning("현재가 조회 실패 %s: %s", sym.symbol, exc)
            continue

        price = _dec(output.get("stck_prpr"), allow_zero=False)
        if price is None:
            result.skipped += 1
            logger.warning("현재가 응답에 stck_prpr 가 없다: %s", sym.symbol)
            continue

        sym.last_price = price
        sym.last_price_at = now
        # 종목명이 비어 있던 경우 KIS 가 준 이름으로 채운다.
        kis_name = (output.get("hts_kor_isnm") or "").strip()
        if kis_name and sym.name != kis_name:
            sym.name = kis_name
            sym.save(update_fields=["last_price", "last_price_at", "name", "updated_at"])
        else:
            sym.save(update_fields=["last_price", "last_price_at", "updated_at"])
        result.updated += 1

        if update_securities:
            _apply_price_to_securities(sym, price)

    logger.info("현재가 갱신: %s", result)
    return result


def _apply_price_to_securities(sym: Symbol, price: Decimal) -> int:
    """같은 종목코드를 가진 보유 종목의 현재가를 갱신한다.

    계좌가 여럿이면 같은 종목이 여러 행으로 있다. 시세는 계좌와 무관하므로 전부 갱신한다.
    """
    from trading_discipline.models import Security

    return Security.objects.filter(symbol=sym.symbol).update(current_price=price)


# ── 일봉 ─────────────────────────────────────────────
def backfill_daily_candles(
    client: KisClient, sym: Symbol, start: date, end: date, adjusted: bool = True
) -> CollectResult:
    """`start`~`end` 일봉을 수집한다. 100일 단위로 끊어 호출한다.

    끊는 방향은 **최신 → 과거**다. 중간에 실패해도 최근 데이터부터 남아 있는 편이
    화면에 쓸모 있기 때문이다.
    """
    result = CollectResult()
    cursor_end = end

    while cursor_end >= start:
        cursor_start = max(start, cursor_end - timedelta(days=DAILY_CHUNK_DAYS - 1))
        try:
            rows = client.inquire_daily_candles(
                sym.symbol, cursor_start, cursor_end, adjusted=adjusted
            )
        except KisApiError as exc:
            result.errors.append(f"{sym.symbol} {cursor_start}~{cursor_end}: {exc}")
            logger.warning("일봉 조회 실패 %s %s~%s: %s", sym.symbol, cursor_start, cursor_end, exc)
            break

        chunk = _save_daily_rows(sym, rows)
        result.created += chunk.created
        result.updated += chunk.updated
        result.skipped += chunk.skipped

        if not rows:
            # 빈 응답이 곧 "이 구간엔 데이터가 없다" 는 뜻. 더 과거로 가 봐야 마찬가지인
            # 경우가 많지만(상장 전), 휴장 구간일 수도 있어 한 청크만 더 물러난다.
            logger.info("일봉 빈 응답 %s %s~%s", sym.symbol, cursor_start, cursor_end)

        cursor_end = cursor_start - timedelta(days=1)

    logger.info("일봉 수집 %s: %s", sym.symbol, result)
    return result


def _save_daily_rows(sym: Symbol, rows: list[dict]) -> CollectResult:
    result = CollectResult()
    parsed: dict[date, DailyCandle] = {}

    for row in rows:
        day_raw = (row.get("stck_bsop_date") or "").strip()
        try:
            day = datetime.strptime(day_raw, "%Y%m%d").date()
        except (ValueError, TypeError):
            result.skipped += 1
            continue

        close = _dec(row.get("stck_clpr"), allow_zero=False)
        if close is None:
            # 종가가 없는 행은 봉이 아니다(휴장일 자리 등).
            result.skipped += 1
            continue

        parsed[day] = DailyCandle(
            symbol=sym,
            date=day,
            open=_dec(row.get("stck_oprc")) or close,
            high=_dec(row.get("stck_hgpr")) or close,
            low=_dec(row.get("stck_lwpr")) or close,
            close=close,
            volume=_int(row.get("acml_vol")),
            trade_amount=_int(row.get("acml_tr_pbmn"), default=0) or None,
        )

    if not parsed:
        return result

    existing = set(
        DailyCandle.objects.filter(symbol=sym, date__in=parsed.keys()).values_list("date", flat=True)
    )
    with transaction.atomic():
        DailyCandle.objects.bulk_create(
            list(parsed.values()),
            update_conflicts=True,
            unique_fields=["symbol", "date"],
            update_fields=["open", "high", "low", "close", "volume", "trade_amount", "collected_at"],
        )
    result.updated = len(existing)
    result.created = len(parsed) - len(existing)
    return result


# ── 분봉 ─────────────────────────────────────────────
def collect_minute_candles(client: KisClient, sym: Symbol, until: str = "") -> CollectResult:
    """당일 분봉을 수집한다. `until`(HHMMSS) 부터 장 시작까지 거슬러 올라간다.

    KIS 당일분봉은 한 번에 30건이고 **기준 시각에서 과거로** 준다. 그래서 받은 묶음의
    가장 이른 봉에서 1분을 빼 다음 기준 시각으로 삼는 식으로 페이지를 넘긴다.
    """
    result = CollectResult()
    cursor = until or timezone.localtime().strftime("%H%M%S")

    for _page in range(MINUTE_MAX_PAGES):
        try:
            rows = client.inquire_today_minutes(sym.symbol, cursor)
        except KisApiError as exc:
            result.errors.append(f"{sym.symbol} @{cursor}: {exc}")
            logger.warning("분봉 조회 실패 %s @%s: %s", sym.symbol, cursor, exc)
            break

        if not rows:
            break

        chunk, earliest = _save_minute_rows(sym, rows)
        result.created += chunk.created
        result.updated += chunk.updated
        result.skipped += chunk.skipped

        if earliest is None:
            break
        earliest_hhmmss = earliest.astimezone(KST).strftime("%H%M%S")
        if earliest_hhmmss <= KRX_OPEN:
            break
        # 가장 이른 봉의 1분 전으로 커서를 옮긴다. 같은 커서가 반복되면 무한 루프이므로 중단.
        next_cursor = (earliest.astimezone(KST) - timedelta(minutes=1)).strftime("%H%M%S")
        if next_cursor >= cursor:
            break
        cursor = next_cursor
        if len(rows) < MINUTE_PAGE_SIZE:
            break

    logger.info("분봉 수집 %s: %s", sym.symbol, result)
    return result


def _save_minute_rows(sym: Symbol, rows: list[dict]) -> tuple[CollectResult, datetime | None]:
    result = CollectResult()
    parsed: dict[datetime, MinuteCandle] = {}

    for row in rows:
        ts = _kst_datetime(
            (row.get("stck_bsop_date") or "").strip(),
            (row.get("stck_cntg_hour") or "").strip(),
        )
        if ts is None:
            result.skipped += 1
            continue

        close = _dec(row.get("stck_prpr"), allow_zero=False)
        if close is None:
            result.skipped += 1
            continue

        parsed[ts] = MinuteCandle(
            symbol=sym,
            ts=ts,
            open=_dec(row.get("stck_oprc")) or close,
            high=_dec(row.get("stck_hgpr")) or close,
            low=_dec(row.get("stck_lwpr")) or close,
            close=close,
            volume=_int(row.get("cntg_vol")),
        )

    if not parsed:
        return result, None

    existing = set(
        MinuteCandle.objects.filter(symbol=sym, ts__in=parsed.keys()).values_list("ts", flat=True)
    )
    with transaction.atomic():
        MinuteCandle.objects.bulk_create(
            list(parsed.values()),
            update_conflicts=True,
            unique_fields=["symbol", "ts"],
            update_fields=["open", "high", "low", "close", "volume", "collected_at"],
        )
    result.updated = len(existing)
    result.created = len(parsed) - len(existing)
    return result, min(parsed.keys())
