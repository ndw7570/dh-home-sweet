"""도메인 모델 22개.

investments-nam.sql 의 29개 테이블 중 커뮤니티(posts/comments/likes/attachment_files) 5개는
1차 범위에서 뺐고, user_profile/person 2개는 `users` 앱이 갖는다. 나머지 22개가 여기 있다.

  portfolio  계좌 · 종목 · 담보대출 · 가격데이터
  planning   연 → 분기 → 월 → 주 → 일  (5계층)
  principle  필수원칙 · 원칙소스 · 대가원칙 · 분기원칙 · 월원칙
  market     시장방향 · 영향종목
  strategy   매수매도전략 · 매수매도방법(n차 분할)
  execution  이행 · 성과
  ai         모델실행 · 피드백의견
"""

from trading_discipline.models.ai import AiDecisionFeedback, AiModelRun
from trading_discipline.models.execution import Order, PerformanceRecord
from trading_discipline.models.market import AffectedSecurity, MarketDirection
from trading_discipline.models.planning import (
    AnnualInvestmentPlan,
    DailyInvestmentPlan,
    MonthlyInvestmentPlan,
    QuarterlyInvestmentPlan,
    WeeklyInvestmentPlan,
)
from trading_discipline.models.portfolio import (
    BrokerAccount,
    DailySecurityPriceData,
    SecuritiesLoan,
    Security,
)
from trading_discipline.models.principle import (
    InvestmentPrinciple,
    MandatoryPrinciple,
    MonthlyInvestmentPrinciple,
    PrincipleSource,
    QuarterlyInvestmentPrinciple,
)
from trading_discipline.models.strategy import TradingStrategy, TradingStrategyMethod

__all__ = [
    # portfolio
    "BrokerAccount",
    "Security",
    "SecuritiesLoan",
    "DailySecurityPriceData",
    # planning
    "AnnualInvestmentPlan",
    "QuarterlyInvestmentPlan",
    "MonthlyInvestmentPlan",
    "WeeklyInvestmentPlan",
    "DailyInvestmentPlan",
    # principle
    "MandatoryPrinciple",
    "PrincipleSource",
    "InvestmentPrinciple",
    "QuarterlyInvestmentPrinciple",
    "MonthlyInvestmentPrinciple",
    # market
    "MarketDirection",
    "AffectedSecurity",
    # strategy
    "TradingStrategy",
    "TradingStrategyMethod",
    # execution
    "Order",
    "PerformanceRecord",
    # ai
    "AiModelRun",
    "AiDecisionFeedback",
]
