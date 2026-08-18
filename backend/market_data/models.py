"""시세 데이터 모델 — 종목 마스터 · 일봉 · 분봉 · KIS 토큰.

규율 앱(`trading_discipline`) 과 **같은 DB · 같은 스키마**에 산다. 분리하지 않은 이유는
"종목의 현재가를 자동으로 채우고, 계획 대비 실제가를 조인 한 번으로 대조한다" 가
이 연동의 첫 실익이기 때문이다. DB 를 나누면 그 조인이 애플리케이션 코드로 내려온다.

## `Symbol` 과 `trading_discipline.Security` 는 다른 것이다

  Security — **계좌가 보유한** 종목. account FK 가 있고, 같은 삼성전자라도 계좌가 둘이면 행이 둘이다.
  Symbol   — **시세를 수집할** 종목. 계좌와 무관하고 종목코드당 하나다.

둘은 `symbol`(종목코드) 문자열로 이어진다. FK 로 묶지 않은 이유는 방향 때문이다.
시세 수집은 보유 여부와 무관하게 돌아야 한다(사려고 보는 종목도 수집 대상이다).
Security 에 FK 를 걸면 "보유하지 않은 종목은 수집할 수 없다" 가 되어 버린다.

## 소프트딜리트를 여기에는 적용하지 않는다 (Symbol 제외)

규율 앱은 모든 테이블이 `is_deleted` 를 갖는다(core/models/common.py). 시세 테이블은
빼기로 한다 — 봉 데이터는 사람이 판단해 지우는 대상이 아니라 기계가 쌓는 사실 기록이고,
행이 연 수백만 건으로 불어나는 곳에 조회마다 걸리는 필터와 컬럼을 얹을 이유가 없다.
`Symbol` 만 소프트딜리트를 따른다 — 이건 사람이 관리하는 목록이라서다.

## 시각

`USE_TZ=True`. 저장은 UTC, 표시할 때만 KST 로 바꾼다. 분봉의 `ts` 는 **봉이 시작하는 시각**이다
(09:00 봉 = 09:00:00 ~ 09:00:59 의 체결). KIS 응답은 KST 문자열(`stck_bsop_date`+`stck_cntg_hour`)
이므로 저장 전에 aware datetime 으로 바꾼다.
"""

from django.db import models

from core.db import table
from core.models.common import SoftDeleteModel
from trading_discipline.constants.choices import Market


class Symbol(SoftDeleteModel):
    """시세 수집 대상 종목 — `market_symbols`.

    **수집 여부를 결정하는 스위치가 이 테이블에는 없다.** 대상은 오직 하나로 정해진다:

        수집 대상 = `securities` 중 is_active=True 이고 삭제되지 않은 종목

    처음에는 여기에 `is_subscribed` 컬럼을 두었다가 뺐다. 스위치가 둘이면 반드시
    어긋난다 — 화면에서 '관리대상' 을 꺼도 수집은 계속 도는 상태가 실제로 생겼다.
    동기화 시점에만 값을 맞추는 구조라, 그 사이에는 둘 중 어느 쪽이 참인지 알 수 없었다.

    스위치를 화면 하나로 모으니 동기화를 기다릴 이유도 사라졌다. 수집이 돌 때마다
    `securities` 를 직접 보고 대상을 정하므로, 화면에서 체크를 끄면 **다음 수집 주기**
    (현재가 5분·분봉 10분) 에 반영된다.

    이 테이블은 그래서 "봉이 매달릴 종목 행" 과 "최종 조회가 캐시" 만 담당한다.
    """

    id = models.AutoField(primary_key=True, db_comment="ID")
    market = models.CharField(
        max_length=20, choices=Market.choices, default=Market.KOSPI, db_comment="시장"
    )
    symbol = models.CharField(max_length=30, db_comment="종목코드")
    name = models.CharField(max_length=200, db_comment="종목명")

    # 최근 조회한 현재가. 봉과 별개로 여기 캐시해 두면 "지금 얼마" 를 묻는 화면이
    # 봉 테이블을 뒤지지 않아도 된다. 원본은 어디까지나 봉 테이블이다.
    last_price = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True, db_comment="최종조회가"
    )
    last_price_at = models.DateTimeField(null=True, blank=True, db_comment="최종조회시각")

    created_at = models.DateTimeField(auto_now_add=True, db_comment="생성일시")
    updated_at = models.DateTimeField(auto_now=True, db_comment="수정일시")

    class Meta:
        db_table = table("market_symbols")
        verbose_name = "수집종목"
        verbose_name_plural = "수집종목"
        constraints = [
            models.UniqueConstraint(fields=["market", "symbol"], name="market_symbol_uniq"),
        ]
        indexes = [
            # 수집 대상을 고를 때 securities 의 종목코드로 조회한다.
            models.Index(fields=["symbol"], name="market_symbol_code_idx"),
        ]

    def __str__(self):
        return f"{self.name}({self.symbol})"


