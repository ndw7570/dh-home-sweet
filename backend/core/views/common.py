"""BaseCommonViewSet — 도메인 ViewSet 22개가 전부 이걸 상속한다.

여기서 책임지는 것:
  1. strict 쿼리 검증  — FILTER_FIELDS 화이트리스트에 없는 파라미터가 오면 400
     (FILTER_FIELDS 의 값은 lookup 문자열, `__in` 으로 끝나는 다중값 lookup,
      또는 한 파라미터로 여러 조건을 AND 로 거는 lookup 튜플)
  2. list / detail 시리얼라이저 분기
  3. select_related / prefetch_related 를 list·detail 각각 다르게
  4. 소프트딜리트 모드 (`?soft_delete_mode=alive|deleted|all`)
  5. 모든 응답을 success_response 봉투에 담기
  6. `PATCH /{id}/restore/` 복구 액션
  7. `DELETE /{id}/purge/` 물리 삭제 액션 (이미 소프트딜리트된 행만)

1번이 이 클래스의 존재 이유다. `?symbol=005930` 을 `?smybol=005930` 으로 오타 내면
필터가 조용히 무시되고 전체 목록이 나온다. 그 상태로 화면을 믿으면 판단이 오염된다.
그래서 모르는 파라미터는 조용히 넘기지 않고 400 으로 세운다.
"""

from django.conf import settings
from django.core.exceptions import FieldError
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import ProtectedError, RestrictedError
from rest_framework import status as http_status
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError

from core.views.response import success_response

try:
    from core.constants.filters import EXCLUDE_FROM_STRICT_CHECK
except ImportError:  # pragma: no cover
    EXCLUDE_FROM_STRICT_CHECK = set()

_TRUE = ("1", "true", "yes", "on")


def _describe(exc) -> str:
    """예외를 한 줄로. DjangoValidationError 는 messages 로 풀어야 사람이 읽는다
    (str() 하면 `["'bogus' 값은 …"]` 처럼 리스트 표현이 그대로 나온다)."""
    messages = getattr(exc, "messages", None)
    return " ".join(messages) if messages else str(exc)


