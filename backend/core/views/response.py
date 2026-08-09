"""응답 포맷 — 성공/실패 모두 같은 봉투에 담는다.

    { "success": bool, "message": str, "meta": object|null, "results": any }

프론트 `api/client.js` 가 이 봉투를 벗겨서 `results` 만 돌려주기 때문에,
어떤 엔드포인트든 이 모양을 벗어나면 프론트에서 조용히 undefined 가 된다.
"""

from rest_framework import status as http_status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler


def success_response(results=None, message="ok", meta=None, status=http_status.HTTP_200_OK):
    return Response(
        {"success": True, "message": message, "meta": meta, "results": results},
        status=status,
    )


def error_response(message="error", results=None, meta=None, status=http_status.HTTP_400_BAD_REQUEST):
    return Response(
        {"success": False, "message": message, "meta": meta, "results": results},
        status=status,
    )


def _flatten_detail(detail):
    """DRF 의 중첩 에러를 사람이 읽는 한 줄로 눌러 준다."""
    if isinstance(detail, dict):
        parts = []
        for key, value in detail.items():
            parts.append(f"{key}: {_flatten_detail(value)}")
        return " / ".join(parts)
    if isinstance(detail, (list, tuple)):
        return ", ".join(_flatten_detail(v) for v in detail)
    return str(detail)


def common_exception_handler(exc, context):
    """DRF 예외도 success_response 와 같은 봉투로 내보낸다."""
    response = drf_exception_handler(exc, context)
    if response is None:
        return None

    detail = response.data
    message = _flatten_detail(detail.get("detail") if isinstance(detail, dict) and "detail" in detail else detail)

    response.data = {
        "success": False,
        "message": message or "error",
        "meta": None,
        "results": detail,
    }
    return response
