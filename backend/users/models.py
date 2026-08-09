from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

from core.models.common import SoftDeleteManager, SoftDeleteModel


class UserProfileManager(BaseUserManager, SoftDeleteManager):
    """BaseUserManager(create_user/superuser) + SoftDeleteManager(alive 기본)."""

    def create_user(self, user_id, password=None, **extra_fields):
        if not user_id:
            raise ValueError("user_id is required")
        user = self.model(user_id=user_id, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, user_id, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(user_id, password=password, **extra_fields)


class UserProfile(AbstractBaseUser, PermissionsMixin, SoftDeleteModel):
    """유저. 개인용 도구이므로 소셜/로컬 로그인 모두를 열어 둔다."""

    user_id = models.CharField(primary_key=True, max_length=200, db_comment="유저아이디")
    nickname = models.CharField(max_length=100, blank=True, db_comment="표시 이름")
    email = models.EmailField(null=True, blank=True, db_comment="이메일")
    base_currency = models.CharField(max_length=3, default="KRW", db_comment="기준 통화")
    review_period_type = models.CharField(
        max_length=20, default="MONTH", db_comment="회고 주기 (MONTH/QUARTER)"
    )

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True, db_comment="생성일")
    updated_at = models.DateTimeField(auto_now=True, db_comment="수정일")
    remarks = models.TextField(null=True, blank=True, db_comment="비고")

    objects = UserProfileManager()

    USERNAME_FIELD = "user_id"
    REQUIRED_FIELDS = []

    class Meta:
        db_table = '"planner"."user_profile"'

    def __str__(self):
        return self.nickname or self.user_id
