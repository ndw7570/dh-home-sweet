"""페이지네이션.

`?no_page=1` 이면 페이지네이션을 끄고 전량 반환한다.
셀렉트박스 채우기(계좌 목록, 종목 목록, 필수원칙 목록)처럼 전량이 필요한 호출이 많다.
"""

from rest_framework.pagination import PageNumberPagination


class CommonPageNumberPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 200

    def paginate_queryset(self, queryset, request, view=None):
        if str(request.query_params.get("no_page", "")).lower() in ("1", "true", "yes"):
            return None
        return super().paginate_queryset(queryset, request, view=view)

    def build_meta(self):
        """success_response 의 meta 로 넘길 페이지 정보."""
        if not hasattr(self, "page") or self.page is None:
            return None
        return {
            "count": self.page.paginator.count,
            "page": self.page.number,
            "page_size": self.get_page_size(self.request),
            "total_pages": self.page.paginator.num_pages,
            "next": self.get_next_link(),
            "previous": self.get_previous_link(),
        }
