"""소프트딜리트 공통 모델.

investments-nam.sql 의 모든 테이블에 `is_deleted BOOLEAN NOT NULL` 이 있다.
행을 물리 삭제하지 않는 것이 이 스키마의 전제이므로, 그 전제를 모델 층에서 강제한다.
`Model.objects` 는 **살아 있는 행만** 준다. 삭제분까지 보려면 `all_objects` 를 쓴다.

created_at / updated_at 은 SQL 그대로 DATE 다. (자세한 사정은 docs/scaffold-notes.md 참고)
"""

from django.db import models
from django.utils import timezone


class SoftDeleteQuerySet(models.QuerySet):
    def alive(self):
        return self.filter(is_deleted=False)

    def dead(self):
        return self.filter(is_deleted=True)

    def delete(self):
        """QuerySet.delete() 도 소프트딜리트로 돌린다."""
        return self.update(is_deleted=True)

    def hard_delete(self):
        return super().delete()


class SoftDeleteManager(models.Manager):
    """기본 매니저 — 살아 있는 행만 반환한다."""

    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db).alive()

    def all_with_deleted(self):
        return SoftDeleteQuerySet(self.model, using=self._db)

    def deleted_only(self):
        return SoftDeleteQuerySet(self.model, using=self._db).dead()


class AllObjectsManager(models.Manager):
    def get_queryset(self):
        return SoftDeleteQuerySet(self.model, using=self._db)


class SoftDeleteModel(models.Model):
    """모든 도메인 모델의 부모. `is_deleted` 하나만 갖는다.

    remarks / created_at / updated_at 은 테이블마다 있고 없고가 갈려서
    (예: broker_accounts 는 셋 다 없다) 여기에 넣지 않고 각 모델이 직접 선언한다.
    DDL 과 컬럼 집합을 1:1 로 맞추기 위한 선택이다.
    """

    is_deleted = models.BooleanField(default=False, db_comment="삭제여부")

    objects = SoftDeleteManager()
    all_objects = AllObjectsManager()

    class Meta:
        abstract = True

    def delete(self, using=None, keep_parents=False):
        self.is_deleted = True
        update_fields = ["is_deleted"]
        if hasattr(self, "deleted_at"):
            self.deleted_at = timezone.localdate()
            update_fields.append("deleted_at")
        self.save(using=using, update_fields=update_fields)
        return (1, {self._meta.label: 1})

    def hard_delete(self, using=None, keep_parents=False):
        return super().delete(using=using, keep_parents=keep_parents)

    def restore(self, using=None):
        self.is_deleted = False
        update_fields = ["is_deleted"]
        if hasattr(self, "deleted_at"):
            self.deleted_at = None
            update_fields.append("deleted_at")
        self.save(using=using, update_fields=update_fields)
        return self


class TimeStampedModel(models.Model):
    """created_at / updated_at 이 있는 테이블용. SQL 이 DATE 라 DateField 다."""

    created_at = models.DateField(auto_now_add=True, null=True, blank=True, db_comment="생성일")
    updated_at = models.DateField(auto_now=True, null=True, blank=True, db_comment="수정일")

    class Meta:
        abstract = True


class RemarksModel(models.Model):
    """remarks(비고) 가 있는 테이블용."""

    remarks = models.TextField(null=True, blank=True, db_comment="비고")

    class Meta:
        abstract = True


class BaseDomainModel(SoftDeleteModel, TimeStampedModel, RemarksModel):
    """is_deleted + created_at + updated_at + remarks 를 전부 가진 테이블용.

    22개 중 대다수가 여기에 해당한다. 빠진 컬럼이 있는 테이블
    (broker_accounts / securities_loans / quarterly_investment_principles / orders)
    만 SoftDeleteModel 을 직접 상속해서 있는 컬럼만 선언한다.
    """

    class Meta:
        abstract = True
