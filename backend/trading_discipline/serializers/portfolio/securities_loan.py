from datetime import date

from rest_framework import serializers

from trading_discipline.models import SecuritiesLoan
from trading_discipline.serializers._base import DomainSerializer
from trading_discipline.serializers.portfolio.security import SecurityParentSerializer


class SecuritiesLoanListSerializer(DomainSerializer):
    """FK 는 `security`(쓰기 가능한 PK)로 두고, 표시용은 `security_detail` 로 따로 낸다.

    중첩 객체를 `security` 자리에 그대로 끼우면 그 필드가 읽기 전용이 되어
    같은 시리얼라이저로 POST/PATCH 를 못 한다. 22개 전부 이 패턴으로 통일한다.
    """

    security_detail = SecurityParentSerializer(source="security", read_only=True)
    days_to_maturity = serializers.SerializerMethodField()

    class Meta:
        model = SecuritiesLoan
        fields = "__all__"

    def get_days_to_maturity(self, obj) -> int | None:
        """만기까지 남은 일수. 음수면 이미 지났다는 뜻이라 화면이 붉게 띄운다."""
        if not obj.maturity_at:
            return None
        return (obj.maturity_at - date.today()).days


class SecuritiesLoanDetailSelectSerializer(SecuritiesLoanListSerializer):
    pass
