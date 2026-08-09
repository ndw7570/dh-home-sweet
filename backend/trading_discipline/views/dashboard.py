"""화면 전용 조회.

CRUD 로 안 떨어지는 것들만 여기 모은다. ViewSet 에 `@action` 으로 매달지 않고
`APIView` 로 분리한 이유는, 화면이 바뀌어도 도메인 CRUD 가 흔들리지 않게 하기 위해서다.

  GET /cascade/            계획 5계층 트리
  GET /security/{id}/plans/ 한 종목에 걸린 계획 위아래
  GET /home/board/         오늘의 규율 (홈 한 방 조회)
  GET /execution/compare/  계획 대비 이행 대조
  GET /performance/summary/ 성과 집계
  GET /ai/digest/          AI 의견 요약
  GET /meta/choices/       코드값 전체 (프론트 셀렉트박스)
"""

from datetime import date

from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework.exceptions import ValidationError
from rest_framework.views import APIView

from core.views.response import success_response
from trading_discipline.constants.choices import choice_payload
from trading_discipline.services import (
    ai_service,
    cascade_service,
    discipline_service,
    execution_service,
    performance_service,
)

#: 이 화면들은 CRUD 가 아니라 조립된 결과라 시리얼라이저가 없다.
#: drf-spectacular 가 응답 모양을 못 맞히므로 자유형 객체라고 못박아 둔다.
freeform = extend_schema(responses=OpenApiTypes.OBJECT)


def _date_param(request, key: str) -> date | None:
    raw = request.query_params.get(key)
    if not raw:
        return None
    try:
        return date.fromisoformat(raw)
    except ValueError as exc:
        raise ValidationError({key: f"YYYY-MM-DD 형식이어야 한다: {raw}"}) from exc


def _int_param(request, key: str) -> int | None:
    raw = request.query_params.get(key)
    if raw in (None, ""):
        return None
    try:
        return int(raw)
    except ValueError as exc:
        raise ValidationError({key: f"정수여야 한다: {raw}"}) from exc


def _bool_param(request, key: str, default: bool) -> bool:
    raw = request.query_params.get(key)
    if raw is None:
        return default
    return str(raw).lower() in ("1", "true", "yes", "on")


@freeform
class CascadeView(APIView):
    """GET /cascade/?on=YYYY-MM-DD&account_id=&only_active=1

    계획 화면이 통째로 받아 가는 트리. 어디에도 못 붙은 주계획은
    `orphan_weekly_plans` 로 따로 온다.
    """

    def get(self, request):
        data = cascade_service.build_cascade(
            on=_date_param(request, "on"),
            account_id=_int_param(request, "account_id"),
            only_active=_bool_param(request, "only_active", True),
        )
        return success_response(data)


@freeform
class SecurityPlansView(APIView):
    """GET /security/{security_id}/plans/?on=YYYY-MM-DD"""

    def get(self, request, security_id: int):
        data = cascade_service.plans_for_security(security_id, on=_date_param(request, "on"))
        return success_response(data)


@freeform
class HomeBoardView(APIView):
    """GET /home/board/?on=YYYY-MM-DD — 홈 한 방 조회."""

    def get(self, request):
        return success_response(discipline_service.today_board(on=_date_param(request, "on")))


@freeform
class ExecutionCompareView(APIView):
    """GET /execution/compare/?security_id=&date_from=&date_to="""

    def get(self, request):
        data = execution_service.compare_with_plan(
            security_id=_int_param(request, "security_id"),
            date_from=_date_param(request, "date_from"),
            date_to=_date_param(request, "date_to"),
        )
        return success_response(data)


@freeform
class PerformanceSummaryView(APIView):
    """GET /performance/summary/?period_type=&date_from=&date_to=&security_id="""

    def get(self, request):
        data = performance_service.summarize(
            period_type=request.query_params.get("period_type"),
            date_from=_date_param(request, "date_from"),
            date_to=_date_param(request, "date_to"),
            security_id=_int_param(request, "security_id"),
        )
        return success_response(data)


@freeform
class AiDigestView(APIView):
    """GET /ai/digest/?on=YYYY-MM-DD"""

    def get(self, request):
        return success_response(ai_service.digest(on=_date_param(request, "on")))


@freeform
class AiFeedbackForView(APIView):
    """GET /ai/feedback-for/?table_name=&object_ids=1,2,3&include_expired=0"""

    def get(self, request):
        table_name = request.query_params.get("table_name")
        if not table_name:
            raise ValidationError({"table_name": "필수 파라미터다."})
        raw_ids = request.query_params.get("object_ids", "")
        object_ids = [int(v) for v in raw_ids.split(",") if v.strip().isdigit()] or None
        try:
            data = ai_service.feedback_for(
                table_name,
                object_ids=object_ids,
                include_expired=_bool_param(request, "include_expired", False),
                on=_date_param(request, "on"),
            )
        except ValueError as exc:
            raise ValidationError({"table_name": str(exc)}) from exc
        return success_response(data)


@freeform
class ChoicesView(APIView):
    """GET /meta/choices/ — 코드값 전체.

    SQL 이 VARCHAR(20) 으로만 잡아 둔 값들을 프론트가 여기서 한 번에 받아 간다.
    라벨 매핑을 프론트에 복사해 두지 않기 위한 엔드포인트다.
    """

    def get(self, request):
        return success_response(choice_payload())
