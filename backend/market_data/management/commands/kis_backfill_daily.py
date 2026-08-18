"""일봉을 수집한다. 과거 데이터를 채우는 것이 주 용도다.

    python manage.py kis_backfill_daily                     # 최근 100일, 수집 대상 전체
    python manage.py kis_backfill_daily --days 365
    python manage.py kis_backfill_daily --symbols 005930 --from 2024-01-01 --to 2024-12-31

장 마감 후에도, 휴장일에도 돌아간다 — 실시간이 아니라 확정된 과거 시세라서다.
그래서 "연동이 실제로 되는지" 를 아무 때나 확인할 수 있는 커맨드이기도 하다.
"""

from datetime import datetime, timedelta

from django.core.management.base import CommandError
from django.utils import timezone

from market_data.management.commands._kis_base import KisCommand
from market_data.services.collector import backfill_daily_candles
from market_data.services.kis_client import KisClient, KisConfigError


class Command(KisCommand):
    help = "KIS 일봉을 수집해 market_daily_candles 에 upsert 한다."

    def add_arguments(self, parser):
        super().add_arguments(parser)
        parser.add_argument("--days", type=int, default=100, help="오늘부터 거슬러 며칠 (기본 100)")
        parser.add_argument("--from", dest="date_from", default="", help="시작일 YYYY-MM-DD")
        parser.add_argument("--to", dest="date_to", default="", help="종료일 YYYY-MM-DD")
        parser.add_argument(
            "--raw-price",
            action="store_true",
            help="수정주가 대신 원주가로 받는다 (액면분할 이력이 있으면 과거 가격이 달라진다).",
        )

    def handle(self, *args, **options):
        end = self._parse_date(options["date_to"]) or timezone.localdate()
        start = self._parse_date(options["date_from"]) or end - timedelta(days=options["days"] - 1)
        if start > end:
            raise CommandError(f"시작일({start})이 종료일({end})보다 늦다.")

        symbols = self.pick_symbols(options)
        try:
            client = KisClient()
        except KisConfigError as exc:
            self.handle_config_error(exc)

        self.stdout.write(f"일봉 수집 {start} ~ {end} / 종목 {len(symbols)}건")
        total_created = total_updated = 0
        errors: list[str] = []

        with client:
            for sym in symbols:
                result = backfill_daily_candles(
                    client, sym, start, end, adjusted=not options["raw_price"]
                )
                total_created += result.created
                total_updated += result.updated
                errors.extend(result.errors)
                self.stdout.write(f"  {sym.symbol} {sym.name:<12} {result}")

        style = self.style.SUCCESS if not errors else self.style.WARNING
        self.stdout.write(style(f"\n합계 : 신규 {total_created} / 갱신 {total_updated}"))
        for err in errors:
            self.stdout.write(self.style.ERROR(f"  {err}"))

    @staticmethod
    def _parse_date(raw: str):
        if not raw:
            return None
        try:
            return datetime.strptime(raw.strip(), "%Y-%m-%d").date()
        except ValueError as exc:
            raise CommandError(f"날짜 형식은 YYYY-MM-DD 여야 한다: {raw!r}") from exc
