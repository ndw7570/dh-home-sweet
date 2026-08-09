from django.apps import AppConfig


class AssetPlanningConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "asset_planning"

    def ready(self):
        """앱 로드 시 초기화 동작 (signals 등)."""
        try:
            import asset_planning.signals  # noqa: F401
        except ImportError:
            pass
