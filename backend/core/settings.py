"""Django settings — 주식 규율 관리(trading discipline management).

DB 는 기본이 Postgres 다. investments-nam.sql 의 스키마·JSONB 를 그대로 쓰기 때문이다.
화면만 빠르게 보고 싶으면 `DB_ENGINE=sqlite` 로 띄운다 (스키마는 테이블명 접두어로 접힌다).
"""

import os
from datetime import timedelta
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / ".env")


def _bool(key: str, default: bool) -> bool:
    return os.getenv(key, str(default)).strip().lower() in ("1", "true", "yes", "on")


def _list(key: str, default: str) -> list[str]:
    return [v.strip() for v in os.getenv(key, default).split(",") if v.strip()]


# ─────────────────────────────────────────────
#  기본
# ─────────────────────────────────────────────
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "dev-only-insecure-key-change-me")
DEBUG = _bool("DJANGO_DEBUG", True)
ALLOWED_HOSTS = _list("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1,0.0.0.0")

INSTALLED_APPS = [
    # daphne 는 django.contrib.staticfiles 보다 위에 있어야 runserver 를 ASGI 로 교체한다.
    "daphne",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # 3rd party
    "rest_framework",
    "corsheaders",
    "drf_spectacular",
    "channels",
    "django_celery_beat",
    # local
    "users.apps.UsersConfig",
    "trading_discipline.apps.TradingDisciplineConfig",
    "market_data.apps.MarketDataConfig",
    "market_trading.apps.MarketTradingConfig",
]

# Channels 를 껴서 ASGI 로 서브함. daphne 가 실제 서버.
ASGI_APPLICATION = "core.asgi.application"

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "core.urls"
WSGI_APPLICATION = "core.wsgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# ─────────────────────────────────────────────
#  DB — 스키마 정책
# ─────────────────────────────────────────────
DB_SCHEMA = os.getenv("DB_SCHEMA", "trading_discipline_management")
DB_ENGINE = os.getenv("DB_ENGINE", "postgres").strip().lower()

if DB_ENGINE == "sqlite":
    # 스키마가 없으므로 core.db.table() 이 접두어 형태로 접는다.
    DB_SUPPORTS_SCHEMA = False
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }
else:
    DB_SUPPORTS_SCHEMA = True
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": os.getenv("DB_NAME", "trading_discipline"),
            "USER": os.getenv("DB_USER", "postgres"),
            "PASSWORD": os.getenv("DB_PASSWORD", "postgres"),
            "HOST": os.getenv("DB_HOST", "127.0.0.1"),
            "PORT": os.getenv("DB_PORT", "5432"),
            "OPTIONS": {
                # 스키마를 search_path 에 올려 두면 raw SQL 도 편해진다.
                "options": f"-c search_path={DB_SCHEMA},public",
            },
        }
    }

DEFAULT_AUTO_FIELD = "django.db.models.AutoField"

# ─────────────────────────────────────────────
#  인증
# ─────────────────────────────────────────────
AUTH_USER_MODEL = "users.UserProfile"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=12),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=14),
    "ROTATE_REFRESH_TOKENS": True,
    # UserProfile 의 PK 가 user_id(문자열)라 기본값(id)을 쓰면 토큰 발급이 깨진다.
    "USER_ID_FIELD": "user_id",
    "USER_ID_CLAIM": "user_id",
}

# ─────────────────────────────────────────────
#  DRF
# ─────────────────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.AllowAny" if DEBUG
        else "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_PAGINATION_CLASS": "core.pagination.CommonPageNumberPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "EXCEPTION_HANDLER": "core.views.response.common_exception_handler",
}

