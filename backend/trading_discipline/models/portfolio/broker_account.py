from django.db import models

from core.db import table
from core.models.common import SoftDeleteModel


class BrokerAccount(SoftDeleteModel):
    """증권사계좌 — `broker_accounts`.

    연투자계획과 종목이 둘 다 계좌에 매달린다. 계좌가 바뀌면 계획 체계 전체가
    갈라지므로, 이 테이블이 사실상 최상위 구분자다.

    DDL 에 created_at/updated_at/remarks 가 없어서 여기도 넣지 않았다.
    """

    id = models.AutoField(primary_key=True, db_comment="id")
    broker_name = models.CharField(max_length=100, null=True, blank=True, db_comment="증권사명")
    account_number = models.CharField(
        max_length=100, null=True, blank=True, db_comment="계좌번호"
    )

    class Meta:
        db_table = table("broker_accounts")
        verbose_name = "증권사계좌"
        verbose_name_plural = "증권사계좌"

    def __str__(self):
        return f"{self.broker_name or '증권사'} {self.masked_account_number}"

    @property
    def masked_account_number(self) -> str:
        """계좌번호는 화면·로그 어디에도 전체가 찍히지 않게 뒤 4자리만 남긴다."""
        num = self.account_number or ""
        return f"****{num[-4:]}" if len(num) > 4 else num
