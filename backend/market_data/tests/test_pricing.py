"""실효 시세 선택 로직 테스트. DB 도 네트워크도 필요 없다.

핵심은 하나다 — **장 시간을 코드로 판정하지 않는다.** 후보들의 관측 시각을 비교해
가장 최근 것을 고르면 장중/장후 분기가 저절로 맞는지, 그것을 확인한다.
"""

from datetime import date, datetime
from decimal import Decimal
from types import SimpleNamespace

from django.test import SimpleTestCase

from market_data.services.pricing import (
    KST,
    SOURCE_DAILY,
    SOURCE_MINUTE,
    SOURCE_SNAPSHOT,
    resolve_live_price,
)


def _candidate(**kwargs):
    """뷰셋이 annotate 해 준 상태를 흉내낸 객체."""
    base = {
        "live_snapshot_price": None,
        "live_snapshot_at": None,
        "live_minute_price": None,
        "live_minute_at": None,
        "live_daily_price": None,
        "live_daily_date": None,
    }
    base.update(kwargs)
    return SimpleNamespace(**base)


class LivePriceSelectionTests(SimpleTestCase):
    def test_장중이면_가장_최근_스냅샷이_이긴다(self):
        # 12:30 스냅샷 vs 12:20 분봉 vs 어제 일봉
        obj = _candidate(
            live_snapshot_price=Decimal("271000"),
            live_snapshot_at=datetime(2026, 8, 18, 12, 30, tzinfo=KST),
            live_minute_price=Decimal("270500"),
            live_minute_at=datetime(2026, 8, 18, 12, 20, tzinfo=KST),
            live_daily_price=Decimal("269000"),
            live_daily_date=date(2026, 8, 17),
        )
        result = resolve_live_price(obj)
        self.assertEqual(result["source"], SOURCE_SNAPSHOT)
        self.assertEqual(result["price"], Decimal("271000"))

    def test_장마감후에는_그날_일봉이_이긴다(self):
        # 스냅샷은 15:25 에 멈춘다(수집 스케줄이 09~15시). 일봉은 그날 15:30 종가다.
        obj = _candidate(
            live_snapshot_price=Decimal("271000"),
            live_snapshot_at=datetime(2026, 8, 18, 15, 25, tzinfo=KST),
            live_minute_price=Decimal("271200"),
            live_minute_at=datetime(2026, 8, 18, 15, 29, tzinfo=KST),
            live_daily_price=Decimal("272000"),
            live_daily_date=date(2026, 8, 18),
        )
        result = resolve_live_price(obj)
        self.assertEqual(result["source"], SOURCE_DAILY)
        self.assertEqual(result["price"], Decimal("272000"))

    def test_장중_분봉이_스냅샷보다_최신이면_분봉이_이긴다(self):
        obj = _candidate(
            live_snapshot_price=Decimal("271000"),
            live_snapshot_at=datetime(2026, 8, 18, 12, 10, tzinfo=KST),
            live_minute_price=Decimal("270000"),
            live_minute_at=datetime(2026, 8, 18, 12, 25, tzinfo=KST),
        )
        self.assertEqual(resolve_live_price(obj)["source"], SOURCE_MINUTE)

    def test_주말이면_마지막_거래일_일봉이_남는다(self):
        # 금요일 일봉만 있고 그 뒤로 새 관측이 없다. 휴장 판정 없이도 맞는 답이 나온다.
        obj = _candidate(
            live_snapshot_price=Decimal("271000"),
            live_snapshot_at=datetime(2026, 8, 14, 15, 25, tzinfo=KST),
            live_daily_price=Decimal("272000"),
            live_daily_date=date(2026, 8, 14),
        )
        result = resolve_live_price(obj)
        self.assertEqual(result["source"], SOURCE_DAILY)
        self.assertEqual(result["at"], datetime(2026, 8, 14, 15, 30, tzinfo=KST))

    def test_일봉만_있어도_답이_나온다(self):
        obj = _candidate(live_daily_price=Decimal("272000"), live_daily_date=date(2026, 8, 18))
        self.assertEqual(resolve_live_price(obj)["price"], Decimal("272000"))

    def test_수집된_것이_없으면_전부_None(self):
        result = resolve_live_price(_candidate())
        self.assertEqual(result, {"price": None, "at": None, "source": None})

    def test_값은_있는데_시각이_없으면_후보에서_뺀다(self):
        # last_price 는 있는데 last_price_at 이 비어 있으면 언제 값인지 알 수 없다.
        # 시각을 모르는 값을 최신으로 취급하면 오래된 값이 새 값을 이길 수 있다.
        obj = _candidate(
            live_snapshot_price=Decimal("271000"),
            live_snapshot_at=None,
            live_daily_price=Decimal("272000"),
            live_daily_date=date(2026, 8, 18),
        )
        self.assertEqual(resolve_live_price(obj)["source"], SOURCE_DAILY)

    def test_annotation_이_아예_없으면_쿼리하지_않고_None(self):
        # annotate 를 안 거친 인스턴스. 여기서 직접 DB 를 뒤지면 N+1 이 된다.
        result = resolve_live_price(SimpleNamespace())
        self.assertEqual(result["source"], None)