SPECTACULAR_SETTINGS = {
    "TITLE": "주식 규율 관리 API",
    "DESCRIPTION": "계획(연→분기→월→주→일) · 원칙 · 이행 · 성과 · AI 피드백",
    "VERSION": "0.1.0",
    "SERVE_INCLUDE_SCHEMA": False,
    # 같은 컬럼명(status, direction, ...)이 여러 모델에서 서로 다른 코드셋을 쓴다.
    # 이름을 못박아 두지 않으면 스키마에 StatusB9dEnum 같은 해시 이름이 생긴다.
    "ENUM_NAME_OVERRIDES": {
        "PlanStatusEnum": "trading_discipline.constants.choices.PlanStatus.choices",
        "RunStatusEnum": "trading_discipline.constants.choices.RunStatus.choices",
        "InvestmentDirectionEnum": (
            "trading_discipline.constants.choices.InvestmentDirection.choices"
        ),
        "MarketTrendEnum": "trading_discipline.constants.choices.MarketTrend.choices",
        "MarketEnum": "trading_discipline.constants.choices.Market.choices",
        "ScenarioPlanningEnum": "trading_discipline.constants.choices.ScenarioPlanning.choices",
        "StrategyTypeEnum": "trading_discipline.constants.choices.StrategyType.choices",
        "PrincipleTypeEnum": "trading_discipline.constants.choices.PrincipleType.choices",
        "SourceTypeEnum": "trading_discipline.constants.choices.SourceType.choices",
        "FactorTypeEnum": "trading_discipline.constants.choices.FactorType.choices",
        "OpinionTypeEnum": "trading_discipline.constants.choices.OpinionType.choices",
        "ValuationTypeEnum": "trading_discipline.constants.choices.ValuationType.choices",
        "PeriodTypeEnum": "trading_discipline.constants.choices.PeriodType.choices",
        "ActionTypeEnum": "trading_discipline.constants.choices.ActionType.choices",
        "OrderTypeEnum": "trading_discipline.constants.choices.OrderType.choices",
        "OrderSideEnum": "trading_discipline.constants.choices.OrderSide.choices",
        "AssetTypeEnum": "trading_discipline.constants.choices.AssetType.choices",
        "CurrencyEnum": "trading_discipline.constants.choices.Currency.choices",
    },
}

# 화이트리스트에 없는 쿼리 파라미터가 오면 400. 오타 난 필터가 조용히 무시되면
# "필터가 걸린 줄 알았는데 전체 목록"이라는 최악의 오해가 생긴다.
STRICT_QUERY_PARAMS = _bool("STRICT_QUERY_PARAMS", True)

# ─────────────────────────────────────────────
#  CORS — 프론트 dev 서버
# ─────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = _list(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:9070,http://127.0.0.1:9070",
)
CORS_ALLOW_CREDENTIALS = False

# ─────────────────────────────────────────────
#  i18n / static
# ─────────────────────────────────────────────
LANGUAGE_CODE = "ko-kr"
TIME_ZONE = os.getenv("TIME_ZONE", "Asia/Seoul")
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# ─────────────────────────────────────────────
#  Celery — 배치 · 봉 집계 · 리페어 (docs/kis-stack-plan.md 참조)
# ─────────────────────────────────────────────
# 브로커·결과 저장소 모두 같은 Redis 인스턴스. 프로덕션에서 부하가 커지면 분리.
REDIS_URL = os.getenv("REDIS_URL", "redis://127.0.0.1:6379/0")
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", REDIS_URL)
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", REDIS_URL)
CELERY_TIMEZONE = TIME_ZONE
# Beat 를 DB scheduler 로 두면 관리자 화면(django_celery_beat)에서 스케줄을 조정할 수 있다.
CELERY_BEAT_SCHEDULER = "django_celery_beat.schedulers:DatabaseScheduler"
# 태스크 실패 시 자동 재시도 정책은 태스크별로 결정. 여기서는 직렬화만 못박아 둔다.
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_ACCEPT_CONTENT = ["json"]
# 실시간 시세는 즉시성이 중요하므로 워커 prefetch 를 낮춰 rebalance 지연을 줄인다.
CELERY_WORKER_PREFETCH_MULTIPLIER = 1

# 시세 수집 스케줄. DatabaseScheduler 가 기동 시 이 항목을 DB 로 동기화하므로,
# 주기를 바꾸고 싶으면 여기를 고치고 beat 를 재시작하거나 관리자 화면에서 직접 조정한다.
#
# 시각은 CELERY_TIMEZONE(Asia/Seoul) 기준이다. 국내 정규장은 09:00~15:30.
# 공휴일 휴장은 스케줄로 거르지 않는다 — 휴장일에는 KIS 가 빈 응답을 주고 수집은 0건으로
# 끝난다. 공휴일 달력을 코드에 넣으면 매년 관리 대상이 하나 더 느는 쪽이 손해다.
_CELERY_CRONTAB = None
try:
    from celery.schedules import crontab as _CELERY_CRONTAB
except ImportError:  # celery 미설치 환경(테스트·마이그레이션 전용)에서도 settings 는 로드돼야 한다
    pass

