from django.db import models

from core.db import table
from core.models.common import SoftDeleteModel
from trading_discipline.constants.choices import ValuationType


class QuarterlyInvestmentPrinciple(SoftDeleteModel):
    """분기투자원칙 — `quarterly_investment_principles`. (분기계획 × 종목)

    사실상 분기 실적 카드다. 성장성(매출·수주) / 수익성(영업이익률·ROE·ROIC) /
    현금(FCF·현금전환율) / 안정성(이자보상배율) / 가격(PER·PBR·EV/EBITDA·PSR·FCF수익률)
    다섯 묶음을 한 행에 담고, 마지막에 `valuation_type` 으로 저평가/적정/고평가를 못박는다.

    DDL 에 created_at/updated_at/remarks 가 없다. 분기마다 새 행이 쌓이는 append 형태라
    수정일이 의미가 없다고 본 것으로 읽힌다.
    """

    id = models.AutoField(primary_key=True, db_comment="ID")
    quarterly_plan = models.ForeignKey(
        "trading_discipline.QuarterlyInvestmentPlan",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        db_column="quarterly_plan_id",
        related_name="principles",
        db_comment="분기계획ID",
    )
    security = models.ForeignKey(
        "trading_discipline.Security",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        db_column="security_id",
        related_name="quarterly_principles",
        db_comment="종목ID",
    )
    predicted_price = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True, db_comment="예상가격"
    )
    stop_loss_price = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True, db_comment="손절가격"
    )

    # 성장성
    revenue = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True, db_comment="매출액"
    )
    revenue_growth_rate = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True, db_comment="매출증가율"
    )
    new_orders_amount = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True, db_comment="신규 수주액"
    )
    order_backlog = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True, db_comment="수주잔고"
    )

    # 수익성
    operating_margin = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True, db_comment="영업이익률"
    )
    net_income = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True, db_comment="순이익"
    )
    roe = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True, db_comment="ROE"
    )
    roic = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True, db_comment="ROIC"
    )

    # 현금 · 안정성
    free_cash_flow = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True, db_comment="잉여현금흐름"
    )
    cash_conversion_rate = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True, db_comment="현금전환율"
    )
    interest_coverage_ratio = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True, db_comment="이자보상배율"
    )

    # 가격
    per = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True, db_comment="PER"
    )
    pbr = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True, db_comment="PBR"
    )
    ev_ebitda = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True, db_comment="EV/EBITDA"
    )
    psr = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True, db_comment="PSR"
    )
    fcf_yield = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True, db_comment="FCF수익률"
    )

    valuation_type = models.CharField(
        max_length=20,
        choices=ValuationType.choices,
        null=True,
        blank=True,
        db_comment="기업가치종류",
    )
    performance_summary = models.TextField(null=True, blank=True, db_comment="실적")

    #: 화면이 네 묶음으로 나눠 그릴 때 쓰는 지표 그룹.
    METRIC_GROUPS = {
        "성장성": ("revenue", "revenue_growth_rate", "new_orders_amount", "order_backlog"),
        "수익성": ("operating_margin", "net_income", "roe", "roic"),
        "현금·안정성": ("free_cash_flow", "cash_conversion_rate", "interest_coverage_ratio"),
        "가격": ("per", "pbr", "ev_ebitda", "psr", "fcf_yield"),
    }

    class Meta:
        db_table = table("quarterly_investment_principles")
        verbose_name = "분기투자원칙"
        verbose_name_plural = "분기투자원칙"
        indexes = [
            models.Index(fields=["quarterly_plan", "security"], name="qprin_plan_sec_idx"),
        ]

    def __str__(self):
        return f"분기원칙#{self.id}"

    @property
    def filled_ratio(self) -> float:
        """지표를 얼마나 채웠는가. 반쯤 빈 카드로 판단하는 걸 막으려고 화면에 띄운다."""
        fields = [f for group in self.METRIC_GROUPS.values() for f in group]
        filled = sum(1 for f in fields if getattr(self, f) is not None)
        return round(filled / len(fields), 2)
