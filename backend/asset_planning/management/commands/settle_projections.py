"""
지난 예상에 실제값을 붙여 닫는다.

    python manage.py settle_projections [--as-of 2026-08-01] [--dry-run]

target_date 가 지났는데 아직 is_settled=False 인 ProjectionSnapshot 을 찾아
같은 날짜의 AssetSnapshot 과 대조하고 gap 을 채운다.

이 배치가 안 돌면 홈의 '예상 적중률'이 영원히 비어 있다.
매일 새벽 1회 (cron / Celery beat) 실행을 전제로 한다.
"""
from datetime import date

from django.core.management.base import BaseCommand

from asset_planning.services import projection_service


class Command(BaseCommand):
    help = "target_date 가 지난 ProjectionSnapshot 에 실제값을 채우고 닫는다."

    def add_arguments(self, parser):
        parser.add_argument(
            "--as-of",
            type=date.fromisoformat,
            default=None,
            help="기준일 (기본: 오늘). 과거 소급 정산에 사용.",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="대상 건수만 세고 쓰지 않는다.",
        )

    def handle(self, *args, **options):
        as_of = options["as_of"] or date.today()

        if options["dry_run"]:
            self.stdout.write(f"[dry-run] {as_of} 기준 정산 대상 조회만 수행")
            # TODO(DDL): ProjectionSnapshot.objects.filter(
            #     target_date__lte=as_of, is_settled=False).count()
            return

        settled = projection_service.settle_due_projections(as_of)
        self.stdout.write(self.style.SUCCESS(f"{as_of} 기준 {settled}건 정산 완료"))
