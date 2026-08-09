"""
화면 전용 조회 엔드포인트.

CRUD 로 안 떨어지는 두 화면(홈 요약 / 타임라인)만 여기서 처리한다.
응답은 core.views.response.success_response 포맷을 그대로 따른다.
"""
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from core.views.response import success_response

from asset_planning.services import review_service, summary_service, timeline_service


def _current_user_id(request) -> str | None:
    """DEBUG 에서는 AllowAny 라 request.user 가 익명일 수 있어 쿼리 파라미터를 허용한다."""
    user = getattr(request, "user", None)
    if user is not None and getattr(user, "is_authenticated", False):
        return user.user_id
    return request.query_params.get("user_id")


class HomeSummaryView(APIView):
    """GET /api/planner/home/summary/ — 토스형 홈 카드 스택 한 번에."""

    permission_classes = [AllowAny]

    def get(self, request):
        data = summary_service.home_summary(_current_user_id(request))
        return success_response(data)


class TimelineView(APIView):
    """
    GET /api/planner/timeline/?plan_id=&months_back=

    실적선 / 과거 예상선 / 시나리오 부채꼴 / 일지 마커를 한 번에 내려준다.
    프론트 TimelineChart 는 이 응답만 받아서 그린다.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        plan_id = request.query_params.get("plan_id")
        months_back = int(request.query_params.get("months_back") or 12)
        data = timeline_service.build_timeline(
            _current_user_id(request),
            plan_id=int(plan_id) if plan_id else None,
            months_back=months_back,
        )
        return success_response(data)


class ReviewDigestView(APIView):
    """GET /api/planner/review/{review_id}/digest/ — 회고 화면의 자동 요약."""

    permission_classes = [AllowAny]

    def get(self, request, review_id: int):
        return success_response(review_service.review_digest(review_id))
