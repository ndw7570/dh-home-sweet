"""데모 시드 — 화면이 빈 채로 뜨지 않게 한 벌 넣는다.

    python manage.py seed_demo          # 이미 있으면 아무것도 안 한다
    python manage.py seed_demo --reset  # 지우고 다시 넣는다

계획 5계층이 실제로 이어지는 한 벌(연 1 → 분기 1 → 월 2시나리오 → 주 2 → 일 2)과,
일부러 **계층이 끊긴 케이스**(월원칙 없는 월계획, 어디에도 안 붙는 주계획)를 같이 넣는다.
끊긴 자리를 화면이 어떻게 잡아내는지가 이 프로그램의 핵심이라, 시드에도 그 상태가 있어야 한다.
"""

from datetime import date, datetime, time, timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from core.mixins.period import month_range, quarter_range, week_range, year_range
from trading_discipline.constants.choices import (
    ActionType,
    AssetType,
    Currency,
    FactorType,
    InvestmentDirection,
    Market,
    MarketTrend,
    OpinionType,
    OrderSide,
    OrderType,
    PeriodType,
    PlanStatus,
    PrincipleType,
    RunStatus,
    ScenarioPlanning,
    SourceType,
    StrategyType,
    ValuationType,
)
from trading_discipline.models import (
    AffectedSecurity,
    AiDecisionFeedback,
    AiModelRun,
    AnnualInvestmentPlan,
    BrokerAccount,
    DailyInvestmentPlan,
    InvestmentPrinciple,
    MandatoryPrinciple,
    MarketDirection,
    MonthlyInvestmentPlan,
    MonthlyInvestmentPrinciple,
    Order,
    PerformanceRecord,
    PrincipleSource,
    QuarterlyInvestmentPlan,
    QuarterlyInvestmentPrinciple,
    SecuritiesLoan,
    Security,
    SecurityPriceData,
    TradingStrategy,
    TradingStrategyMethod,
    WeeklyInvestmentPlan,
)

MODELS_IN_DELETE_ORDER = [
    AiDecisionFeedback, AiModelRun, PerformanceRecord, Order,
    TradingStrategyMethod, TradingStrategy, SecurityPriceData,
    AffectedSecurity, MarketDirection,
    DailyInvestmentPlan, WeeklyInvestmentPlan,
    MonthlyInvestmentPrinciple, MonthlyInvestmentPlan,
    QuarterlyInvestmentPrinciple, QuarterlyInvestmentPlan, AnnualInvestmentPlan,
    InvestmentPrinciple, PrincipleSource, MandatoryPrinciple,
    SecuritiesLoan, Security, BrokerAccount,
]


def _at(day: date, hour: int, minute: int, second: int = 0):
    """USE_TZ=True 이므로 aware datetime 으로 만들어 넣는다."""
    return timezone.make_aware(datetime.combine(day, time(hour, minute, second)))


