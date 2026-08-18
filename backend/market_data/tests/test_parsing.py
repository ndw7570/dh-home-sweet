"""KIS 응답 파싱 단위 테스트. DB 도 네트워크도 필요 없다.

KIS 는 숫자를 문자열로 주고, 값이 없으면 빈 문자열을 준다. 그 경계를 잘못 다루면
`""` 가 0 으로 저장되어 "거래량 0 인 봉" 처럼 그럴듯한 가짜 데이터가 생긴다.
"""

from datetime import datetime, timezone as dt_timezone
from decimal import Decimal

from django.test import SimpleTestCase

from market_data.services.collector import KST, _dec, _int, _kst_datetime


class DecimalParsingTests(SimpleTestCase):
    def test_평범한_숫자문자열(self):
        self.assertEqual(_dec("73800"), Decimal("73800"))
        self.assertEqual(_dec("450500.00"), Decimal("450500.00"))

    def test_쉼표가_섞인_숫자(self):
        self.assertEqual(_dec("1,234,500"), Decimal("1234500"))

    def test_음수(self):
        self.assertEqual(_dec("-1200"), Decimal("-1200"))

    def test_값이_없으면_None(self):
        # 이 셋을 0 으로 바꿔 버리면 "가격 0 원짜리 봉" 이 저장된다.
        self.assertIsNone(_dec(""))
        self.assertIsNone(_dec("   "))
        self.assertIsNone(_dec(None))
        self.assertIsNone(_dec("-"))

    def test_숫자가_아니면_None(self):
        self.assertIsNone(_dec("abc"))

    def test_allow_zero_False_면_0도_결측(self):
        # 가격 0 은 실제 값이 아니라 결측이다. 거래량 0 은 실제 값이다.
        self.assertEqual(_dec("0"), Decimal("0"))
        self.assertIsNone(_dec("0", allow_zero=False))

    def test_int_변환은_기본값을_가진다(self):
        self.assertEqual(_int("15000000"), 15000000)
        self.assertEqual(_int(""), 0)
        self.assertEqual(_int("", default=-1), -1)


class KstDatetimeTests(SimpleTestCase):
    def test_KST_로_해석하고_UTC_로_바뀐다(self):
        ts = _kst_datetime("20260818", "090000")
        self.assertEqual(ts, datetime(2026, 8, 18, 9, 0, tzinfo=KST))
        # 저장은 UTC 다. 09:00 KST = 00:00 UTC.
        self.assertEqual(
            ts.astimezone(dt_timezone.utc),
            datetime(2026, 8, 18, 0, 0, tzinfo=dt_timezone.utc),
        )

    def test_시각이_짧으면_왼쪽을_0으로_채운다(self):
        # KIS 가 "90000" 처럼 앞자리 0 을 떼고 주는 경우가 있다.
        self.assertEqual(_kst_datetime("20260818", "90000"), datetime(2026, 8, 18, 9, 0, tzinfo=KST))

    def test_형식이_틀리면_None(self):
        self.assertIsNone(_kst_datetime("2026-08-18", "090000"))
        self.assertIsNone(_kst_datetime("", ""))
        self.assertIsNone(_kst_datetime("20260818", "bogus"))
