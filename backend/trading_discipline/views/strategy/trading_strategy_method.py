from django.db import transaction
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError

from core.constants.filters import TRADING_STRATEGY_METHOD_FILTER_FIELDS
from core.views.common import BaseCommonViewSet
from core.views.response import success_response
from trading_discipline.models import TradingStrategy, TradingStrategyMethod
from trading_discipline.serializers.strategy import (
    TradingStrategyMethodDetailSelectSerializer,
    TradingStrategyMethodListSerializer,
)


class TradingStrategyMethodViewSet(BaseCommonViewSet):
    """매수매도방법 CRUD. 상세를 부르면 n차 분할표가 전략종류별로 묶여서 온다.

    분할 계획 한 벌의 머리다 — 어느 종목을 어느 가격 기준으로 나눠 살(팔) 것인가.
    실제 n차 줄은 `trading_strategies` 에 자식으로 매달린다.

    ## 템플릿

    `price_data` 가 비어 있는 방법은 **종목·시점과 무관한 재사용 템플릿**이다.
    "3단 보수적 분할" 처럼 비율만 정해 두고, 실제 계획을 만들 때 `copy-from` 으로
    가져다 쓴다.

        GET  ?template=1                 템플릿만
        GET  ?template=0                 실제 계획만 (가격데이터가 붙은 것)
        POST {id}/copy-from/ {"source": 템플릿id}
    """

    queryset = TradingStrategyMethod.objects.all()
    FILTER_FIELDS = TRADING_STRATEGY_METHOD_FILTER_FIELDS
    list_serializer_class = TradingStrategyMethodListSerializer
    detail_serializer_class = TradingStrategyMethodDetailSelectSerializer
    select_list = ("price_data",)
    select_detail = ("price_data__security",)
    prefetch_list = ("strategies",)
    prefetch_detail = ("strategies",)
    default_ordering = ("-reference_at", "-id")

    @action(detail=True, methods=["post"], url_path="copy-from")
    def copy_from(self, request, *args, **kwargs):
        """다른 방법의 분할표를 이 방법으로 복사한다. **덮어쓰기다.**

            POST /trading-strategy-method/{id}/copy-from/
            { "source": 7 }

        기존 분할표는 지우고 원본의 줄로 갈아 끼운다. 덧붙이면 같은 n차가 두 벌 생겨
        표가 깨지고, 수량 비중 합이 100% 를 넘는다. 분할표는 합이 100% 여야 뜻이 있는
        표라 반쯤 겹친 상태는 틀린 값보다 나쁘다.

        **한 트랜잭션에 처리한다.** 화면에서 줄 수만큼 POST 를 돌리면 3줄 중 2줄만 들어간
        전략이 생기고, 그걸 되돌릴 방법이 없다.

        원본은 템플릿이 아니어도 된다 — 지난달 방법의 분할표를 이번 달로 가져오는 것도
        같은 동작이다.
        """
        target = self.get_object()

        raw_source = request.data.get("source")
        if raw_source in (None, ""):
            raise ValidationError({"source": "복사해 올 방법의 id 를 지정해야 한다."})

        source = TradingStrategyMethod.objects.filter(pk=raw_source).first()
        if source is None:
            raise ValidationError({"source": f"방법을 찾지 못했다: {raw_source}"})
        if source.pk == target.pk:
            raise ValidationError({"source": "자기 자신을 복사할 수는 없다."})

        rows = list(source.strategies.filter(is_deleted=False).order_by("strategy_type", "step_no"))
        if not rows:
            raise ValidationError(
                {
                    "source": (
                        f"'{source.policy_name or source.pk}' 에는 분할표가 없다. "
                        "빈 표로 덮어쓰면 이 방법의 분할표만 사라진다."
                    )
                }
            )

        with transaction.atomic():
            existing = target.strategies.filter(is_deleted=False)
            removed = existing.count()
            existing.delete()  # 소프트딜리트 — 잘못 덮었을 때 되살릴 수 있어야 한다
            TradingStrategy.objects.bulk_create(
                [
                    TradingStrategy(
                        method=target,
                        strategy_type=row.strategy_type,
                        step_no=row.step_no,
                        price_ratio=row.price_ratio,
                        quantity_ratio=row.quantity_ratio,
                        # 업종은 원본을 따르지 않는다. 이 방법이 이미 갖고 있는 업종이 맞다
                        # — 템플릿의 업종을 끌고 오면 반도체 템플릿을 쓴 자동차 계획이
                        # 반도체로 뒤바뀐다.
                        sector=target.sector,
                    )
                    for row in rows
                ]
            )

        serializer = self.get_serializer(target)
        return success_response(
            {**serializer.data, "copied": len(rows), "removed": removed},
            message="copied",
        )
