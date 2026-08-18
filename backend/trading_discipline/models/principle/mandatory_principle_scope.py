from django.db import models

from core.db import table
from trading_discipline.constants.choices import PeriodType


class MandatoryPrincipleScope(models.Model):
    """필수원칙 적용기간 — `mandatory_principle_scopes`. (필수원칙 × 기간)

    "이 원칙을 어느 계층에서 꺼내 볼 것인가" 를 정한다. 원칙 하나에 기간을 여러 개
    걸 수 있어서 별도 테이블로 뒀다. 예를 들어 3번 원칙에 DAY 와 MONTH 를 걸면
    이행 화면에서는 체크리스트로 뜨고, 월계획 작성 화면에서는 읽을 문장으로 뜬다.

    ## 기간이 곧 용도다

    표시 방식을 따로 고르게 하지 않는다. 기간이 정해지면 쓰임새도 정해지기 때문이다.

        DAY                        이행(`orders`) 화면의 체크리스트. Y/N 을 반드시 입력한다.
        WEEK/MONTH/QUARTER/YEAR    해당 계획 작성 화면에 문장으로 표시. 체크는 없다.

    계획에 "했다/안 했다" 를 물을 수는 없다 — 계획은 아직 하지 않은 일이다.
    지켰는지를 물을 수 있는 자리는 실제로 행동한 기록, 즉 이행뿐이다.

    ## 행이 없으면 아무 데도 안 나온다

    기본값을 "전 계층에 표시" 로 두지 않는다. 원칙을 등록하자마자 모든 화면에 끼어들면
    사람은 곧 그것을 배경으로 여기고 읽지 않게 된다. 어디에 띄울지는 매번 고르게 한다.

    ## 여기에는 소프트딜리트가 없다

    이 앱의 다른 테이블은 전부 `is_deleted` 를 갖는다(core/models/common.py). 이 테이블만
    뺀 이유는 두 가지다.

    첫째, 삭제 이력이 의미가 없다. 이건 체크박스의 on/off 이지 사람이 남긴 기록이 아니다.
    "작년에 이 원칙을 주간에도 걸어 뒀었다" 는 사실은 아무 데도 쓰이지 않는다.

    둘째, 남겨 두면 조회가 조용히 틀린다. `?period_type=DAY` 는 조인으로 걸리는데,
    Django 는 JOIN 에 소프트딜리트 필터를 자동으로 붙이지 않는다. 해제한 기간이 계속
    매칭되어 "체크를 껐는데 화면에서 안 사라지는" 상태가 된다.
    """

    id = models.AutoField(primary_key=True, db_comment="ID")
    principle = models.ForeignKey(
        "trading_discipline.MandatoryPrinciple",
        on_delete=models.CASCADE,
        db_column="principle_id",
        related_name="scopes",
        db_comment="필수원칙ID",
    )
    period_type = models.CharField(
        max_length=20, choices=PeriodType.choices, db_comment="적용기간"
    )

    class Meta:
        db_table = table("mandatory_principle_scopes")
        verbose_name = "필수원칙적용기간"
        verbose_name_plural = "필수원칙적용기간"
        ordering = ("principle_id", "period_type")
        constraints = [
            models.UniqueConstraint(
                fields=["principle", "period_type"], name="mandatory_scope_uniq"
            ),
        ]
        indexes = [
            # "이 기간에 걸린 원칙 전부" 가 거의 모든 조회다.
            models.Index(fields=["period_type"], name="mandatory_scope_period_idx"),
        ]

    def __str__(self):
        return f"{self.principle_id}:{self.get_period_type_display()}"

    @property
    def is_checklist(self) -> bool:
        """이행 화면에서 체크를 받아야 하는 기간인가."""
        return self.period_type == PeriodType.DAY
