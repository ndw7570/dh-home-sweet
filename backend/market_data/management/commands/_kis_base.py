"""KIS 커맨드 공통 뼈대.

파일명이 `_` 로 시작해서 Django 가 커맨드로 잡지 않는다(`get_commands()` 는 `_` 로
시작하는 모듈을 건너뛴다). 공통 인자와 종목 선택 로직만 여기에 둔다.
"""

from django.core.management.base import BaseCommand, CommandError

from market_data.services.collector import collection_targets
from market_data.services.kis_client import KisConfigError


class KisCommand(BaseCommand):
    """`--symbols` 로 대상을 좁히고, 설정 오류를 사람이 읽는 문장으로 바꿔 주는 베이스."""

    def add_arguments(self, parser):
        parser.add_argument(
            "--symbols",
            default="",
            help="종목코드 쉼표 구분 (예: 005930,000660). 생략하면 관리대상 종목 전체.",
        )

    def pick_symbols(self, options):
        codes = [c.strip() for c in (options.get("symbols") or "").split(",") if c.strip()]
        symbols = collection_targets(codes or None)
        if not symbols:
            raise CommandError(
                "수집할 종목이 없다. 화면에서 종목을 등록하고 '관리대상' 을 켜라. "
                "(수집 대상은 securities 중 is_active=True 인 종목이다)"
                if not codes
                else (
                    f"요청한 종목이 관리대상이 아니다: {', '.join(codes)}. "
                    "화면에서 해당 종목의 '관리대상' 을 켜라."
                )
            )
        return symbols

    def handle_config_error(self, exc: KisConfigError):
        raise CommandError(str(exc))
