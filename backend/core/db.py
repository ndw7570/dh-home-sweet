"""db_table 이름을 한 곳에서 만든다.

investments-nam.sql 의 모든 테이블은 `trading_discipline_management` 스키마에 있다.
Postgres 에서는 스키마를 명시해야 하므로 `'"schema"."table"'` 형태가 필요한데,
이 문자열을 22개 모델에 하드코딩해 두면 스키마명을 바꿀 때 전부 손대야 하고
SQLite 로는 아예 뜨지도 않는다(스키마 개념이 없어서 테이블명에 점이 박힌다).

그래서 모델은 전부 `db_table = table("orders")` 로 쓰고, 실제 문자열은 여기서 만든다.
- Postgres : '"trading_discipline_management"."orders"'
- SQLite   : 'trading_discipline_management_orders'   (화면 확인용 로컬 실행)
"""

from django.conf import settings

DEFAULT_SCHEMA = "trading_discipline_management"


def schema_name() -> str:
    return getattr(settings, "DB_SCHEMA", DEFAULT_SCHEMA)


def table(name: str) -> str:
    """스키마가 붙은 db_table 문자열."""
    schema = schema_name()
    if getattr(settings, "DB_SUPPORTS_SCHEMA", True):
        return f'"{schema}"."{name}"'
    return f"{schema}_{name}"
