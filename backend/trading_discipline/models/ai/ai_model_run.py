from django.db import models

from core.db import table
from core.models.common import BaseDomainModel
from trading_discipline.constants.choices import RunStatus


class AiModelRun(BaseDomainModel):
    """AI모델 실행 — `ai_model_runs`.

    `model_version` 과 `prompt_version` 을 따로 두고, 입력 스냅샷까지 통째로 남긴다.
    AI 의견을 믿을지 말지는 "어떤 모델이 어떤 프롬프트로 무엇을 보고 말했는가" 를
    재현할 수 있을 때만 판단할 수 있다. 재현이 안 되면 그냥 남의 말이다.
    """

    id = models.AutoField(primary_key=True, db_comment="id")
    model_name = models.CharField(max_length=200, null=True, blank=True, db_comment="모델명")
    model_version = models.CharField(max_length=100, null=True, blank=True, db_comment="모델버전")
    prompt_version = models.CharField(
        max_length=100, null=True, blank=True, db_comment="프롬프트버전"
    )
    started_at = models.DateTimeField(null=True, blank=True, db_comment="시작시각")
    completed_at = models.DateTimeField(null=True, blank=True, db_comment="완료시각")
    input_snapshot_json = models.JSONField(null=True, blank=True, db_comment="입력스냅샷")
    output_json = models.JSONField(null=True, blank=True, db_comment="출력")
    status = models.CharField(
        max_length=20,
        choices=RunStatus.choices,
        default=RunStatus.PENDING,
        null=True,
        blank=True,
        db_comment="상태",
    )

    class Meta:
        db_table = table("ai_model_runs")
        verbose_name = "AI모델실행"
        verbose_name_plural = "AI모델실행"
        indexes = [models.Index(fields=["status", "-started_at"], name="airun_status_started_idx")]

    def __str__(self):
        return f"{self.model_name or 'AI'}@{self.model_version or '?'}"

    @property
    def duration_seconds(self):
        if not self.started_at or not self.completed_at:
            return None
        return (self.completed_at - self.started_at).total_seconds()
