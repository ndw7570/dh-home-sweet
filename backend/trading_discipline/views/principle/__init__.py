from trading_discipline.views.principle.investment_principle import InvestmentPrincipleViewSet
from trading_discipline.views.principle.mandatory_principle import MandatoryPrincipleViewSet
from trading_discipline.views.principle.monthly_principle import MonthlyPrincipleViewSet
from trading_discipline.views.principle.principle_source import PrincipleSourceViewSet
from trading_discipline.views.principle.quarterly_principle import QuarterlyPrincipleViewSet

__all__ = [
    "MandatoryPrincipleViewSet",
    "PrincipleSourceViewSet",
    "InvestmentPrincipleViewSet",
    "QuarterlyPrincipleViewSet",
    "MonthlyPrincipleViewSet",
]
