"""KIS WebSocket 수집기 진입점.

이 명령은 반드시 별도 프로세스로 실행한다 — web/worker 프로세스 안에서 돌리면
재시작·오토스케일 시 중복 구독이 나서 데이터가 이중 저장되거나 KIS 세션이 끊긴다
(`docker-compose.yml` 의 collector 서비스, docs/kis-stack-plan.md phase 3).

phase 1 시점에는 자리만 잡아 둔다 — 실제 KIS 연결·재접속·구독 관리는 phase 3 에서
`market_data/services/kis_client.py` 에 채워 넣는다.
"""

import time

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "KIS WebSocket 시세 수집기 (phase 3 에서 실제 구현)."

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.WARNING(
                "run_kis_collector: phase 1 placeholder. "
                "실제 KIS 연동은 phase 3 에서 구현. "
                "지금은 5초 간격 heartbeat 로그만 남긴다 — 컨테이너가 죽지 않도록."
            )
        )
        # 컨테이너가 즉시 exit 되지 않도록 heartbeat 만 남긴다.
        # (docker-compose 에서 profiles: [collector] 로 두었으니 기본 up 에는 뜨지 않음.)
        while True:
            self.stdout.write("run_kis_collector: heartbeat")
            time.sleep(5)
