from datetime import date

from django.db import models

from core.db import table
from core.models.common import BaseDomainModel
from trading_discipline.constants.choices import OpinionType


class AiDecisionFeedback(BaseDomainModel):
    """AI피드백의견 — `ai_decision_feedback`.

    `table_name` + `object_id` 로 아무 테이블에나 붙는다(폴리모픽).
    계획에도, 원칙에도, 이행에도 의견을 달 수 있게 하려는 설계다.
    FK 가 아니라서 DB 가 무결성을 지켜 주지 않는다 — 그래서 `TARGET_TABLES` 로
    붙일 수 있는 테이블을 좁혀 두고, 시리얼라이저에서 검증한다.

    `valid_until` 이 있는 게 특징이다. AI 의견에는 유통기한이 있다.
    지난 의견을 오늘의 판단 근거로 쓰지 않도록 화면에서 만료를 흐리게 처리한다.
    """

    #: 폴리모픽 대상 화이트리스트 — 값은 DB 테이블명(스키마 제외).
    TARGET_TABLES = (
        "annual_investment_plan",
        "quarterly_investment_plan",
        "monthly_investment_plan",
        "weekly_investment_plan",
        "daily_investment_plan",
        "quarterly_investment_principles",
        "monthly_investment_principles",
        "investment_principles",
        "mandatory_principles",
        "trading_strategies",
        "market_directions",
        "securities",
        "orders",
        "performance_records",
    )

    id = models.AutoField(primary_key=True, db_comment="id")
    model = models.ForeignKey(
        "trading_discipline.AiModelRun",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        db_column="model_id",
        related_name="feedbacks",
        db_comment="AI모델D",
    )
    opinion_type = models.CharField(
        max_length=20, choices=OpinionType.choices, null=True, blank=True, db_comment="의견종류"
    )
    object_id = models.IntegerField(null=True, blank=True, db_comment="대상ID")
    table_name = models.CharField(max_length=200, null=True, blank=True, db_comment="테이블명")
    ai_decision = models.TextField(null=True, blank=True, db_comment="AI결정")
    score = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True, db_comment="점수"
    )
    confidence_score = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True, db_comment="신뢰도점수"
    )
    reasoning_summary = models.TextField(null=True, blank=True, db_comment="판단근거요약")
    risk_summary = models.TextField(null=True, blank=True, db_comment="위험요약")
    valid_until = models.DateField(null=True, blank=True, db_comment="유효종료일")

    class Meta:
        db_table = table("ai_decision_feedback")
        verbose_name = "AI피드백의견"
        verbose_name_plural = "AI피드백의견"
        indexes = [
            models.Index(fields=["table_name", "object_id"], name="aifb_target_idx"),
            models.Index(fields=["opinion_type"], name="aifb_opinion_idx"),
        ]

    def __str__(self):
        return f"{self.get_opinion_type_display() or '의견'} → {self.table_name}#{self.object_id}"

    @property
    def is_expired(self) -> bool:
        return bool(self.valid_until and self.valid_until < date.today())
