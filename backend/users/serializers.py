from rest_framework import serializers

from core.serializers.soft_exclusion import SoftDeleteSerializer
from users.models import Person, UserProfile


class UserProfileSerializer(SoftDeleteSerializer):
    display_name = serializers.CharField(read_only=True)

    class Meta:
        model = UserProfile
        fields = (
            "user_id",
            "first_name",
            "last_name",
            "display_name",
            "phone_number",
            "is_active",
            "is_staff",
            "created_at",
            "updated_at",
            "remarks",
            "is_deleted",
        )
        read_only_fields = ("created_at", "updated_at", "is_staff")


class UserSignUpSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = UserProfile
        fields = ("user_id", "password", "first_name", "last_name", "phone_number")

    def create(self, validated_data):
        password = validated_data.pop("password")
        return UserProfile.objects.create_user(password=password, **validated_data)


class PersonSerializer(SoftDeleteSerializer):
    class Meta:
        model = Person
        fields = "__all__"
