"""당일 분봉을 수집한다.

    python manage.py kis_fetch_minutes
    python manage.py kis_fetch_minutes --symbols 005930 --until 153000

KIS 당일분봉 API 는 **당일치만** 준다. 어제 분봉은 이 커맨드로 못 가져온다 — 장중에
주기적으로 돌려서 쌓아야 하고, 그래서 Celery Beat 스케줄에 얹는 대상이다.
장 시작 전이나 휴장일에 돌리면 빈 응답이 정상이다(0건으로 보고하고 끝난다).
"""

from market_data.management.commands._kis_base import KisCommand
from market_data.services.collector import collect_minute_candles
from market_data.services.kis_client import KisClient, KisConfigError


class Command(KisCommand):
    help = "KIS 당일 분봉을 수집해 market_minute_candles 에 upsert 한다."

    def add_arguments(self, parser):
        super().add_arguments(parser)
        parser.add_argument(
            "--until",
            default="",
            help="기준 시각 HHMMSS. 여기서 장 시작까지 거슬러 올라간다. 생략하면 지금 시각.",
        )

    def handle(self, *args, **options):
        symbols = self.pick_symbols(options)
        try:
            client = KisClient()
        except KisConfigError as exc:
            self.handle_config_error(exc)

        total_created = total_updated = 0
        errors: list[str] = []

        with client:
            for sym in symbols:
                result = collect_minute_candles(client, sym, until=options["until"])
                total_created += result.created
                total_updated += result.updated
                errors.extend(result.errors)
                self.stdout.write(f"  {sym.symbol} {sym.name:<12} {result}")

        style = self.style.SUCCESS if not errors else self.style.WARNING
        self.stdout.write(style(f"\n합계 : 신규 {total_created} / 갱신 {total_updated}"))
        for err in errors:
            self.stdout.write(self.style.ERROR(f"  {err}"))
