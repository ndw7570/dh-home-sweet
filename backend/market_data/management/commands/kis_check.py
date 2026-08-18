"""KIS 연결 진단.

가장 먼저 돌려 볼 커맨드다. 설정 → 토큰 발급 → 실제 시세 조회 순으로 한 단계씩 짚어서
"어디까지는 되고 어디서 막혔는지" 를 알려 준다. 키를 넣고 나서 이걸 통과하면 나머지
수집 커맨드는 전부 같은 경로를 탄다.

    python manage.py kis_check
    python manage.py kis_check --symbol 005930
"""

from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from market_data.models import KisToken
from market_data.services.kis_client import KisClient, KisConfigError, KisError


class Command(BaseCommand):
    help = "KIS 오픈API 연결을 단계별로 진단한다 (설정 → 토큰 → 시세 조회)."

    def add_arguments(self, parser):
        parser.add_argument("--symbol", default="005930", help="시세 조회 테스트 종목 (기본 삼성전자)")

    def handle(self, *args, **options):
        ok = self.style.SUCCESS
        bad = self.style.ERROR

        # 1) 설정
        self.stdout.write("1) 설정 확인")
        self.stdout.write(f"   KIS_ENV        : {settings.KIS_ENV}")
        self.stdout.write(f"   REST base      : {settings.KIS_REST_BASE}")
        self.stdout.write(f"   유량 제한      : {settings.KIS_RATE_LIMIT_PER_SEC}/초")
        key = settings.KIS_APP_KEY
        secret = settings.KIS_APP_SECRET
        if not key or not secret:
            self.stdout.write(bad("   앱키/시크릿    : 없음"))
            self.stdout.write(
                bad(
                    "\n   backend/.env 에 KIS_APP_KEY 와 KIS_APP_SECRET 을 넣어라.\n"
                    "   apiportal.koreainvestment.com 에서 발급하고, 모의(paper)와 실전(live)은 키가 별개다."
                )
            )
            return
        # 키 자체는 찍지 않는다. 길이와 앞 4글자면 "다른 키를 넣었다" 를 판별하기에 충분하다.
        self.stdout.write(ok(f"   앱키           : {key[:4]}… (길이 {len(key)})"))
        self.stdout.write(ok(f"   시크릿         : 설정됨 (길이 {len(secret)})"))

        # 2) 토큰
        self.stdout.write("\n2) 접근토큰 발급")
        try:
            client = KisClient()
        except KisConfigError as exc:
            self.stdout.write(bad(f"   실패: {exc}"))
            return

        with client:
            try:
                token = client.access_token()
            except KisError as exc:
                self.stdout.write(bad(f"   실패: {exc}"))
                self.stdout.write(
                    bad(
                        "   앱키/시크릿이 이 환경(KIS_ENV)에 맞는 것인지 확인하라. "
                        "모의 키로 실전 도메인을 부르면 여기서 막힌다."
                    )
                )
                return

            row = KisToken.objects.filter(env=settings.KIS_ENV).first()
            left = (row.expires_at - timezone.now()) if row else None
            self.stdout.write(ok(f"   토큰           : {token[:12]}… (길이 {len(token)})"))
            if left:
                self.stdout.write(ok(f"   만료까지       : {left.total_seconds() / 3600:.1f}시간"))

            # 3) 시세 조회
            code = options["symbol"]
            self.stdout.write(f"\n3) 현재가 조회 ({code})")
            try:
                output = client.inquire_price(code)
            except KisError as exc:
                self.stdout.write(bad(f"   실패: {exc}"))
                return

            if not output:
                self.stdout.write(bad("   응답 output 이 비었다. 종목코드를 확인하라."))
                return

            name = output.get("hts_kor_isnm", "?")
            price = output.get("stck_prpr", "?")
            volume = output.get("acml_vol", "?")
            change = output.get("prdy_ctrt", "?")
            self.stdout.write(ok(f"   {name} ({code})"))
            self.stdout.write(ok(f"   현재가 {price} / 전일대비 {change}% / 거래량 {volume}"))

        self.stdout.write(ok("\n연결 정상. 이제 kis_sync_symbols → kis_backfill_daily 순으로 수집하면 된다."))
