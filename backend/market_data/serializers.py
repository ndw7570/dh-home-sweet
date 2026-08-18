"""시세 응답 시리얼라이저.

봉 모델에는 `is_deleted` 가 없어서 규율 앱의 `DomainSerializer`(소프트딜리트 전제) 를
그대로 쓰지 못한다. 그래서 코드값 라벨 믹스인만 `core` 에서 직접 가져다 쓴다.
"""

from rest_framework import serializers

from core.serializers.mixins import ChoiceLabelMixin
from market_data.models import DailyCandle, MinuteCandle, Symbol


class SymbolSerializer(ChoiceLabelMixin):
    """수집 종목. `is_target` 이 지금 수집 대상인지를 말해 준다.

    `is_target` 은 이 테이블의 컬럼이 아니다 — 뷰셋이 `securities` 를 조회해 붙여 준다.
    수집 여부를 정하는 곳이 화면(`securities.is_active`) 하나뿐이라 그렇다.
    컬럼으로 두면 두 값이 어긋나는 순간 어느 쪽이 참인지 알 수 없게 된다.
    """

    is_target = serializers.BooleanField(read_only=True)
    is_deleted = serializers.BooleanField(read_only=True)

    class Meta:
        model = Symbol
        fields = "__all__"


class SymbolParentSerializer(serializers.ModelSerializer):
    """봉 응답에 종목이 딸려 나갈 때 쓰는 최소 형태."""

    class Meta:
        model = Symbol
        fields = ("id", "symbol", "name", "market")


class DailyCandleSerializer(serializers.ModelSerializer):
    symbol_detail = SymbolParentSerializer(source="symbol", read_only=True)

    class Meta:
        model = DailyCandle
        fields = "__all__"


class MinuteCandleSerializer(serializers.ModelSerializer):
    symbol_detail = SymbolParentSerializer(source="symbol", read_only=True)

    class Meta:
        model = MinuteCandle
        fields = "__all__"
