"""현재가를 조회해 수집 종목과 규율 앱 현재주가에 반영한다.

    python manage.py kis_fetch_price
    python manage.py kis_fetch_price --symbols 005930,000660

`securities.current_price` 도 함께 갱신된다. 스위치는 없다 — 켜고 끌 수 있으면
화면에 뜬 주가가 실제 시세인지 누가 언제 적어 둔 값인지 알 수 없어진다.
"""

from market_data.management.commands._kis_base import KisCommand
from market_data.services.collector import update_current_prices
from market_data.services.kis_client import KisClient, KisConfigError


class Command(KisCommand):
    help = "KIS 현재가를 조회해 market_symbols 와 securities.current_price 에 반영한다."

    def handle(self, *args, **options):
        symbols = self.pick_symbols(options)
        try:
            client = KisClient()
        except KisConfigError as exc:
            self.handle_config_error(exc)

        with client:
            result = update_current_prices(client, symbols)

        for sym in symbols:
            sym.refresh_from_db()
            price = f"{sym.last_price:,.0f}" if sym.last_price is not None else "실패"
            self.stdout.write(f"  {sym.symbol} {sym.name:<12} {price}")

        style = self.style.SUCCESS if not result.errors else self.style.WARNING
        self.stdout.write(style(f"\n현재가 갱신: {result}"))
        for err in result.errors:
            self.stdout.write(self.style.ERROR(f"  {err}"))
