"""KIS 클라이언트 응답 처리 테스트. 실제 KIS 를 부르지 않는다(httpx.MockTransport).

여기서 지키려는 것은 하나다 — **KIS 는 실패해도 HTTP 200 을 준다.** 본문의 `rt_cd` 를
안 보면 빈 응답을 정상으로 착각하고, "수집은 도는데 데이터가 안 쌓이는" 상태가 된다.
"""

import httpx
from django.test import TestCase, override_settings

from market_data.models import KisToken
from market_data.services.kis_client import KisApiError, KisClient, KisConfigError

KIS_SETTINGS = {
    "KIS_APP_KEY": "test-app-key",
    "KIS_APP_SECRET": "test-app-secret",
    "KIS_ENV": "paper",
    "KIS_RATE_LIMIT_PER_SEC": 100,  # 테스트가 유량 제한 때문에 느려지지 않도록
    "KIS_HTTP_RETRIES": 2,
}

TOKEN_OK = {"access_token": "tok-1", "token_type": "Bearer", "expires_in": 86400}
PRICE_OK = {
    "rt_cd": "0",
    "msg_cd": "MCA00000",
    "msg1": "정상처리 되었습니다.",
    "output": {"stck_prpr": "73800", "hts_kor_isnm": "삼성전자", "acml_vol": "12345678"},
}


def _route(handler):
    """MockTransport 를 꽂은 클라이언트를 만든다."""
    return KisClient(transport=httpx.MockTransport(handler))


@override_settings(**KIS_SETTINGS)
class TokenTests(TestCase):
    def test_토큰을_발급하고_DB에_저장한다(self):
        calls = []

        def handler(request):
            calls.append(request.url.path)
            if request.url.path.endswith("/tokenP"):
                return httpx.Response(200, json=TOKEN_OK)
            return httpx.Response(200, json=PRICE_OK)

        with _route(handler) as client:
            self.assertEqual(client.access_token(), "tok-1")

        row = KisToken.objects.get(env="paper")
        self.assertEqual(row.access_token, "tok-1")
        self.assertEqual(calls.count("/oauth2/tokenP"), 1)

    def test_유효한_토큰이_있으면_다시_발급하지_않는다(self):
        calls = []

        def handler(request):
            calls.append(request.url.path)
            if request.url.path.endswith("/tokenP"):
                return httpx.Response(200, json=TOKEN_OK)
            return httpx.Response(200, json=PRICE_OK)

        with _route(handler) as client:
            client.access_token()
            client.inquire_price("005930")
            client.inquire_price("000660")

        # 발급은 최초 1회뿐이어야 한다. 매 호출마다 발급하면 KIS 의 1분 제한에 걸린다.
        self.assertEqual(calls.count("/oauth2/tokenP"), 1)

    def test_1분제한에_걸리면_기존_토큰을_계속_쓴다(self):
        from datetime import timedelta

        from django.utils import timezone

        # 만료 여유(margin) 안에 든 토큰 — 재발급을 시도하게 되는 상태
        KisToken.objects.create(
            env="paper",
            access_token="old-token",
            expires_at=timezone.now() + timedelta(minutes=30),
        )

        def handler(request):
            if request.url.path.endswith("/tokenP"):
                return httpx.Response(
                    200,
                    json={"error_code": "EGW00133", "error_description": "1분당 1회 발급 가능"},
                )
            return httpx.Response(200, json=PRICE_OK)

        with _route(handler) as client:
            # 재발급이 막혔어도 아직 유효한 토큰이 있으므로 수집은 계속돼야 한다.
            self.assertEqual(client.access_token(), "old-token")

    def test_키가_없으면_생성_시점에_막는다(self):
        with override_settings(KIS_APP_KEY="", KIS_APP_SECRET=""):
            with self.assertRaises(KisConfigError):
                KisClient()


