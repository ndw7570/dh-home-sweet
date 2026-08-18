"""KIS 오픈API REST 클라이언트.

공식 문서: https://apiportal.koreainvestment.com/apiservice
공식 예제: https://github.com/koreainvestment/open-trading-api

## 이 클래스가 책임지는 것

1. **접근토큰 수명 관리** — 발급·DB 캐시·만료 전 재발급. KIS 는 토큰 발급을 1분에 1회로
   제한하므로(EGW00133) 프로세스마다 각자 발급하면 서로를 막는다. 그래서 DB 한 곳에 둔다.
2. **유량 제한** — 모의투자는 초당 2건이 기본이다. backfill 처럼 연속 호출하는 작업은
   여기를 안 거치면 EGW00201 로 줄줄이 실패한다.
3. **성공 판정** — KIS 는 실패해도 HTTP 200 을 준다. 본문의 `rt_cd` 가 `"0"` 이어야 성공이다.
   이걸 안 보면 빈 응답을 정상으로 착각하고 "수집은 도는데 데이터가 안 쌓이는" 상태가 된다.

## 이 클래스가 하지 않는 것

응답 필드를 모델로 옮기는 일은 `services/collector.py` 가 한다. 여기서는 KIS 가 준 dict 를
그대로 돌려준다 — 파싱 규칙이 바뀌어도 통신 계층은 안 건드리게 하려는 것이다.
"""

import logging
from datetime import date, timedelta

import httpx
from django.conf import settings
from django.db import transaction
from django.utils import timezone

from market_data.models import KisToken
from market_data.services.rate_limiter import RateLimiter

logger = logging.getLogger(__name__)

# ── 엔드포인트 · 거래ID ────────────────────────────────
# tr_id 는 모의(paper)와 실전(live)이 다른 API 도 있지만, 아래 시세 조회 3종은 공통이다.
PATH_TOKEN = "/oauth2/tokenP"
PATH_APPROVAL = "/oauth2/Approval"
PATH_PRICE = "/uapi/domestic-stock/v1/quotations/inquire-price"
PATH_DAILY_CHART = "/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice"
PATH_MINUTE_CHART = "/uapi/domestic-stock/v1/quotations/inquire-time-itemchartprice"

TR_PRICE = "FHKST01010100"  # 주식현재가 시세
TR_DAILY_CHART = "FHKST03010100"  # 국내주식 기간별시세(일/주/월/년)
TR_MINUTE_CHART = "FHKST03010200"  # 주식당일분봉조회

# FID_COND_MRKT_DIV_CODE — J: 주식/ETF/ETN
MARKET_DIV_STOCK = "J"

# 재시도 대상 KIS 오류코드
ERR_TOKEN_EXPIRED = {"EGW00121", "EGW00123"}  # 토큰 만료·유효하지 않음
ERR_RATE_LIMIT = {"EGW00201"}  # 초당 거래건수 초과
ERR_TOKEN_TOO_SOON = "EGW00133"  # 1분 내 재발급 시도


class KisError(Exception):
    """KIS 연동 실패 공통 부모."""


class KisConfigError(KisError):
    """앱키·시크릿이 없거나 잘못된 설정."""


class KisApiError(KisError):
    """KIS 가 rt_cd != "0" 을 돌려준 경우."""

    def __init__(self, code: str, message: str, path: str = ""):
        self.code = code
        self.message = message
        self.path = path
        super().__init__(f"KIS {code}: {message} ({path})")


