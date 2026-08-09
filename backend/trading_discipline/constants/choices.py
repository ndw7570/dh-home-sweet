"""코드값 정의.

investments-nam.sql 은 코드성 컬럼을 전부 `VARCHAR(20)` 으로만 잡아 두고
어떤 값이 들어가는지는 적어 두지 않았다. 값을 정하지 않으면 프론트의 셀렉트박스도,
회고의 집계(방향별 적중률 같은 것)도 만들 수 없어서 여기서 확정한다.

**여기 있는 값은 내가 정한 것이다. DDL 이 규정한 것이 아니다.**
바꾸고 싶은 값이 있으면 이 파일만 고치면 된다 — 모델·시리얼라이저·프론트가
전부 여기를 참조한다. (프론트는 `GET /api/trading/meta/choices/` 로 받아 간다)
"""

from django.db import models


class Market(models.TextChoices):
    KOSPI = "KOSPI", "코스피"
    KOSDAQ = "KOSDAQ", "코스닥"
    KONEX = "KONEX", "코넥스"
    NASDAQ = "NASDAQ", "나스닥"
    NYSE = "NYSE", "뉴욕증권거래소"
    AMEX = "AMEX", "아멕스"
    ETC = "ETC", "기타"


class InvestmentDirection(models.TextChoices):
    """투자방향 — 계획/원칙이 이 종목(또는 시장)을 어느 쪽으로 보는가."""

    LONG = "LONG", "매수"
    SHORT = "SHORT", "매도"
    NEUTRAL = "NEUTRAL", "관망"
    HEDGE = "HEDGE", "헤지"


class MarketTrend(models.TextChoices):
    """시장/종목 방향 — 시장방향(market_directions.direction)과 예측추세가 공유한다."""

    UP = "UP", "상승"
    DOWN = "DOWN", "하락"
    SIDEWAYS = "SIDEWAYS", "횡보"
    VOLATILE = "VOLATILE", "변동성확대"


class PlanStatus(models.TextChoices):
    DRAFT = "DRAFT", "작성중"
    ACTIVE = "ACTIVE", "진행중"
    PAUSED = "PAUSED", "중단"
    CLOSED = "CLOSED", "종료"
    ABANDONED = "ABANDONED", "폐기"


class ScenarioPlanning(models.TextChoices):
    """시나리오계획 — 같은 기간에 대해 몇 갈래를 세워 두었는가."""

    BASE = "BASE", "기본"
    BULL = "BULL", "낙관"
    BEAR = "BEAR", "비관"
    STRESS = "STRESS", "악재"


class AssetType(models.TextChoices):
    STOCK = "STOCK", "주식"
    ETF = "ETF", "ETF"
    ETN = "ETN", "ETN"
    REIT = "REIT", "리츠"
    BOND = "BOND", "채권"
    FUND = "FUND", "펀드"
    CASH = "CASH", "현금"
    CRYPTO = "CRYPTO", "가상자산"


class Currency(models.TextChoices):
    KRW = "KRW", "원"
    USD = "USD", "달러"
    JPY = "JPY", "엔"
    EUR = "EUR", "유로"
    HKD = "HKD", "홍콩달러"
    CNY = "CNY", "위안"


class ActionType(models.TextChoices):
    """행위종류 — 이 행이 계획인지, 실제로 낸 주문인지, 체결인지."""

    PLAN = "PLAN", "계획"
    ORDER = "ORDER", "주문"
    FILL = "FILL", "체결"
    CANCEL = "CANCEL", "취소"
    REJECT = "REJECT", "거부"


class OrderType(models.TextChoices):
    MARKET = "MARKET", "시장가"
    LIMIT = "LIMIT", "지정가"
    STOP = "STOP", "역지정가"
    STOP_LIMIT = "STOP_LIMIT", "역지정지정가"
    TRAILING = "TRAILING", "추적손절"


class OrderSide(models.TextChoices):
    BUY = "BUY", "매수"
    SELL = "SELL", "매도"


