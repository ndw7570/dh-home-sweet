from rest_framework import serializers

from users.models import UserProfile


class MeSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = (
            "user_id",
            "nickname",
            "email",
            "base_currency",
            "review_period_type",
            "is_staff",
        )