@override_settings(**KIS_SETTINGS)
class ResponseHandlingTests(TestCase):
    def setUp(self):
        from datetime import timedelta

        from django.utils import timezone

        KisToken.objects.create(
            env="paper",
            access_token="tok-1",
            expires_at=timezone.now() + timedelta(hours=20),
        )

    def test_정상응답은_output_을_돌려준다(self):
        with _route(lambda r: httpx.Response(200, json=PRICE_OK)) as client:
            output = client.inquire_price("005930")
        self.assertEqual(output["stck_prpr"], "73800")

    def test_rt_cd가_0이_아니면_예외다(self):
        # HTTP 는 200 인데 본문이 실패인 경우. 이걸 통과시키면 빈 데이터가 정상으로 둔갑한다.
        body = {"rt_cd": "1", "msg_cd": "40580000", "msg1": "종목코드 오류"}

        with _route(lambda r: httpx.Response(200, json=body)) as client:
            with self.assertRaises(KisApiError) as ctx:
                client.inquire_price("999999")

        self.assertEqual(ctx.exception.code, "40580000")
        self.assertIn("종목코드 오류", str(ctx.exception))

    def test_일반오류는_재시도하지_않는다(self):
        calls = []

        def handler(request):
            calls.append(1)
            return httpx.Response(200, json={"rt_cd": "1", "msg_cd": "40580000", "msg1": "오류"})

        with _route(handler) as client:
            with self.assertRaises(KisApiError):
                client.inquire_price("999999")

        # 없는 종목코드는 다시 불러도 같은 답이다. 재시도는 KIS 를 두들기기만 한다.
        self.assertEqual(len(calls), 1)

    def test_유량초과는_재시도한다(self):
        responses = [
            httpx.Response(200, json={"rt_cd": "1", "msg_cd": "EGW00201", "msg1": "초당 거래건수 초과"}),
            httpx.Response(200, json=PRICE_OK),
        ]

        def handler(request):
            return responses.pop(0)

        with _route(handler) as client:
            output = client.inquire_price("005930")

        self.assertEqual(output["stck_prpr"], "73800")
        self.assertEqual(responses, [])

    def test_토큰만료는_재발급후_재시도한다(self):
        seen = []

        def handler(request):
            seen.append(request.url.path)
            if request.url.path.endswith("/tokenP"):
                return httpx.Response(200, json={**TOKEN_OK, "access_token": "tok-2"})
            if len([p for p in seen if "inquire-price" in p]) == 1:
                return httpx.Response(
                    200, json={"rt_cd": "1", "msg_cd": "EGW00123", "msg1": "토큰 만료"}
                )
            return httpx.Response(200, json=PRICE_OK)

        with _route(handler) as client:
            output = client.inquire_price("005930")

        self.assertEqual(output["stck_prpr"], "73800")
        self.assertIn("/oauth2/tokenP", seen)
        self.assertEqual(KisToken.objects.get(env="paper").access_token, "tok-2")

    def test_HTTP_에러는_예외다(self):
        with _route(lambda r: httpx.Response(500, text="server error")) as client:
            with self.assertRaises(KisApiError):
                client.inquire_price("005930")

    def test_일봉_요청_파라미터가_KIS_형식이다(self):
        from datetime import date

        captured = {}

        def handler(request):
            captured.update(dict(request.url.params))
            captured["tr_id"] = request.headers.get("tr_id")
            return httpx.Response(200, json={"rt_cd": "0", "output2": []})

        with _route(handler) as client:
            client.inquire_daily_candles("005930", date(2026, 1, 1), date(2026, 3, 31))

        self.assertEqual(captured["FID_INPUT_ISCD"], "005930")
        self.assertEqual(captured["FID_INPUT_DATE_1"], "20260101")
        self.assertEqual(captured["FID_INPUT_DATE_2"], "20260331")
        self.assertEqual(captured["FID_PERIOD_DIV_CODE"], "D")
        self.assertEqual(captured["FID_ORG_ADJ_PRC"], "0")  # 수정주가
        self.assertEqual(captured["tr_id"], "FHKST03010100")
