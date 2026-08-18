from rest_framework import serializers

from market_data.services.pricing import price_snapshot
from trading_discipline.models import DailySecurityPriceData
from trading_discipline.serializers._base import DomainPropertySerializer, DomainSerializer
from trading_discipline.serializers.portfolio.security import SecurityParentSerializer


class DailySecurityPriceDataListSerializer(DomainPropertySerializer):
    """일별 가격데이터 = **전략을 세운 순간의 가격 스냅샷**.

    고가·저가를 보내지 않으면 수집분(당일이면 분봉 집계, 과거면 일봉) 에서 읽어 채운다.
    사람이 손으로 넣어도 되고, 그 경우 보낸 값이 그대로 남는다.

    ## 한 번 만들어지면 값이 바뀌지 않는다

    수집이 아무리 돌아도 이 행을 따라 고치지 않는다. 봉은 upsert 라 장중 미확정치가
    마감 후 확정치로 덮이는데, 근거 가격이 함께 움직이면 오전에 세운 전략을 오후에
    열었을 때 "왜 이 가격대에 걸었지" 를 되짚을 수 없다.

    같은 이유로 **수정할 때는 자동 채움이 없다.** 빈 칸을 나중에 채우려고 PATCH 를 보내면
    그 시점 시세가 들어와 스냅샷이 오염된다. 값을 바꾸려면 명시적으로 실어 보내야 한다.

    ## `current_price` 는 기준 시점의 가격이다

        과거 일자   그날 종가
        당일        기준 시각에 가장 가까운 분봉의 종가

    `securities.current_price`(지금 시세, 5분마다 갱신) 와 이름은 같지만 뜻이 다르다.
    이쪽은 한 번 뜨면 고정이다.
    """

    # 전략이 실제로 쓰는 값은 가격이 아니라 변동폭 비율이다. 절대 가격은 시간이
    # 지나면 쓸모가 없어지지만 "현재가 대비 ±20%" 는 나중에도 그대로 적용된다.
    PROPERTY_FIELDS = ("high_rate", "low_rate", "band_width")

    # 이 스냅샷이 어느 봉에서 나왔는지. 모델 컬럼이 아니라 응답에만 실린다.
    price_source = serializers.SerializerMethodField()

    class Meta:
        model = DailySecurityPriceData
        fields = "__all__"

    def get_price_source(self, obj) -> str | None:
        # 저장 직후에는 방금 계산한 출처를, 조회할 때는 값이 없다(행에 남기지 않는다).
        return getattr(obj, "_snapshot_source", None)

    def create(self, validated_data):
        security = validated_data.get("security")
        has_price = validated_data.get("high_price") is not None or (
            validated_data.get("low_price") is not None
        )
        if security is not None and not has_price:
            snapshot = price_snapshot(security, validated_data.get("price_at"))
            if snapshot["high"] is None:
                raise serializers.ValidationError(
                    {
                        "high_price": (
                            f"{security.name}({security.symbol}) 의 해당 시점 시세가 수집되지 않았다. "
                            "일봉을 먼저 수집하거나(kis_backfill_daily), 고가·저가를 직접 입력하라."
                        )
                    }
                )
            validated_data["high_price"] = snapshot["high"]
            validated_data["low_price"] = snapshot["low"]
            # 사람이 직접 넣은 현재가가 있으면 그것을 존중한다.
            if validated_data.get("current_price") is None:
                validated_data["current_price"] = snapshot["current"]
            validated_data.setdefault("price_at", snapshot["at"])
            instance = super().create(validated_data)
            instance._snapshot_source = snapshot["source"]
            return instance
        return super().create(validated_data)


class DailySecurityPriceDataParentSerializer(DomainSerializer):
    """전략이 '어느 시점 가격을 보고 세웠나' 를 같이 내보낼 때."""

    class Meta:
        model = DailySecurityPriceData
        fields = ("id", "security", "price_at", "high_price", "low_price", "current_price")


class DailySecurityPriceDataDetailSelectSerializer(DailySecurityPriceDataListSerializer):
    security_detail = SecurityParentSerializer(source="security", read_only=True)

    class Meta:
        model = DailySecurityPriceData
        fields = "__all__"
