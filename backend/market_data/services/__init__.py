"""시세 수집 서비스 계층.

여기 있는 함수들은 **Celery 도 Redis 도 없이 그냥 호출된다.** 태스크(`market_data/tasks.py`)
와 커맨드(`market_data/management/commands/`) 는 이 함수들을 부르는 얇은 껍데기다.

그렇게 나눈 이유: 수집이 도는지 확인하려고 브로커·워커·비트를 먼저 띄워야 한다면
문제가 어디서 났는지 알 수 없다. `python manage.py kis_fetch_price` 한 줄로 실제 API 를
때려 보고, 그게 되고 나서 스케줄러에 얹는다.
"""
