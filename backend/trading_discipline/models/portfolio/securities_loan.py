from django.db import models

from core.db import table
from core.models.common import SoftDeleteModel


class SecuritiesLoan(SoftDeleteModel):
    """종목담보대출 — `securities_loans`.

    담보비율이 무너지면 계획이고 원칙이고 없이 반대매매가 먼저 온다.
    그래서 홈 화면의 경고는 이 테이블에서 나온다.

    DDL 에 created_at/updated_at/remarks 가 없다(평가시각 evaluated_at 만 있다).
    security_id 에도 FK 제약이 선언돼 있지 않은데, 컬럼명과 용도가 명백해서
    모델에서는 FK 로 걸었다. DDL 쪽에도 제약을 추가해 두는 편이 안전하다.
    """

    id = models.AutoField(primary_key=True, db_comment="id")
    security = models.ForeignKey(
        "trading_discipline.Security",
        on_delete=models.CASCADE,
        db_column="security_id",
        related_name="loans",
        db_comment="종목ID",
    )
    principal_amount = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True, db_comment="대출원금"
    )
    interest_rate = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True, db_comment="이자율"
    )
    opened_at = models.DateField(null=True, blank=True, db_comment="대출시작일")
    maturity_at = models.DateField(null=True, blank=True, db_comment="만기일")
    quantity = models.IntegerField(null=True, blank=True, db_comment="담보수량")
    reference_price = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True, db_comment="기준가격"
    )
    collateral_value = models.DecimalField(
        max_digits=15, decimal_places=2, null=True, blank=True, db_comment="담보평가금액"
    )
    collateral_ratio = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True, db_comment="담보비율"
    )
    evaluated_at = models.DateTimeField(null=True, blank=True, db_comment="평가시각")

    class Meta:
        db_table = table("securities_loans")
        verbose_name = "종목담보대출"
        verbose_name_plural = "종목담보대출"
        indexes = [models.Index(fields=["security", "maturity_at"], name="loan_sec_maturity_idx")]

    def __str__(self):
        return f"대출#{self.id} ({self.security_id})"