class DailyCandle(models.Model):
    """일봉 — `market_daily_candles`. KIS `inquire-daily-itemchartprice` 응답 1행이 1행.

    `(symbol, date)` 가 유니크다. 수집을 여러 번 돌려도 같은 날짜는 덮어쓰기(upsert)로
    수렴한다 — 장중에 부분 데이터를 받아 두었다가 마감 후 확정치로 갱신하는 흐름이
    정상 동작이기 때문이다.
    """

    id = models.BigAutoField(primary_key=True, db_comment="ID")
    symbol = models.ForeignKey(
        "market_data.Symbol",
        on_delete=models.CASCADE,
        db_column="symbol_id",
        related_name="daily_candles",
        db_comment="종목ID",
    )
    date = models.DateField(db_comment="영업일자")

    open = models.DecimalField(max_digits=15, decimal_places=2, db_comment="시가")
    high = models.DecimalField(max_digits=15, decimal_places=2, db_comment="고가")
    low = models.DecimalField(max_digits=15, decimal_places=2, db_comment="저가")
    close = models.DecimalField(max_digits=15, decimal_places=2, db_comment="종가")
    volume = models.BigIntegerField(default=0, db_comment="거래량")
    trade_amount = models.BigIntegerField(null=True, blank=True, db_comment="거래대금")

    collected_at = models.DateTimeField(auto_now=True, db_comment="수집시각")

    class Meta:
        db_table = table("market_daily_candles")
        verbose_name = "일봉"
        verbose_name_plural = "일봉"
        constraints = [
            models.UniqueConstraint(fields=["symbol", "date"], name="daily_candle_uniq"),
        ]
        indexes = [
            # 시세 조회는 거의 항상 "이 종목의 최근 N일" 이다. 정렬을 인덱스가 먹게 둔다.
            models.Index(fields=["symbol", "-date"], name="daily_candle_sym_date_idx"),
        ]

    def __str__(self):
        return f"{self.symbol_id} {self.date} {self.close}"


class MinuteCandle(models.Model):
    """분봉 — `market_minute_candles`. `ts` 는 봉이 **시작**하는 시각(UTC 저장).

    KIS 당일분봉 API 는 한 번에 30건까지만 준다. 장 하루치(390분) 를 채우려면 시간을
    거슬러 여러 번 호출해야 하고, 그 과정에서 같은 봉을 다시 받는 구간이 생긴다.
    `(symbol, ts)` 유니크 + upsert 로 중복을 흡수한다.

    행 수가 가장 빨리 느는 테이블이다(종목당 하루 390행). 나중에 TimescaleDB 로 옮길 때를
    대비해 시간 컬럼을 축으로 두고 인덱스도 (symbol, ts DESC) 로 잡아 둔다 — 파티셔닝
    기준이 그대로 이 축이라 스키마를 갈아엎지 않아도 된다.
    """

    id = models.BigAutoField(primary_key=True, db_comment="ID")
    symbol = models.ForeignKey(
        "market_data.Symbol",
        on_delete=models.CASCADE,
        db_column="symbol_id",
        related_name="minute_candles",
        db_comment="종목ID",
    )
    ts = models.DateTimeField(db_comment="봉시작시각(UTC)")

    open = models.DecimalField(max_digits=15, decimal_places=2, db_comment="시가")
    high = models.DecimalField(max_digits=15, decimal_places=2, db_comment="고가")
    low = models.DecimalField(max_digits=15, decimal_places=2, db_comment="저가")
    close = models.DecimalField(max_digits=15, decimal_places=2, db_comment="종가")
    volume = models.BigIntegerField(default=0, db_comment="거래량")

    collected_at = models.DateTimeField(auto_now=True, db_comment="수집시각")

    class Meta:
        db_table = table("market_minute_candles")
        verbose_name = "분봉"
        verbose_name_plural = "분봉"
        constraints = [
            models.UniqueConstraint(fields=["symbol", "ts"], name="minute_candle_uniq"),
        ]
        indexes = [
            models.Index(fields=["symbol", "-ts"], name="minute_candle_sym_ts_idx"),
        ]

    def __str__(self):
        return f"{self.symbol_id} {self.ts:%Y-%m-%d %H:%M} {self.close}"


class KisToken(models.Model):
    """KIS 접근토큰 캐시 — `market_kis_tokens`. 환경(paper/live)당 한 행.

    **DB 에 두는 이유가 있다.** KIS 는 접근토큰 발급을 1분에 1회로 제한한다(EGW00133).
    프로세스마다 각자 발급하면 web·worker·beat·collector 가 동시에 뜨는 순간 서로를
    막는다. 그래서 발급한 토큰을 한 곳에 두고 모두가 같은 것을 쓴다. Redis 가 아니라
    DB 인 이유는 Redis 가 안 떠 있어도 수집이 돌아야 하기 때문이다.

    토큰 자체는 24시간짜리 bearer 다. DB 를 읽을 수 있는 사람은 이 값을 쓸 수 있으니,
    운영 환경에서는 DB 접근 권한을 키 파일과 같은 급으로 다뤄야 한다.
    """

    id = models.AutoField(primary_key=True, db_comment="ID")
    env = models.CharField(max_length=10, unique=True, db_comment="환경(paper|live)")
    access_token = models.TextField(db_comment="접근토큰")
    expires_at = models.DateTimeField(db_comment="만료시각")
    # WebSocket 실시간 시세용 접속키. REST 토큰과 발급 경로가 다르다(/oauth2/Approval).
    approval_key = models.CharField(
        max_length=200, null=True, blank=True, db_comment="실시간접속키"
    )
    issued_at = models.DateTimeField(auto_now=True, db_comment="발급시각")

    class Meta:
        db_table = table("market_kis_tokens")
        verbose_name = "KIS토큰"
        verbose_name_plural = "KIS토큰"

    def __str__(self):
        return f"{self.env} (만료 {self.expires_at:%Y-%m-%d %H:%M})"
