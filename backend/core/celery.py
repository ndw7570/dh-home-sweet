"""Celery 앱 정의 — 배치 태스크(봉 집계·리페어·성과 계산)의 진입점.

Celery Beat 로 예약된 태스크는 여기서 발견된 앱만 실행할 수 있다.
`autodiscover_tasks()` 가 각 Django 앱의 `tasks.py` 를 찾아 등록한다.

이 파일 자체가 아니라 `core/__init__.py` 에서 `celery_app` 을 임포트해야
`manage.py` / `celery -A core` 명령이 앱을 찾을 수 있다.
"""

import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")

app = Celery("core")

# CELERY_* 접두어가 붙은 Django 설정을 모두 Celery 설정으로 흡수한다.
# 예: CELERY_BROKER_URL, CELERY_TIMEZONE ...
app.config_from_object("django.conf:settings", namespace="CELERY")

# 각 앱의 tasks.py 를 자동 발견.
app.autodiscover_tasks()
