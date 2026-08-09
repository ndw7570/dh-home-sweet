"""인증 엔드포인트. 로그인 방식은 확정 전이므로 /me/ 만 열어 둔다."""
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from core.views.response import success_response

from users.serializers import MeSerializer


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return success_response(MeSerializer(request.user).data)