class KisClient:
    """KIS REST 클라이언트. 인스턴스 하나가 커넥션과 유량 버킷을 함께 쥔다.

    같은 프로세스에서 여러 개를 만들면 유량 버킷이 갈라져 제한을 넘길 수 있다.
    수집 작업 하나당 하나만 만들어 쓴다.
    """

    def __init__(
        self,
        env: str | None = None,
        app_key: str = "",
        app_secret: str = "",
        transport: httpx.BaseTransport | None = None,
    ):
        # transport 는 테스트에서 httpx.MockTransport 를 꽂기 위한 자리다.
        # 실제 KIS 를 부르지 않고 응답 처리(rt_cd 판정·재시도·토큰 갱신)를 검증할 수 있어야 한다.
        self.env = env or settings.KIS_ENV
        self.app_key = app_key or settings.KIS_APP_KEY
        self.app_secret = app_secret or settings.KIS_APP_SECRET
        self.base_url = settings.KIS_REST_BASE

        if not self.app_key or not self.app_secret:
            raise KisConfigError(
                "KIS_APP_KEY / KIS_APP_SECRET 이 비어 있다. backend/.env 에 값을 넣어라. "
                "(apiportal.koreainvestment.com 에서 발급, 모의와 실전은 키가 별개다)"
            )

        self._limiter = RateLimiter(settings.KIS_RATE_LIMIT_PER_SEC)
        self._client = httpx.Client(
            base_url=self.base_url,
            timeout=httpx.Timeout(settings.KIS_HTTP_TIMEOUT, connect=5.0),
            transport=transport,
        )
        self._token_cache: tuple[str, object] | None = None  # (token, expires_at)

    # ── 컨텍스트 매니저 ─────────────────────────────
    def __enter__(self):
        return self

    def __exit__(self, *exc):
        self.close()

    def close(self):
        self._client.close()

    # ── 토큰 ────────────────────────────────────────
    def access_token(self) -> str:
        """유효한 접근토큰. 캐시 → DB → 발급 순으로 찾는다."""
        now = timezone.now()
        margin = timedelta(seconds=settings.KIS_TOKEN_REFRESH_MARGIN_SEC)

        if self._token_cache and self._token_cache[1] - margin > now:
            return self._token_cache[0]

        row = KisToken.objects.filter(env=self.env).first()
        if row and row.expires_at - margin > now:
            self._token_cache = (row.access_token, row.expires_at)
            return row.access_token

        return self._issue_token()

    def _issue_token(self) -> str:
        """새 토큰을 발급받아 DB 에 저장한다.

        `select_for_update` 로 행을 잠그고 잠근 뒤 **한 번 더** 만료를 확인한다.
        두 프로세스가 동시에 만료를 감지하면 둘 다 발급하러 오는데, 뒤에 온 쪽이 락을
        얻었을 때는 앞선 쪽이 이미 새 토큰을 넣어 둔 상태다. 재확인 없이 발급하면
        1분 제한(EGW00133) 에 걸린다.
        """
        now = timezone.now()
        margin = timedelta(seconds=settings.KIS_TOKEN_REFRESH_MARGIN_SEC)

        with transaction.atomic():
            row = KisToken.objects.select_for_update().filter(env=self.env).first()
            if row and row.expires_at - margin > now:
                self._token_cache = (row.access_token, row.expires_at)
                return row.access_token

            self._limiter.acquire()
            resp = self._client.post(
                PATH_TOKEN,
                json={
                    "grant_type": "client_credentials",
                    "appkey": self.app_key,
                    "appsecret": self.app_secret,
                },
                headers={"content-type": "application/json"},
            )
            body = self._json(resp, PATH_TOKEN)

            if "access_token" not in body:
                code = str(body.get("error_code") or body.get("msg_cd") or "?")
                msg = str(body.get("error_description") or body.get("msg1") or body)
                if code == ERR_TOKEN_TOO_SOON and row:
                    # 1분 제한에 걸렸는데 만료 전 토큰이 남아 있으면 그것을 쓴다.
                    # 만료 여유(margin)를 못 지킬 뿐 아직 유효한 토큰이다.
                    logger.warning("KIS 토큰 재발급 제한(%s). 기존 토큰을 계속 쓴다.", code)
                    self._token_cache = (row.access_token, row.expires_at)
                    return row.access_token
                raise KisApiError(code, msg, PATH_TOKEN)

            token = body["access_token"]
            expires_in = int(body.get("expires_in") or 86400)
            expires_at = timezone.now() + timedelta(seconds=expires_in)

            KisToken.objects.update_or_create(
                env=self.env,
                defaults={"access_token": token, "expires_at": expires_at},
            )
            logger.info("KIS 접근토큰 발급 (env=%s, 만료 %s)", self.env, expires_at)
            self._token_cache = (token, expires_at)
            return token

    def approval_key(self) -> str:
        """WebSocket 실시간 시세용 접속키. REST 토큰과 발급 경로·필드명이 다르다.

        (appsecret 이 아니라 `secretkey` 다 — KIS 문서 그대로다.)
        실시간 수집 단계에서 쓴다. 지금은 발급만 되게 해 두고 저장해 둔다.
        """
        row = KisToken.objects.filter(env=self.env).first()
        if row and row.approval_key:
            return row.approval_key

        self._limiter.acquire()
        resp = self._client.post(
            PATH_APPROVAL,
            json={
                "grant_type": "client_credentials",
                "appkey": self.app_key,
                "secretkey": self.app_secret,
            },
            headers={"content-type": "application/json"},
        )
        body = self._json(resp, PATH_APPROVAL)
        key = body.get("approval_key")
        if not key:
            raise KisApiError(
                str(body.get("msg_cd", "?")), str(body.get("msg1", body)), PATH_APPROVAL
            )

        KisToken.objects.filter(env=self.env).update(approval_key=key)
        return key

    # ── 공통 요청 ───────────────────────────────────
    def _get(self, path: str, tr_id: str, params: dict) -> dict:
        """GET 후 `rt_cd` 를 검사해 본문을 돌려준다. 토큰 만료·유량 초과는 재시도한다."""
        attempts = settings.KIS_HTTP_RETRIES + 1
        last_error: Exception | None = None

        for attempt in range(attempts):
            self._limiter.acquire()
            headers = {
                "content-type": "application/json; charset=utf-8",
                "authorization": f"Bearer {self.access_token()}",
                "appkey": self.app_key,
                "appsecret": self.app_secret,
                "tr_id": tr_id,
                "custtype": "P",  # P: 개인
            }
            try:
                resp = self._client.get(path, params=params, headers=headers)
                body = self._json(resp, path)
            except httpx.HTTPError as exc:
                last_error = exc
                logger.warning("KIS 통신 실패 (%s/%s): %s", attempt + 1, attempts, exc)
                self._backoff(attempt)
                continue

            rt_cd = str(body.get("rt_cd", ""))
            if rt_cd == "0":
                return body

            code = str(body.get("msg_cd", "?"))
            msg = str(body.get("msg1", "")).strip()

            if code in ERR_TOKEN_EXPIRED:
                # 서버가 만료라고 하면 우리 계산과 무관하게 만료다. 캐시를 버리고 다시 받는다.
                logger.info("KIS 토큰 만료(%s). 재발급 후 재시도.", code)
                self._token_cache = None
                KisToken.objects.filter(env=self.env).update(expires_at=timezone.now())
                last_error = KisApiError(code, msg, path)
                continue

            if code in ERR_RATE_LIMIT:
                logger.warning("KIS 유량 초과(%s). 백오프 후 재시도.", code)
                last_error = KisApiError(code, msg, path)
                self._backoff(attempt)
                continue

            # 그 밖의 오류는 재시도해도 같은 답이 온다 (없는 종목코드, 잘못된 파라미터 등).
            raise KisApiError(code, msg, path)

        raise last_error or KisError(f"KIS 호출 실패: {path}")

    @staticmethod
    def _json(resp: httpx.Response, path: str) -> dict:
        if resp.status_code >= 400:
            raise KisApiError(f"HTTP{resp.status_code}", resp.text[:300], path)
        try:
            return resp.json()
        except ValueError as exc:
            raise KisApiError("INVALID_JSON", resp.text[:300], path) from exc

    @staticmethod
    def _backoff(attempt: int):
        import time

        time.sleep(min(2 ** attempt, 8) * 0.5)

    # ── 시세 조회 ───────────────────────────────────
    def inquire_price(self, symbol: str) -> dict:
        """주식현재가 시세. `output` dict 를 그대로 돌려준다.

        주요 필드: `stck_prpr`(현재가) `stck_oprc`(시가) `stck_hgpr`(고가) `stck_lwpr`(저가)
        `acml_vol`(누적거래량) `prdy_vrss`(전일대비) `prdy_ctrt`(전일대비율) `hts_kor_isnm`(종목명)
        """
        body = self._get(
            PATH_PRICE,
            TR_PRICE,
            {"FID_COND_MRKT_DIV_CODE": MARKET_DIV_STOCK, "FID_INPUT_ISCD": symbol},
        )
        return body.get("output") or {}

    def inquire_daily_candles(
        self, symbol: str, start: date, end: date, period: str = "D", adjusted: bool = True
    ) -> list[dict]:
        """국내주식 기간별시세. `output2` 배열을 돌려준다.

        KIS 가 한 번에 주는 양은 **100건**이다. 그보다 긴 구간은 호출을 나눠야 한다 —
        나누는 일은 `collector.backfill_daily_candles` 가 한다.

        period: D(일) W(주) M(월) Y(년)
        adjusted: 수정주가 반영 여부. 액면분할·병합이 있던 종목은 이 값에 따라 과거 가격이
                  통째로 달라진다. 기본은 수정주가(True) 로 둔다 — 차트가 튀지 않는다.
        주요 필드: `stck_bsop_date`(영업일자) `stck_oprc` `stck_hgpr` `stck_lwpr` `stck_clpr`
                  `acml_vol`(거래량) `acml_tr_pbmn`(거래대금)
        """
        body = self._get(
            PATH_DAILY_CHART,
            TR_DAILY_CHART,
            {
                "FID_COND_MRKT_DIV_CODE": MARKET_DIV_STOCK,
                "FID_INPUT_ISCD": symbol,
                "FID_INPUT_DATE_1": start.strftime("%Y%m%d"),
                "FID_INPUT_DATE_2": end.strftime("%Y%m%d"),
                "FID_PERIOD_DIV_CODE": period,
                "FID_ORG_ADJ_PRC": "0" if adjusted else "1",
            },
        )
        return body.get("output2") or []

    def inquire_today_minutes(self, symbol: str, hour: str = "") -> list[dict]:
        """주식당일분봉. `hour`(HHMMSS) 기준으로 **거슬러 올라가며 최대 30건**을 준다.

        당일치만 나온다 — 과거 날짜의 분봉은 이 API 로 못 가져온다(별도 API 가 있다).
        하루(390분) 를 채우려면 시각을 옮겨 가며 여러 번 불러야 하고, 그 일은
        `collector.collect_minute_candles` 가 한다.

        주요 필드: `stck_bsop_date`(일자) `stck_cntg_hour`(체결시간 HHMMSS)
                  `stck_oprc` `stck_hgpr` `stck_lwpr` `stck_prpr`(종가) `cntg_vol`(거래량)
        """
        body = self._get(
            PATH_MINUTE_CHART,
            TR_MINUTE_CHART,
            {
                "FID_ETC_CLS_CODE": "",
                "FID_COND_MRKT_DIV_CODE": MARKET_DIV_STOCK,
                "FID_INPUT_ISCD": symbol,
                "FID_INPUT_HOUR_1": hour or timezone.localtime().strftime("%H%M%S"),
                "FID_PW_DATA_INCU_YN": "N",
            },
        )
        return body.get("output2") or []