if _CELERY_CRONTAB is not None:
    # 종목 동기화 스케줄은 없다. 수집 대상(securities 중 관리대상 종목)을 매 실행마다
    # 다시 계산하므로, 화면에서 켜고 끈 결과가 다음 수집 주기에 그대로 반영된다.
    CELERY_BEAT_SCHEDULE = {
        # 장중 — 현재가 5분마다
        "market-refresh-prices": {
            "task": "market_data.tasks.refresh_current_prices",
            "schedule": _CELERY_CRONTAB(minute="*/5", hour="9-15", day_of_week="mon-fri"),
        },
        # 장중 — 분봉 10분마다. 한 번에 최대 30분치를 거슬러 받으므로 10분 주기면 겹쳐서 안전하다.
        "market-collect-minutes": {
            "task": "market_data.tasks.collect_today_minutes",
            "schedule": _CELERY_CRONTAB(minute="*/10", hour="9-15", day_of_week="mon-fri"),
        },
        # 장 마감 후 — 일봉 확정치. 최근 5일을 겹쳐 받아 이전 실패분의 구멍을 메운다.
        "market-collect-daily": {
            "task": "market_data.tasks.collect_daily_candles",
            "schedule": _CELERY_CRONTAB(hour=16, minute=10, day_of_week="mon-fri"),
        },
    }

# ─────────────────────────────────────────────
#  Channels — 실시간 프론트 전송 (phase 5)
# ─────────────────────────────────────────────
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {"hosts": [REDIS_URL]},
    },
}

# ─────────────────────────────────────────────
#  KIS 시세 수집기
# ─────────────────────────────────────────────
# paper | live — 실전 키·계좌 활성화는 주문 발행 단계에서 kill switch 와 함께.
# 모의(paper)와 실전(live)은 도메인도 앱키도 별개다. 같은 키를 양쪽에 쓸 수 없다.
KIS_ENV = os.getenv("KIS_ENV", "paper")

# 키는 .env 에서만 온다. 코드·저장소에 값이 들어가면 안 된다.
KIS_APP_KEY = os.getenv("KIS_APP_KEY", "")
KIS_APP_SECRET = os.getenv("KIS_APP_SECRET", "")
KIS_ACCOUNT_NO = os.getenv("KIS_ACCOUNT_NO", "")  # 8자리-2자리. 시세 조회에는 안 쓰고 주문에만 쓴다.

_KIS_HOSTS = {
    "paper": {
        "rest": "https://openapivts.koreainvestment.com:29443",
        "ws": "ws://ops.koreainvestment.com:31000",
    },
    "live": {
        "rest": "https://openapi.koreainvestment.com:9443",
        "ws": "ws://ops.koreainvestment.com:21000",
    },
}
if KIS_ENV not in _KIS_HOSTS:
    raise ValueError(f"KIS_ENV 는 paper 또는 live 여야 한다 (현재: {KIS_ENV!r})")

KIS_REST_BASE = os.getenv("KIS_REST_BASE", _KIS_HOSTS[KIS_ENV]["rest"])
KIS_WS_BASE = os.getenv("KIS_WS_BASE", _KIS_HOSTS[KIS_ENV]["ws"])

# 초당 허용 호출 수. KIS 는 실전과 모의의 유량 제한이 다르고 모의가 훨씬 빡빡하다.
# 넘기면 EGW00201(초당 거래건수 초과) 이 떨어진다. 여유를 두고 잡는다.
KIS_RATE_LIMIT_PER_SEC = int(os.getenv("KIS_RATE_LIMIT_PER_SEC", "2" if KIS_ENV == "paper" else "15"))

# 접근토큰 유효기간은 24시간이지만, 만료 직전에 물리면 수집이 끊긴다.
# 이 시간(초) 만큼 미리 만료된 것으로 보고 재발급한다.
KIS_TOKEN_REFRESH_MARGIN_SEC = int(os.getenv("KIS_TOKEN_REFRESH_MARGIN_SEC", "3600"))

# HTTP 타임아웃(초) · 재시도 횟수. KIS 는 장 시작 직후 응답이 느려질 때가 있다.
KIS_HTTP_TIMEOUT = float(os.getenv("KIS_HTTP_TIMEOUT", "10"))
KIS_HTTP_RETRIES = int(os.getenv("KIS_HTTP_RETRIES", "2"))

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": os.getenv("LOG_LEVEL", "INFO")},
}