class Command(BaseCommand):
    help = "데모 데이터를 넣는다."

    def add_arguments(self, parser):
        parser.add_argument("--reset", action="store_true", help="기존 데이터를 지우고 다시 넣는다")

    @transaction.atomic
    def handle(self, *args, **options):
        if options["reset"]:
            for model in MODELS_IN_DELETE_ORDER:
                model.all_objects.all().hard_delete()
            self.stdout.write(self.style.WARNING("기존 데모 데이터를 지웠다."))
        elif BrokerAccount.objects.exists():
            self.stdout.write("이미 데이터가 있다. --reset 을 주면 다시 넣는다.")
            return

        today = date.today()
        y_from, y_until = year_range(today)
        q_from, q_until = quarter_range(today)
        m_from, m_until = month_range(today)
        w_from, w_until = week_range(today)

        # ── 필수원칙 ──────────────────────────────────
        for priority, content in enumerate(
            [
                "계획에 없는 종목은 사지 않는다.",
                "손절가는 사기 전에 정하고, 정한 뒤에는 내리지 않는다.",
                "한 종목에 총자산의 20%를 넘기지 않는다.",
                "물타기는 미리 적어 둔 n차 분할표 안에서만 한다.",
                "장중에 계획을 바꾸지 않는다. 바꾸려면 장 끝나고 근거를 적는다.",
            ],
            start=1,
        ):
            MandatoryPrinciple.objects.create(priority=priority, content=content)

        # ── 대가의 원칙 ───────────────────────────────
        source = PrincipleSource.objects.create(
            name="현명한 투자자", source_type=SourceType.BOOK,
            content="벤저민 그레이엄. 안전마진과 미스터 마켓.",
        )
        InvestmentPrinciple.objects.create(
            source=source, teacher_name="벤저민 그레이엄", principle_type=PrincipleType.VALUATION,
            content="내재가치보다 충분히 싸게 살 것 — 안전마진.",
            rationale="추정이 틀려도 손실을 흡수할 여유가 가격에 이미 들어 있어야 한다.",
            cautions="성장주에는 내재가치 추정 자체가 흔들려서 안전마진 계산이 무의미해질 수 있다.",
        )
        InvestmentPrinciple.objects.create(
            source=source, teacher_name="벤저민 그레이엄", principle_type=PrincipleType.MINDSET,
            content="시장은 하인이지 주인이 아니다.",
            rationale="가격은 매일 제시될 뿐, 받아들일 의무는 없다.",
            cautions="유동성이 마르는 국면에서는 '무시'가 곧 탈출 기회 상실이 된다.",
        )

        # ── 계좌 · 종목 ───────────────────────────────
        account = BrokerAccount.objects.create(broker_name="미래에셋증권", account_number="12345678901")

        samsung = Security.objects.create(
            account=account, market=Market.KOSPI, symbol="005930", name="삼성전자",
            asset_type=AssetType.STOCK, currency=Currency.KRW,
            holding_quantity=120, current_price=Decimal("71500.00"), sector="반도체",
        )
        hynix = Security.objects.create(
            account=account, market=Market.KOSPI, symbol="000660", name="SK하이닉스",
            asset_type=AssetType.STOCK, currency=Currency.KRW,
            holding_quantity=40, current_price=Decimal("183000.00"), sector="반도체",
        )
        naver = Security.objects.create(
            account=account, market=Market.KOSPI, symbol="035420", name="NAVER",
            asset_type=AssetType.STOCK, currency=Currency.KRW,
            holding_quantity=25, current_price=Decimal("162000.00"), sector="인터넷",
        )

        # 담보대출 — 담보비율이 경고선 아래라 홈에 경고로 뜬다.
        SecuritiesLoan.objects.create(
            security=hynix, principal_amount=Decimal("5000000.00"), interest_rate=Decimal("6.20"),
            opened_at=today - timedelta(days=90), maturity_at=today + timedelta(days=20),
            quantity=40, reference_price=Decimal("183000.00"),
            collateral_value=Decimal("7320000.00"), collateral_ratio=Decimal("131.00"),
        )

        # ── 계획 5계층 (이어지는 한 벌) ────────────────
        annual = AnnualInvestmentPlan.objects.create(
            account=account, market=Market.KOSPI,
            title=f"{today.year} 반도체 사이클 상반기 비중확대",
            thesis="메모리 감산 효과가 재고 정상화로 이어지는 구간. 사이클 초입에서 비중을 싣는다.",
            direction=InvestmentDirection.LONG, status=PlanStatus.ACTIVE,
            valid_from=y_from, valid_until=y_until,
            target_return_ratio=Decimal("18.00"), stop_loss_ratio=Decimal("-8.00"),
        )
        quarterly = QuarterlyInvestmentPlan.objects.create(
            annual_plan=annual, title=f"{today.year} {((today.month - 1) // 3) + 1}분기 반도체 비중 55%",
            rebalancing_ratio={"005930": 30, "000660": 25, "CASH": 45},
            rebalancing_start_date=q_from, rebalancing_end_date=q_from + timedelta(days=14),
            buy_strategy="20일선 지지 확인 후 3분할. 1차 -3%, 2차 -7%, 3차 -12%.",
            sell_strategy="목표가 도달 시 절반, 나머지는 추세 이탈까지 보유.",
            sideways_strategy="2주 이상 횡보하면 신규 매수 중단, 현금 비중 유지.",
            # 손절전략은 일부러 비워 둔다 — 홈의 '빈칸' 카드가 이걸 잡는다.
            direction=InvestmentDirection.LONG,
            thesis="분기 실적 발표에서 재고 감소가 확인되는지가 분기점.",
            valid_from=q_from, valid_until=q_until,
            target_return_ratio=Decimal("6.00"), stop_loss_ratio=Decimal("-5.00"),
        )
        monthly_base = MonthlyInvestmentPlan.objects.create(
            quarterly_plan=quarterly, title=f"{today.month}월 기본 시나리오",
            scenario_planning=ScenarioPlanning.BASE, predicted_trend=MarketTrend.UP,
            thesis="완만한 상승. 조정 시 분할 매수로 비중을 채운다.",
            confidence_score=4, allocation_ratio={"005930": 30, "000660": 25, "CASH": 45},
            valid_from=m_from, valid_until=m_until,
        )
        monthly_bear = MonthlyInvestmentPlan.objects.create(
            quarterly_plan=quarterly, title=f"{today.month}월 비관 시나리오",
            scenario_planning=ScenarioPlanning.BEAR, predicted_trend=MarketTrend.DOWN,
            thesis="금리 재상승 시 밸류에이션 압축. 현금 비중을 60%까지 올린다.",
            confidence_score=2, allocation_ratio={"005930": 20, "CASH": 60},
            valid_from=m_from, valid_until=m_until,
        )
        # 월계획을 종목에 잇는 이음매
        MonthlyInvestmentPrinciple.objects.create(
            monthly_plan=monthly_base, security=samsung, direction=InvestmentDirection.LONG,
            rationale="HBM 비중 확대와 파운드리 가동률 회복이 동시에 잡히는 구간.",
            predicted_price=Decimal("84000.00"), stop_loss_price=Decimal("66000.00"),
        )
        MonthlyInvestmentPrinciple.objects.create(
            monthly_plan=monthly_base, security=hynix, direction=InvestmentDirection.LONG,
            rationale="HBM3E 공급 계약 물량이 내년 상반기까지 확보돼 있다.",
            predicted_price=Decimal("215000.00"), stop_loss_price=Decimal("168000.00"),
        )
        # monthly_bear 에는 일부러 원칙을 안 붙인다 → '월원칙 없는 월계획' 빈칸 카드

        weekly_samsung = WeeklyInvestmentPlan.objects.create(
            security=samsung, title="삼성전자 이번 주 3분할 1차",
            scenario_planning=ScenarioPlanning.BASE, available_amount=Decimal("3000000.00"),
            predicted_trend=MarketTrend.UP,
            thesis="70,000 지지 확인. 여기서 1차 진입.",
            confidence_score=4, allocation_ratio={"005930": 100},
            valid_from=w_from, valid_until=w_until,
            predicted_price=Decimal("76000.00"), stop_loss_price=Decimal("68000.00"),
        )
        weekly_hynix = WeeklyInvestmentPlan.objects.create(
            security=hynix, title="SK하이닉스 관망",
            scenario_planning=ScenarioPlanning.BASE, available_amount=Decimal("2000000.00"),
            predicted_trend=MarketTrend.SIDEWAYS,
            thesis="180,000 ~ 195,000 박스. 이탈 확인 전까지 신규 진입 없음.",
            confidence_score=3, allocation_ratio={"000660": 100},
            valid_from=w_from, valid_until=w_until,
            predicted_price=Decimal("196000.00"), stop_loss_price=Decimal("176000.00"),
        )
        # 어느 월계획에도 안 붙는 주계획 — NAVER 는 월원칙이 없다 → orphan 으로 잡힌다
        WeeklyInvestmentPlan.objects.create(
            security=naver, title="NAVER 단기 반등 노림",
            scenario_planning=ScenarioPlanning.BULL, predicted_trend=MarketTrend.UP,
            thesis="낙폭 과대. 다만 월계획에 없는 종목이다.",
            confidence_score=2,
            valid_from=w_from, valid_until=w_until,
            predicted_price=Decimal("178000.00"), stop_loss_price=Decimal("155000.00"),
        )

        DailyInvestmentPlan.objects.create(
            weekly_plan=weekly_samsung, title="오늘 1차 매수",
            scenario_planning=ScenarioPlanning.BASE, predicted_trend=MarketTrend.UP,
            thesis="시가 대비 -1% 이탈 시 지정가 71,000 으로 1/3 진입.",
            confidence_score=4, valid_from=today, valid_until=today,
            predicted_price=Decimal("73000.00"), stop_loss_price=Decimal("68000.00"),
        )
        DailyInvestmentPlan.objects.create(
            weekly_plan=weekly_hynix, title="오늘 관망",
            scenario_planning=ScenarioPlanning.BASE, predicted_trend=MarketTrend.SIDEWAYS,
            thesis="박스 상단까지 아무것도 하지 않는다.",
            confidence_score=3, valid_from=today, valid_until=today,
            stop_loss_price=Decimal("176000.00"),
        )

        # ── 분기 실적 카드 ────────────────────────────
        QuarterlyInvestmentPrinciple.objects.create(
            quarterly_plan=quarterly, security=samsung,
            predicted_price=Decimal("84000.00"), stop_loss_price=Decimal("66000.00"),
            revenue=Decimal("74000000.00"), revenue_growth_rate=Decimal("12.40"),
            new_orders_amount=Decimal("8200000.00"), order_backlog=Decimal("15300000.00"),
            operating_margin=Decimal("14.80"), net_income=Decimal("9600000.00"),
            roe=Decimal("9.10"), roic=Decimal("8.40"),
            free_cash_flow=Decimal("5100000.00"), cash_conversion_rate=Decimal("68.00"),
            interest_coverage_ratio=Decimal("22.30"),
            per=Decimal("14.20"), pbr=Decimal("1.31"), ev_ebitda=Decimal("5.80"),
            psr=Decimal("1.42"), fcf_yield=Decimal("4.10"),
            valuation_type=ValuationType.UNDERVALUED,
            performance_summary="메모리 재고 정상화 진행. 파운드리 적자폭 축소.",
        )

        # ── 시장방향 ──────────────────────────────────
        direction = MarketDirection.objects.create(
            direction=MarketTrend.UP, factor_type=FactorType.RATE,
            content="연준 금리 인하 기대가 반도체 밸류에이션에 우호적으로 작용.",
            rationale="10년물이 3개월간 60bp 하락. 성장주 할인율 부담 완화.",
            factor_value=Decimal("3.85"),
            affected_targets={"sectors": ["반도체"], "indices": ["KOSPI"]},
        )
        AffectedSecurity.objects.create(market_direction=direction, affected_security=samsung)
        AffectedSecurity.objects.create(market_direction=direction, affected_security=hynix)

        # ── 가격 · 전략 (n차 분할표) ───────────────────
        price = SecurityPriceData.objects.create(
            security=samsung, price_at=_at(today, 9, 30),
            high_price=Decimal("72400.00"), low_price=Decimal("70800.00"),
            quote_price=Decimal("71500.00"),
        )
        strategy = TradingStrategy.objects.create(
            price_data=price, policy_name="삼성전자 3분할 매수", sector="반도체",
            reference_at=_at(today, 9, 30),
        )
        for step, (p, q) in enumerate([("-3.00", "30.00"), ("-7.00", "30.00"), ("-12.00", "40.00")], 1):
            TradingStrategyMethod.objects.create(
                strategy=strategy, strategy_type=StrategyType.BUY_SPLIT, step_no=step,
                price_ratio=Decimal(p), quantity_ratio=Decimal(q), sector="반도체",
            )
        for step, (p, q) in enumerate([("8.00", "50.00"), ("15.00", "50.00")], 1):
            TradingStrategyMethod.objects.create(
                strategy=strategy, strategy_type=StrategyType.SELL_SPLIT, step_no=step,
                price_ratio=Decimal(p), quantity_ratio=Decimal(q), sector="반도체",
            )

        # ── 이행 — 규율을 지킨 것 하나, 어긴 것 하나 ────
        Order.objects.create(
            security=samsung, action_type=ActionType.FILL, order_type=OrderType.LIMIT,
            side=OrderSide.BUY, quantity=40, limit_price=Decimal("71000.00"),
            executed_at=_at(today, 10, 12), remarks="주계획 1차 진입. 계획대로.",
        )
        Order.objects.create(
            security=naver, action_type=ActionType.FILL, order_type=OrderType.MARKET,
            side=OrderSide.BUY, quantity=10, limit_price=Decimal("162000.00"),
            executed_at=_at(today, 13, 40),
            remarks="장중 급등 보고 들어감. 월계획에 없는 종목.",
        )

        # ── 성과 ──────────────────────────────────────
        PerformanceRecord.objects.create(
            security=samsung, period_type=PeriodType.MONTH,
            period_start=m_from, period_end=m_until,
            realized_profit=Decimal("420000.00"), unrealized_profit=Decimal("1180000.00"),
            dividend_income=Decimal("43000.00"), interest_cost=Decimal("0.00"),
            commission=Decimal("8600.00"), tax=Decimal("64000.00"), etc_cost=Decimal("0.00"),
            net_profit=Decimal("1570400.00"), return_rate=Decimal("6.40"),
            benchmark_return_rate=Decimal("3.10"), max_drawdown=Decimal("-4.20"),
        )
        PerformanceRecord.objects.create(
            security=naver, period_type=PeriodType.MONTH,
            period_start=m_from, period_end=m_until,
            realized_profit=Decimal("-210000.00"), unrealized_profit=Decimal("-95000.00"),
            dividend_income=Decimal("0.00"), interest_cost=Decimal("31000.00"),
            commission=Decimal("4200.00"), tax=Decimal("0.00"), etc_cost=Decimal("0.00"),
            net_profit=Decimal("-340200.00"), return_rate=Decimal("-4.80"),
            benchmark_return_rate=Decimal("3.10"), max_drawdown=Decimal("-9.60"),
        )

        # ── AI ────────────────────────────────────────
        run = AiModelRun.objects.create(
            model_name="claude-opus-5", model_version="2026-05", prompt_version="discipline-v3",
            started_at=_at(today, 8, 0), completed_at=_at(today, 8, 0, 14),
            input_snapshot_json={"securities": ["005930", "000660"], "as_of": str(today)},
            output_json={"verdict": "plan_ok", "notes": 2}, status=RunStatus.SUCCESS,
        )
        AiDecisionFeedback.objects.create(
            model=run, opinion_type=OpinionType.WARNING,
            table_name="quarterly_investment_plan", object_id=quarterly.id,
            ai_decision="손절전략이 비어 있다. 나머지 세 전략만으로는 하락 국면에서 기준이 없다.",
            score=Decimal("62.00"), confidence_score=Decimal("81.00"),
            reasoning_summary="매수·매도·횡보 전략은 기재됐으나 손절 기준이 없다.",
            risk_summary="분기 손절비율 -5% 도달 시 행동 규칙이 정의돼 있지 않다.",
            valid_until=today + timedelta(days=14),
        )
        AiDecisionFeedback.objects.create(
            model=run, opinion_type=OpinionType.SUGGESTION,
            table_name="weekly_investment_plan", object_id=weekly_samsung.id,
            ai_decision="손익비 약 1.29. 3분할 1차 비중을 낮추면 평균 진입가가 개선된다.",
            score=Decimal("71.00"), confidence_score=Decimal("64.00"),
            reasoning_summary="예상가 76,000 / 손절가 68,000 / 현재가 71,500 기준.",
            risk_summary="1차에 비중을 실으면 2·3차 여력이 줄어든다.",
            valid_until=today + timedelta(days=7),
        )

        self.stdout.write(self.style.SUCCESS("데모 데이터를 넣었다."))
        self.stdout.write(
            "  계층이 이어진 한 벌: 연1 → 분기1 → 월2 → 주2 → 일2\n"
            "  일부러 끊어 둔 것: 손절전략 미기재(분기), 월원칙 없는 월계획(비관),\n"
            "                     월계획에 없는 주계획(NAVER) → /cascade/ 의 orphan 으로 잡힌다"
        )
