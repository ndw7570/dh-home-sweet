from rest_framework import serializers

from trading_discipline.models import BrokerAccount
from trading_discipline.serializers._base import DomainSerializer


class BrokerAccountListSerializer(DomainSerializer):
    masked_account_number = serializers.CharField(read_only=True)
    security_count = serializers.SerializerMethodField()

    class Meta:
        model = BrokerAccount
        fields = "__all__"

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
    masked_account_number = serializers.CharField(read_only=True)

    class Meta:
        model = BrokerAccount
        fields = "__all__"
