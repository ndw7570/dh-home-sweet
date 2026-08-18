"""KIS 호출 유량 제한 — 토큰 버킷.

KIS 는 초당 호출 수를 제한하고, 넘기면 `EGW00201`(초당 거래건수 초과) 을 돌려준다.
모의투자는 실전보다 한참 빡빡해서(기본 2 TPS) 일봉 backfill 처럼 연속 호출하는 작업은
반드시 여기를 거쳐야 한다.

**프로세스 안에서만 동작한다.** Redis 로 여러 프로세스가 버킷을 공유하는 형태로 만들 수도
있지만, 그러면 Redis 가 죽었을 때 수집도 같이 죽는다. 지금은 수집을 도는 프로세스가
하나(커맨드 또는 워커 한 대)라서 프로세스 안에서 막는 것으로 충분하다. 수집 프로세스를
여럿으로 늘리는 시점에 공유 버킷으로 바꾼다 — 그때는 `acquire()` 구현만 갈아 끼우면 된다.
"""

import threading
import time


class RateLimiter:
    """초당 `per_sec` 회까지 허용. 넘으면 다음 슬롯이 열릴 때까지 잠든다."""

    def __init__(self, per_sec: int):
        if per_sec < 1:
            raise ValueError("per_sec 는 1 이상이어야 한다.")
        self._min_interval = 1.0 / per_sec
        self._lock = threading.Lock()
        self._next_at = 0.0

    def acquire(self) -> float:
        """호출 슬롯을 얻는다. 기다린 시간(초) 을 돌려준다 — 로그·계측용."""
        with self._lock:
            now = time.monotonic()
            wait = self._next_at - now
            if wait > 0:
                time.sleep(wait)
                self._next_at += self._min_interval
                return wait
            self._next_at = now + self._min_interval
            return 0.0
