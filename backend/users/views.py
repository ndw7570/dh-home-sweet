from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from core.views.common import BaseCommonViewSet
from core.views.response import success_response
from users.models import Person, UserProfile
from users.serializers import PersonSerializer, UserProfileSerializer, UserSignUpSerializer

try:
    from core.constants.filters import PERSON_FILTER_FIELDS
except ImportError:  # pragma: no cover
    PERSON_FILTER_FIELDS = {}


class MeView(APIView):
    """GET /api/auth/me/ — 로그인한 유저 자신."""

    permission_classes = (IsAuthenticated,)

    def get(self, request):
        return success_response(UserProfileSerializer(request.user).data)

    def patch(self, request):
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(serializer.data, message="updated")


class SignUpView(APIView):
    """POST /api/auth/signup/ — 개인용 도구라 가입은 열어 두되 프로필만 만든다."""

    permission_classes = (AllowAny,)

    def post(self, request):
        serializer = UserSignUpSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return success_response(
            UserProfileSerializer(user).data,
            message="created",
            status=status.HTTP_201_CREATED,
        )


class PersonViewSet(BaseCommonViewSet):
    """사람 CRUD."""

    queryset = Person.objects.all()
    FILTER_FIELDS = PERSON_FILTER_FIELDS
    list_serializer_class = PersonSerializer
    detail_serializer_class = PersonSerializer
    select_list = ("user",)
    select_detail = ("user",)
    default_ordering = ("-person_id",)
