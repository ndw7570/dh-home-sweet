from rest_framework import serializers

from trading_discipline.models import BrokerAccount
from trading_discipline.serializers._base import DomainSerializer


class BrokerAccountListSerializer(DomainSerializer):
    """목록에는 계좌번호 원문을 싣지 않는다.

    목록은 화면·로그·개발자도구에 그대로 남는다. 편집에 필요한 원문은
    단건 조회(`GET /broker-account/{id}/`)에서만 준다 — 폼을 열 때만 오는 셈이다.
    """

    masked_account_number = serializers.CharField(read_only=True)
    security_count = serializers.SerializerMethodField()

    class Meta:
        model = BrokerAccount
        exclude = ("account_number",)

    def get_security_count(self, obj) -> int:
        """관리대상 종목 수. 계좌 카드에 바로 찍힌다."""
        return obj.securities.filter(is_active=True).count()


class BrokerAccountParentSerializer(DomainSerializer):
    """다른 응답에 부모로 끼어 들어갈 때 — 계좌번호 원문은 내보내지 않는다."""

    masked_account_number = serializers.CharField(read_only=True)

    class Meta:
        model = BrokerAccount
        fields = ("id", "broker_name", "masked_account_number")


class BrokerAccountDetailSelectSerializer(DomainSerializer):
    """단건 조회에만 계좌번호 원문이 있다. 수정 폼이 이걸로 채워진다."""

    masked_account_number = serializers.CharField(read_only=True)

    class Meta:
        model = BrokerAccount
        fields = "__all__"
