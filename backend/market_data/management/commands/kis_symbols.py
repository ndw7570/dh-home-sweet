"""수집 대상 종목을 확인한다.

    python manage.py kis_symbols

**종목을 여기서 추가하거나 끄지 않는다.** 수집 대상은 화면에서 정한다:

    수집 대상 = securities 중 '관리대상'(is_active) 이 켜져 있고 삭제되지 않은 종목

이 커맨드는 그 결과를 보여 주고, 봉이 매달릴 `Symbol` 행이 없으면 만들어 둘 뿐이다.
화면에서 종목을 켜고 껐을 때 수집이 어떻게 바뀌는지 확인하는 용도다.
"""

from django.core.management.base import BaseCommand

from market_data.models import DailyCandle, MinuteCandle, Symbol
from market_data.services.collector import collection_targets


class Command(BaseCommand):
    help = "수집 대상 종목을 출력한다 (대상은 화면의 '관리대상' 체크가 정한다)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--all",
            action="store_true",
            help="수집 대상에서 빠진 종목(과거에 수집했던 것 포함) 까지 전부 보여 준다.",
        )

    def handle(self, *args, **options):
        targets = collection_targets()
        target_ids = {s.id for s in targets}

        self.stdout.write(f"수집 대상 {len(targets)}건 (securities 의 '관리대상' 체크가 기준)\n")
        for sym in sorted(targets, key=lambda s: s.symbol):
            self.stdout.write(f"  [O] {self._line(sym)}")

        if not targets:
            self.stdout.write(
                self.style.WARNING("  (없음) 화면에서 종목을 등록하고 '관리대상' 을 켜라.")
            )

        if options["all"]:
            others = [s for s in Symbol.all_objects.all() if s.id not in target_ids]
            if others:
                self.stdout.write(f"\n대상에서 빠진 종목 {len(others)}건 (쌓인 봉은 그대로 남아 있다)")
                for sym in sorted(others, key=lambda s: s.symbol):
                    self.stdout.write(f"  [-] {self._line(sym)}")

    def _line(self, sym: Symbol) -> str:
        price = f"{sym.last_price:,.0f}" if sym.last_price is not None else "미조회"
        daily = DailyCandle.objects.filter(symbol=sym).count()
        minute = MinuteCandle.objects.filter(symbol=sym).count()
        return f"{sym.symbol} {sym.name:<12} 최종가 {price:>12}  일봉 {daily:>5}  분봉 {minute:>6}"
