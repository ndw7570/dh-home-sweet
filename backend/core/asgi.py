"""ASGI 진입점.

Channels 를 붙여 http + websocket 두 프로토콜을 하나의 애플리케이션에서 처리한다.
- http     : 기존 Django REST 응답 그대로
- websocket: `market_data` 앱의 시세 스트리밍 (phase 5 에서 라우터 채움)

daphne 가 이 application 을 실행한다 — `docker-compose.yml` 의 backend 서비스 command 참조.
"""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

# Django ASGI 는 먼저 준비 — Channels 임포트 시점에 앱 레지스트리가 필요하다.
django_asgi_app = get_asgi_application()

from channels.routing import ProtocolTypeRouter, URLRouter  # noqa: E402

# phase 5 에서 `market_data.routing.websocket_urlpatterns` 로 대체될 자리.
# 지금은 빈 URLRouter — 웹소켓 요청이 오면 404 상당의 응답이 나간다.
websocket_urlpatterns: list = []

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": URLRouter(websocket_urlpatterns),
    }
)
