"""KIS WebSocket 수집기 진입점.

이 명령은 반드시 별도 프로세스로 실행한다 — web/worker 프로세스 안에서 돌리면
재시작·오토스케일 시 중복 구독이 나서 데이터가 이중 저장되거나 KIS 세션이 끊긴다
(`docker-compose.yml` 의 collector 서비스, docs/kis-stack-plan.md phase 3).

**아직 placeholder 다.** REST 수집은 이 프로세스를 거치지 않는다 — `kis_fetch_price` ·
`kis_backfill_daily` · `kis_fetch_minutes` 커맨드와 Celery Beat 가 담당한다.
여기는 WebSocket 실시간(체결·호가) 전용 자리로 남겨 둔다. 붙일 때 필요한 접속키는
`KisClient.approval_key()` 로 이미 받을 수 있다.
"""

import time

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "KIS WebSocket 시세 수집기 (실시간 단계에서 구현). REST 수집은 kis_* 커맨드를 쓴다."

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.WARNING(
                "run_kis_collector: 아직 placeholder 다. "
                "REST 수집은 kis_fetch_price / kis_backfill_daily / kis_fetch_minutes 를 쓴다. "
                "여기는 WebSocket 실시간 전용 자리이며, 지금은 컨테이너가 죽지 않도록 heartbeat 만 남긴다."
            )
        )
        # 컨테이너가 즉시 exit 되지 않도록 heartbeat 만 남긴다.
        # (docker-compose 에서 profiles: [collector] 로 두었으니 기본 up 에는 뜨지 않음.)
        while True:
            self.stdout.write("run_kis_collector: heartbeat")
            time.sleep(5)