class PeriodType(models.TextChoices):
    DAY = "DAY", "일"
    WEEK = "WEEK", "주"
    MONTH = "MONTH", "월"
    QUARTER = "QUARTER", "분기"
    YEAR = "YEAR", "연"


class PrincipleType(models.TextChoices):
    BUY = "BUY", "매수원칙"
    SELL = "SELL", "매도원칙"
    RISK = "RISK", "위험관리"
    VALUATION = "VALUATION", "가치평가"
    PORTFOLIO = "PORTFOLIO", "포트폴리오"
    MINDSET = "MINDSET", "태도"


class SourceType(models.TextChoices):
    BOOK = "BOOK", "책"
    VIDEO = "VIDEO", "영상"
    ARTICLE = "ARTICLE", "글"
    LECTURE = "LECTURE", "강의"
    INTERVIEW = "INTERVIEW", "인터뷰"
    PAPER = "PAPER", "논문/리포트"
    ETC = "ETC", "기타"


class StrategyType(models.TextChoices):
    """매수매도방법의 종류 — n차 분할이 어느 방향인가."""

    BUY_SPLIT = "BUY_SPLIT", "분할매수"
    SELL_SPLIT = "SELL_SPLIT", "분할매도"
    ADD_ON = "ADD_ON", "추가매수"
    TAKE_PROFIT = "TAKE_PROFIT", "익절"
    STOP_LOSS = "STOP_LOSS", "손절"


class ValuationType(models.TextChoices):
    UNDERVALUED = "UNDERVALUED", "저평가"
    FAIR = "FAIR", "적정"
    OVERVALUED = "OVERVALUED", "고평가"


class FactorType(models.TextChoices):
    """시장방향의 요인종류 — 무엇 때문에 그렇게 보는가."""

    RATE = "RATE", "금리"
    FX = "FX", "환율"
    COMMODITY = "COMMODITY", "원자재"
    POLICY = "POLICY", "정책/규제"
    EARNINGS = "EARNINGS", "실적"
    GEOPOLITICS = "GEOPOLITICS", "지정학"
    LIQUIDITY = "LIQUIDITY", "유동성"
    SENTIMENT = "SENTIMENT", "투자심리"


class OpinionType(models.TextChoices):
    """AI 피드백의 성격."""

    REVIEW = "REVIEW", "검토"
    WARNING = "WARNING", "경고"
    SUGGESTION = "SUGGESTION", "제안"
    APPROVAL = "APPROVAL", "동의"
    REJECTION = "REJECTION", "반대"


class RunStatus(models.TextChoices):
    PENDING = "PENDING", "대기"
    RUNNING = "RUNNING", "실행중"
    SUCCESS = "SUCCESS", "성공"
    FAILED = "FAILED", "실패"
    CANCELED = "CANCELED", "취소"


#: 프론트 셀렉트박스가 통째로 받아 가는 묶음.
CHOICE_REGISTRY = {
    "market": Market,
    "investment_direction": InvestmentDirection,
    "market_trend": MarketTrend,
    "plan_status": PlanStatus,
    "scenario_planning": ScenarioPlanning,
    "asset_type": AssetType,
    "currency": Currency,
    "action_type": ActionType,
    "order_type": OrderType,
    "order_side": OrderSide,
    "period_type": PeriodType,
    "principle_type": PrincipleType,
    "source_type": SourceType,
    "strategy_type": StrategyType,
    "valuation_type": ValuationType,
    "factor_type": FactorType,
    "opinion_type": OpinionType,
    "run_status": RunStatus,
}


def choice_payload() -> dict[str, list[dict[str, str]]]:
    """`{"market": [{"value": "KOSPI", "label": "코스피"}, ...], ...}`"""
    return {
        key: [{"value": value, "label": label} for value, label in enum.choices]
        for key, enum in CHOICE_REGISTRY.items()
    }


#: 확신도(계획확신도)는 SQL 이 INTEGER 라 범위만 강제한다.
CONFIDENCE_MIN = 1
CONFIDENCE_MAX = 5
