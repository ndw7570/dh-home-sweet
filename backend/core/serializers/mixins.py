"""시리얼라이저 공통 믹스인."""

from rest_framework import serializers


class ChoiceLabelMixin(serializers.ModelSerializer):
    """`choices` 가 걸린 필드마다 `<필드명>_label` 을 자동으로 붙인다.

    프론트가 `LONG` 을 받아서 '매수' 로 바꾸는 매핑 테이블을 따로 들고 있으면,
    코드값을 하나 추가할 때마다 백엔드와 프론트 두 군데를 고쳐야 한다.
    라벨은 서버가 만들어서 같이 내려 준다.
    """

    def to_representation(self, instance):
        data = super().to_representation(instance)
        for field in instance._meta.concrete_fields:
            if field.choices and field.name in data:
                getter = getattr(instance, f"get_{field.name}_display", None)
                if getter is not None:
                    data[f"{field.name}_label"] = getter()
        return data


class PropertyFieldsMixin:
    """모델의 계산 프로퍼티를 응답에 얹는다.

    `PROPERTY_FIELDS = ("market_value", "risk_reward")` 처럼 선언하면
    그 이름의 프로퍼티를 읽어서 같은 이름으로 내보낸다. Decimal 은 문자열이 아니라
    숫자로 나가야 프론트에서 그대로 계산에 쓸 수 있어서 float 로 눕힌다.
    """

    PROPERTY_FIELDS: tuple = ()

    def to_representation(self, instance):
        data = super().to_representation(instance)
        for name in self.PROPERTY_FIELDS:
            value = getattr(instance, name, None)
            data[name] = float(value) if hasattr(value, "quantize") else value
        return data
