"""도메인 시리얼라이저 베이스.

22개 모델이 전부 이 둘 중 하나를 상속한다.
  DomainSerializer         — 소프트딜리트 보호 + 코드값 라벨 자동 첨부
  DomainPropertySerializer — 위 + 모델 계산 프로퍼티 노출
"""

from core.serializers.mixins import ChoiceLabelMixin, PropertyFieldsMixin
from core.serializers.soft_exclusion import SoftDeleteSerializer


class DomainSerializer(ChoiceLabelMixin, SoftDeleteSerializer):
    pass


class DomainPropertySerializer(PropertyFieldsMixin, DomainSerializer):
    pass
