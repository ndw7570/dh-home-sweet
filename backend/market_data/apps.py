from django.apps import AppConfig


class MarketDataConfig(AppConfig):
    """실시간 시세 수집 · 봉 생성 · 종목 마스터.

    KIS WebSocket 을 별도 프로세스로 돌리고(`manage.py run_kis_collector`), tick 을
    Redis Streams 에 얹은 뒤 Celery 워커가 봉으로 집계한다. 자세한 phase 순서는
    docs/kis-stack-plan.md 참조.
    """

    default_auto_field = "django.db.models.AutoField"
    name = "market_data"
    verbose_name = "시세 데이터"
