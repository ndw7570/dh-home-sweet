# Celery 앱을 프로세스 시작 시 로드해 두어야 `@shared_task` 데코레이터가 이 앱에 붙는다.
# 여기서 안 임포트하면 워커·beat 는 뜨는데 태스크가 발견되지 않는 조용한 실패로 이어진다.
from core.celery import app as celery_app

__all__ = ("celery_app",)
