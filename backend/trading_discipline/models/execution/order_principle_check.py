from django.db import models

from core.db import table
from core.models.common import BaseDomainModel


class OrderPrincipleCheck(BaseDomainModel):
    """이행 원칙점검 — `order_principle_checks`. (이행 × 필수원칙)

    DAY 로 지정된 필수원칙(`mandatory_principle_scopes`) 을 이 이행에서 지켰는지를
    남긴다. 이행을 새로 기록할 때 **모든 DAY 원칙에 대해 Y/N 을 반드시 입력**해야 한다
    (`OrderListSerializer.validate` 가 막는다).

    ## `is_done=False` 를 저장할 수 있어야 한다

    "안 지켰다" 는 실패가 아니라 기록이다. 오히려 이 앱의 핵심 자료다 — 어떤 원칙을
    언제 어기고 그 매매가 어떻게 됐는지가 규율의 성과를 말해 준다. 그래서 저장을 막지 않고
    값을 비워 두는 것만 막는다. 체크를 건너뛸 수 있게 하면 불편한 답이 조용히 사라진다.

    ## 이행에 매달리는 이유

    날짜별로 하루 한 번 점검하게 할 수도 있었다. 그러나 그러면 "오늘 세 번 매매했는데
    그중 어느 매매에서 원칙을 어겼는가" 를 잃는다. 규율을 어긴 자리는 하루가 아니라
    개별 행동이다.
    """

    id = models.AutoField(primary_key=True, db_comment="ID")
    order = models.ForeignKey(
        "trading_discipline.Order",
        on_delete=models.CASCADE,
        db_column="order_id",
        related_name="principle_checks",
        db_comment="이행ID",
    )
    principle = models.ForeignKey(
        "trading_discipline.MandatoryPrinciple",
        on_delete=models.PROTECT,
        db_column="principle_id",
        related_name="order_checks",
        db_comment="필수원칙ID",
    )
    # NOT NULL 이다. "체크 안 함" 이라는 세 번째 상태를 만들지 않는다.
    is_done = models.BooleanField(db_comment="준수여부")
    note = models.TextField(null=True, blank=True, db_comment="점검메모")

    class Meta:
        db_table = table("order_principle_checks")
        verbose_name = "이행원칙점검"
        verbose_name_plural = "이행원칙점검"
        ordering = ("order_id", "principle_id")
        constraints = [
            models.UniqueConstraint(
                fields=["order", "principle"], name="order_principle_check_uniq"
            ),
        ]
        indexes = [
            # "원칙별로 얼마나 지켰나" 집계가 회고 화면의 재료다.
            models.Index(fields=["principle", "is_done"], name="order_check_principle_idx"),
        ]

    def __str__(self):
        mark = "O" if self.is_done else "X"
        return f"[{mark}] 이행#{self.order_id} 원칙#{self.principle_id}"
