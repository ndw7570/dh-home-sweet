from django.apps import AppConfig


class MarketTradingConfig(AppConfig):
    """실시간 주문 발행 · 리스크 매니저 · Kill switch · 감사 로그.

    데이터 수집(`market_data`)과 반드시 프로세스·책임을 분리한다. 시세 파이프라인 장애가
    주문 시스템으로 번지면 안 된다. 자세한 안전장치 목록은 docs/kis-stack-plan.md phase 6.

    기존 `trading_discipline.services.execution_service` 와 역할이 다르다:
    - execution_service = 계획 vs 실체결 사후 대조 (관측)
    - market_trading    = 실체결 발행 (실행)
    """

    default_auto_field = "django.db.models.AutoField"
    name = "market_trading"
    verbose_name = "실주문"
