"""
주기가 끝난 계획에 대해 회고를 READY 상태로 미리 만들어 둔다.

    python manage.py open_reviews [--as-of 2026-08-01] [--user-id kakao_123]

회고는 사용자가 찾아 들어가는 화면이 아니라 '주기 마감'이라는 이벤트다.
이 배치가 Review 를 먼저 만들어 두고 계획값/실적값/차이까지 채워 놓아야,
사용자는 빈 화면 대신 원인과 조정 두 칸만 채우면 된다.

월 단위 계획이면 매월 1일, 분기 단위면 분기 첫날 실행을 전제로 한다.
"""
from datetime import date, timedelta

from django.core.management.base import BaseCommand

from asset_planning.services import review_service


class Command(BaseCommand):
    help = "마감된 주기에 대해 Review 를 READY 상태로 생성한다."

    def add_arguments(self, parser):
        parser.add_argument("--as-of", type=date.fromisoformat, default=None)
        parser.add_argument("--user-id", type=str, default=None, help="특정 유저만 처리")

    def handle(self, *args, **options):
        as_of = options["as_of"] or date.today()
        # 직전 주기를 대상으로 한다 — 오늘이 8/1이면 7월분 회고를 연다.
        closed = as_of - timedelta(days=1)

        # TODO(DDL): Plan.objects.filter(status="ACTIVE") 순회.
        #            user_id 옵션이 있으면 filter(user_id=...) 추가.
        targets = []

        created = 0
        for plan in targets:
            result = review_service.open_review_for_period(
                plan.user_id, plan.plan_id, plan.period_type, closed
            )
            if result:
                created += 1
                self.stdout.write(
                    f"  plan#{plan.plan_id} {result['period_start']}~{result['period_end']}"
                )

        self.stdout.write(self.style.SUCCESS(f"{closed} 마감분 회고 {created}건 생성"))
