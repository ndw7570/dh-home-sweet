"""현재가를 조회해 수집 종목에 반영한다.

    python manage.py kis_fetch_price
    python manage.py kis_fetch_price --symbols 005930,000660
    python manage.py kis_fetch_price --update-securities   # 규율 앱 securities.current_price 까지 갱신

`--update-securities` 는 기본이 꺼져 있다. `securities.current_price` 는 지금까지 사람이
입력해 온 값이라, 자동으로 덮어쓰는 것은 명시적으로 선택해야 하는 동작이다.
"""

from market_data.management.commands._kis_base import KisCommand
from market_data.services.collector import update_current_prices
from market_data.services.kis_client import KisClient, KisConfigError


class Command(KisCommand):
    help = "KIS 현재가를 조회해 market_symbols 에 반영한다."

    def add_arguments(self, parser):
        super().add_arguments(parser)
        parser.add_argument(
            "--update-securities",
            action="store_true",
            help="규율 앱 securities.current_price 도 같은 값으로 갱신한다 (사람이 입력한 값을 덮는다).",
        )

    def handle(self, *args, **options):
        symbols = self.pick_symbols(options)
        try:
            client = KisClient()
        except KisConfigError as exc:
            self.handle_config_error(exc)

        with client:
            result = update_current_prices(
                client, symbols, update_securities=options["update_securities"]
            )

        for sym in symbols:
            sym.refresh_from_db()
            price = f"{sym.last_price:,.0f}" if sym.last_price is not None else "실패"
            self.stdout.write(f"  {sym.symbol} {sym.name:<12} {price}")

        style = self.style.SUCCESS if not result.errors else self.style.WARNING
        self.stdout.write(style(f"\n현재가 갱신: {result}"))
        for err in result.errors:
            self.stdout.write(self.style.ERROR(f"  {err}"))
