"""계획 5계층이 공유하는 동작.

필드는 각 모델이 직접 선언한다(DDL 과 컬럼 집합을 눈으로 대조하기 위해서).
여기 있는 것은 필드가 아니라 계산 로직뿐이다.
"""

from datetime import date

from django.core.validators import MaxValueValidator, MinValueValidator

from trading_discipline.constants.choices import CONFIDENCE_MAX, CONFIDENCE_MIN

CONFIDENCE_VALIDATORS = [
    MinValueValidator(CONFIDENCE_MIN),
    MaxValueValidator(CONFIDENCE_MAX),
]


class PlanPeriodMixin:
    """`valid_from` ~ `valid_until` 을 가진 계획이 공통으로 쓰는 판정."""

    PERIOD_LEVEL = "PLAN"

    def is_active_on(self, on: date | None = None) -> bool:
        on = on or date.today()
        if not self.valid_from or not self.valid_until:
            return False
        return self.valid_from <= on <= self.valid_until

    @property
    def is_current(self) -> bool:
        return self.is_active_on()

    @property
    def period_label(self) -> str:
        if not self.valid_from or not self.valid_until:
            return "기간 미정"
        return f"{self.valid_from:%Y.%m.%d} ~ {self.valid_until:%Y.%m.%d}"

    def clean(self):
        from django.core.exceptions import ValidationError

        super().clean()
        if self.valid_from and self.valid_until and self.valid_from > self.valid_until:
            raise ValidationError({"valid_until": "유효종료일이 유효시작일보다 앞설 수 없다."})
