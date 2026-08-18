from django.db import transaction
from rest_framework import serializers

from trading_discipline.constants.choices import PeriodType
from trading_discipline.models import MandatoryPrinciple, MandatoryPrincipleScope
from trading_discipline.serializers._base import DomainSerializer


class MandatoryPrincipleListSerializer(DomainSerializer):
    """필수원칙. `period_types` 로 이 원칙을 어느 계층에서 꺼내 볼지 정한다.

    적용기간은 별도 테이블(`mandatory_principle_scopes`) 이지만, 화면에서는 체크박스
    몇 개일 뿐이라 문자열 배열 하나로 주고받는다. 원칙 하나를 저장하려고 관계 테이블에
    별도 요청을 두 번 보내게 하면, 중간에 실패했을 때 원칙은 저장됐는데 적용기간은
    빠진 상태가 남는다.

        "period_types": ["DAY", "MONTH"]

    DAY 를 넣으면 이행 화면에 체크리스트로 뜨고 Y/N 입력이 필수가 된다.
    나머지(WEEK/MONTH/QUARTER/YEAR) 는 해당 계획 작성 화면에 문장으로 표시된다.
    """

    period_types = serializers.ListField(
        child=serializers.ChoiceField(choices=PeriodType.choices),
        required=False,
        allow_empty=True,
        help_text="적용기간. 비우면 어느 화면에도 나오지 않는다.",
    )

    class Meta:
        model = MandatoryPrinciple
        fields = "__all__"

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # prefetch 가 걸려 있으면 추가 쿼리 없이 읽는다(뷰셋이 prefetch_related 로 붙인다).
        data["period_types"] = [s.period_type for s in instance.scopes.all()]
        return data

    def validate_content(self, value):
        if not (value or "").strip():
            raise serializers.ValidationError("필수원칙에 내용이 비어 있으면 지킬 수가 없다.")
        return value

    def validate_period_types(self, value):
        seen = set()
        for period in value:
            if period in seen:
                raise serializers.ValidationError(f"적용기간이 중복됐다: {period}")
            seen.add(period)
        return value

    @transaction.atomic
    def create(self, validated_data):
        periods = validated_data.pop("period_types", None)
        instance = super().create(validated_data)
        self._sync_scopes(instance, periods)
        return instance

    @transaction.atomic
    def update(self, instance, validated_data):
        # 키가 아예 안 왔으면 손대지 않는다. 빈 배열([])은 "전부 해제" 라는 뜻이라 다르다.
        periods = validated_data.pop("period_types", None)
        instance = super().update(instance, validated_data)
        self._sync_scopes(instance, periods)
        return instance

    @staticmethod
    def _sync_scopes(instance, periods):
        """체크된 기간 집합에 맞춘다. 없는 것은 만들고 빠진 것은 지운다.

        이 테이블에는 소프트딜리트가 없다(모델 docstring 참조). 체크박스를 껐다 켜기를
        반복해도 행이 쌓이지 않고, 조인 조회가 해제한 기간을 잡는 일도 없다.
        """
        if periods is None:
            return
        wanted = set(periods)
        existing = {s.period_type: s for s in instance.scopes.all()}

        MandatoryPrincipleScope.objects.bulk_create(
            [
                MandatoryPrincipleScope(principle=instance, period_type=period)
                for period in wanted - existing.keys()
            ]
        )
        stale = [scope.id for period, scope in existing.items() if period not in wanted]
        if stale:
            MandatoryPrincipleScope.objects.filter(id__in=stale).delete()


class MandatoryPrincipleDetailSelectSerializer(MandatoryPrincipleListSerializer):
    pass


class MandatoryPrincipleParentSerializer(serializers.ModelSerializer):
    """이행 점검·계획 화면에 원칙이 딸려 나갈 때 쓰는 최소 형태."""

    class Meta:
        model = MandatoryPrinciple
        fields = ("id", "priority", "content")