class BaseCommonViewSet(viewsets.ModelViewSet):
    # 하위 클래스가 채운다
    FILTER_FIELDS: dict = {}
    list_serializer_class = None
    detail_serializer_class = None
    write_serializer_class = None

    select_list: tuple = ()
    select_detail: tuple = ()
    prefetch_list: tuple = ()
    prefetch_detail: tuple = ()
    default_ordering: tuple = ()

    lookup_value_regex = "[^/]+"

    # ── 시리얼라이저 분기 ────────────────────────────────
    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update") and self.write_serializer_class:
            return self.write_serializer_class
        if self.action == "list" and self.list_serializer_class:
            return self.list_serializer_class
        if self.detail_serializer_class:
            return self.detail_serializer_class
        return self.list_serializer_class or super().get_serializer_class()

    # ── 쿼리셋 조립 ──────────────────────────────────────
    def get_queryset(self):
        qs = self._base_queryset()
        qs = self._apply_related(qs)
        qs = self._apply_filters(qs)
        qs = self._apply_ordering(qs)
        return qs

    def _base_queryset(self):
        model = self.queryset.model
        mode = self.request.query_params.get("soft_delete_mode", "alive").lower()
        if mode == "all":
            return model.all_objects.all()
        if mode in ("deleted", "dead"):
            return model.all_objects.filter(is_deleted=True)
        return model.objects.all()

    def _apply_related(self, qs):
        is_detail = self.action not in ("list",)
        select = self.select_detail if is_detail else self.select_list
        prefetch = self.prefetch_detail if is_detail else self.prefetch_list
        if select:
            qs = qs.select_related(*select)
        if prefetch:
            qs = qs.prefetch_related(*prefetch)
        return qs

    def _apply_filters(self, qs):
        params = self.request.query_params
        strict = getattr(settings, "STRICT_QUERY_PARAMS", True)

        unknown = [
            key
            for key in params.keys()
            if key not in self.FILTER_FIELDS and key not in EXCLUDE_FROM_STRICT_CHECK
        ]
        if strict and unknown:
            allowed = sorted(self.FILTER_FIELDS.keys())
            raise ValidationError(
                {
                    "query_params": (
                        f"허용되지 않은 검색 파라미터: {', '.join(sorted(unknown))}. "
                        f"이 엔드포인트가 받는 값: {', '.join(allowed) or '(없음)'}"
                    )
                }
            )

        lookups = {}
        for key, lookup in self.FILTER_FIELDS.items():
            if key not in params:
                continue
            # 값이 튜플이면 한 파라미터가 여러 lookup 을 AND 로 건다.
            # "이 날짜가 시작~종료 구간 안" 처럼 한 질문에 조건이 둘 필요한 경우가 있다
            #   {"impact_on": ("impact_from__lte", "impact_until__gte")}
            # 파라미터를 둘로 쪼개 쓰게 하면(from 이하 + until 이상) 사용자가 매번
            # 두 칸을 같은 날짜로 채워야 해서, 한쪽만 채운 반쪽 질의가 조용히 나간다.
            if isinstance(lookup, (tuple, list)):
                raw = params.get(key)
                if raw in (None, ""):
                    continue
                value = self._coerce(raw)
                for one in lookup:
                    lookups[one] = value
                continue
            if lookup.endswith("__in"):
                values = params.getlist(key)
                if len(values) == 1:
                    values = [v for v in values[0].split(",") if v]
                if values:
                    lookups[lookup] = values
                continue
            if lookup.endswith("__isnull"):
                # `?template=0` 을 그냥 넘기면 Django 가 문자열 "0" 을 truthy 로 읽어
                # 정반대 결과가 나온다. 조용히 틀리는 종류라 여기서 못박는다.
                raw = params.get(key)
                if raw in (None, ""):
                    continue
                lookups[lookup] = str(raw).strip().lower() in _TRUE
                continue
            raw = params.get(key)
            if raw in (None, ""):
                continue
            lookups[lookup] = self._coerce(raw)

        if not lookups:
            return qs
        try:
            return qs.filter(**lookups).distinct()
        except (FieldError, ValueError, DjangoValidationError) as exc:
            # DjangoValidationError 는 값이 그 컬럼 타입이 아닐 때 난다
            # (`?date_from=bogus` → "날짜 형식이 아닙니다"). 안 잡으면 500 으로 새는데,
            # 잘못 친 질의는 서버 잘못이 아니라 요청 잘못이라 400 이어야 한다.
            # 그래야 화면이 에러 메시지를 필드 밑에 붙여 줄 수 있다.
            raise ValidationError({"query_params": _describe(exc)}) from exc

    @staticmethod
    def _coerce(raw: str):
        low = str(raw).strip().lower()
        if low in ("true", "false"):
            return low == "true"
        return raw

    def _apply_ordering(self, qs):
        ordering = self.request.query_params.get("ordering")
        if ordering:
            fields = [f.strip() for f in ordering.split(",") if f.strip()]
            try:
                return qs.order_by(*fields)
            except FieldError as exc:
                raise ValidationError({"ordering": str(exc)}) from exc
        if self.default_ordering:
            return qs.order_by(*self.default_ordering)
        return qs

    # ── 응답 봉투 ────────────────────────────────────────
    def list(self, request, *args, **kwargs):
        qs = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(qs)
        if page is not None:
            data = self.get_serializer(page, many=True).data
            meta = self.paginator.build_meta() if hasattr(self.paginator, "build_meta") else None
            return success_response(data, meta=meta)
        data = self.get_serializer(qs, many=True).data
        return success_response(data, meta={"count": len(data), "page": None})

    def retrieve(self, request, *args, **kwargs):
        return success_response(self.get_serializer(self.get_object()).data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return success_response(
            serializer.data, message="created", status=http_status.HTTP_201_CREATED
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # prefetch_related 로 미리 읽어 둔 관계는 저장 후에도 옛 값을 들고 있다.
        # 중첩 관계를 함께 저장하는 시리얼라이저(필수원칙의 적용기간, 이행의 원칙점검)에서
        # 이걸 안 비우면 "저장은 됐는데 응답에는 반영이 안 된" 것처럼 보인다.
        # DRF 의 UpdateModelMixin 이 하는 처리와 같다.
        if getattr(instance, "_prefetched_objects_cache", None):
            instance._prefetched_objects_cache = {}

        return success_response(serializer.data, message="updated")

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()  # SoftDeleteModel.delete — is_deleted=True
        return success_response(None, message="soft-deleted")

    @action(detail=True, methods=["patch"], url_path="restore")
    def restore(self, request, *args, **kwargs):
        model = self.queryset.model
        instance = model.all_objects.filter(pk=kwargs[self.lookup_field]).first()
        if instance is None:
            raise ValidationError({"detail": "대상을 찾지 못했다."})
        instance.restore()
        return success_response(self.get_serializer(instance).data, message="restored")

    @action(detail=True, methods=["delete"], url_path="purge")
    def purge(self, request, *args, **kwargs):
        """물리 삭제. 행이 DB 에서 사라지고 되돌릴 수 없다.

        **이미 소프트딜리트된 행만** 받는다. 살아 있는 행을 한 방에 지우는 경로는 열지 않는다.
        이 스키마는 물리 삭제를 안 하는 것이 전제(core/models/common.py)라, 그 전제를 깨는
        동작은 "삭제 표시 → 목록에서 확인 → 물리 삭제" 2단계를 거치게 한다. 오타 하나로
        감사 기록이 사라지는 것과, 한 번 더 누르는 것 사이의 교환이다.

        지우려는 행이 다른 행에 PROTECT/RESTRICT 로 물려 있으면 400 으로 세운다.
        (예: 종목을 참조하는 이행이 남아 있는 채로 종목을 지우려는 경우)
        """
        model = self.queryset.model
        instance = model.all_objects.filter(pk=kwargs[self.lookup_field]).first()
        if instance is None:
            raise ValidationError({"detail": "대상을 찾지 못했다."})
        if not instance.is_deleted:
            raise ValidationError(
                {
                    "detail": (
                        "살아 있는 행은 물리 삭제할 수 없다. "
                        "먼저 DELETE 로 삭제 표시한 뒤 다시 요청하라."
                    )
                }
            )
        try:
            instance.hard_delete()
        except (ProtectedError, RestrictedError) as exc:
            # ProtectedError 는 protected_objects, RestrictedError 는 restricted_objects 를 단다.
            blockers = getattr(exc, "protected_objects", None) or getattr(
                exc, "restricted_objects", ()
            )
            raise ValidationError(
                {
                    "detail": (
                        "다른 데이터가 이 행을 참조하고 있어 물리 삭제할 수 없다. "
                        "참조하는 쪽을 먼저 정리하라."
                    ),
                    "blocked_by": [str(obj) for obj in blockers][:20],
                }
            ) from exc
        return success_response(None, message="purged")
