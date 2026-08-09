"""유저 — investments-nam.sql 의 `user_profile` / `person`.

DDL 과 다른 점 두 가지를 여기 적어 둔다.

1. `password` / `last_login` 컬럼이 DDL 에 없다.
   AbstractBaseUser 가 두 컬럼을 요구한다. 로그인이 필요한 이상 뺄 수 없어서 추가했다.
   DDL 쪽에도 반영해 두어야 마이그레이션과 실제 테이블이 어긋나지 않는다.

2. `person` 은 지역·생년월일·별세일자를 갖는다.
   주식 규율 관리에서 이 세 컬럼이 무슨 역할인지 DDL 만으로는 읽히지 않는다.
   일단 SQL 그대로 만들어 두었다. (docs/schema-mapping.md 의 '확인 필요' 참고)
"""

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

from core.db import table
from core.models.common import (
    AllObjectsManager,
    SoftDeleteModel,
    SoftDeleteQuerySet,
)


class UserProfileManager(BaseUserManager):
    """create_user/superuser + 기본 쿼리셋은 살아 있는 유저만."""

    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db).alive()

    def all_with_deleted(self):
        return SoftDeleteQuerySet(self.model, using=self._db)

    def create_user(self, user_id, password=None, **extra_fields):
        if not user_id:
            raise ValueError("user_id 는 필수다.")
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
        extra_fields.setdefault("phone_number", "")
        return self.create_user(user_id, password=password, **extra_fields)


class UserProfile(AbstractBaseUser, PermissionsMixin, SoftDeleteModel):
    """유저 — `trading_discipline_management.user_profile`."""

    user_id = models.CharField(primary_key=True, max_length=200, db_comment="유저아이디")
    first_name = models.CharField(max_length=100, null=True, blank=True, db_comment="성")
    last_name = models.CharField(max_length=100, null=True, blank=True, db_comment="이름")
    phone_number = models.CharField(max_length=30, default="", db_comment="연락처")

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    created_at = models.DateField(auto_now_add=True, null=True, blank=True, db_comment="생성일")
    updated_at = models.DateField(auto_now=True, null=True, blank=True, db_comment="수정일")
    remarks = models.TextField(null=True, blank=True, db_comment="비고")

    objects = UserProfileManager()
    all_objects = AllObjectsManager()

    USERNAME_FIELD = "user_id"
    REQUIRED_FIELDS = []

    class Meta:
        db_table = table("user_profile")
        verbose_name = "유저"
        verbose_name_plural = "유저"

    def __str__(self):
        return self.display_name

    @property
    def display_name(self) -> str:
        full = f"{self.first_name or ''}{self.last_name or ''}".strip()
        return full or self.user_id


class Person(SoftDeleteModel):
    """사람 — `trading_discipline_management.person`."""

    person_id = models.AutoField(primary_key=True, db_comment="사람아이디")
    user = models.ForeignKey(
        UserProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_column="user_id",
        related_name="persons",
        db_comment="유저아이디",
    )
    first_name = models.CharField(max_length=100, null=True, blank=True, db_comment="성")
    last_name = models.CharField(max_length=100, null=True, blank=True, db_comment="이름")
    region = models.CharField(max_length=100, null=True, blank=True, db_comment="지역")
    birth_date = models.DateField(null=True, blank=True, db_comment="생년월일")
    death_date = models.DateField(null=True, blank=True, db_comment="별세일자")

    created_at = models.DateField(auto_now_add=True, null=True, blank=True, db_comment="생성일")
    updated_at = models.DateField(auto_now=True, null=True, blank=True, db_comment="수정일")
    remarks = models.TextField(null=True, blank=True, db_comment="비고")

    class Meta:
        db_table = table("person")
        verbose_name = "사람"
        verbose_name_plural = "사람"

    def __str__(self):
        return f"{self.first_name or ''}{self.last_name or ''}".strip() or f"Person#{self.person_id}"
