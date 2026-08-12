"""시장방향 → 뉴스 → 종목.

`news` 를 새로 만들고, `affected_securities` 의 부모를 시장방향에서 뉴스로 옮긴다.

`affected_securities` 는 컬럼이 통째로 바뀐다(PK 이름, 부모 FK, 종목 FK 컬럼명).
Django 의 자동 감지로는 기본키 교체를 안전하게 못 만들어서 **테이블을 지우고 다시
만든다**. 이 마이그레이션을 쓰기 전 운영 DB 의 `affected_securities` 는 0건이었다.
행이 있는 DB 에 적용하려면 먼저 옮길 곳(뉴스)을 만들고 데이터를 이관해야 한다.
"""

import django.db.models.deletion
from django.db import migrations, models

import core.db


class Migration(migrations.Migration):

    dependencies = [
        ("trading_discipline", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="News",
            fields=[
                ("is_deleted", models.BooleanField(db_comment="삭제여부", default=False)),
                (
                    "created_at",
                    models.DateField(auto_now_add=True, db_comment="생성일", null=True),
                ),
                (
                    "updated_at",
                    models.DateField(auto_now=True, db_comment="수정일", null=True),
                ),
                ("remarks", models.TextField(blank=True, db_comment="비고", null=True)),
                (
                    "id",
                    models.AutoField(db_comment="뉴스ID", primary_key=True, serialize=False),
                ),
                (
                    "direction",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("UP", "상승"),
                            ("DOWN", "하락"),
                            ("SIDEWAYS", "횡보"),
                            ("VOLATILE", "변동성확대"),
                        ],
                        db_comment="방향",
                        max_length=20,
                        null=True,
                    ),
                ),
                (
                    "factor_type",
                    models.CharField(
                        blank=True,
                        choices=[
                            ("RATE", "금리"),
                            ("FX", "환율"),
                            ("COMMODITY", "원자재"),
                            ("POLICY", "정책/규제"),
                            ("EARNINGS", "실적"),
                            ("GEOPOLITICS", "지정학"),
                            ("LIQUIDITY", "유동성"),
                            ("SENTIMENT", "투자심리"),
                        ],
                        db_comment="요인종류",
                        max_length=20,
                        null=True,
                    ),
                ),
                ("content", models.TextField(blank=True, db_comment="내용", null=True)),
                ("rationale", models.TextField(blank=True, db_comment="투자근거", null=True)),
                (
                    "factor_value",
                    models.DecimalField(
                        blank=True,
                        db_comment="수치",
                        decimal_places=2,
                        max_digits=5,
                        null=True,
                    ),
                ),
                (
                    "affected_targets",
                    models.JSONField(blank=True, db_comment="영향대상", null=True),
                ),
                (
                    "market_direction",
                    models.ForeignKey(
                        blank=True,
                        db_column="market_directions_id",
                        db_comment="시장방향ID",
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="news_items",
                        to="trading_discipline.marketdirection",
                    ),
                ),
            ],
            options={
                "verbose_name": "뉴스",
                "verbose_name_plural": "뉴스",
                "db_table": core.db.table("news"),
            },
        ),
        migrations.AddIndex(
            model_name="news",
            index=models.Index(fields=["market_direction"], name="news_mdir_idx"),
        ),
        migrations.AddIndex(
            model_name="news",
            index=models.Index(
                fields=["factor_type", "direction"], name="news_factor_dir_idx"
            ),
        ),
        # ── affected_securities 를 새 모양으로 다시 세운다 ──────────────
        migrations.RemoveConstraint(
            model_name="affectedsecurity",
            name="affected_security_unique_alive",
        ),
        migrations.DeleteModel(name="AffectedSecurity"),
        migrations.CreateModel(
            name="AffectedSecurity",
            fields=[
                ("is_deleted", models.BooleanField(db_comment="삭제여부", default=False)),
                (
                    "created_at",
                    models.DateField(auto_now_add=True, db_comment="생성일", null=True),
                ),
                (
                    "updated_at",
                    models.DateField(auto_now=True, db_comment="수정일", null=True),
                ),
                ("remarks", models.TextField(blank=True, db_comment="비고", null=True)),
                (
                    "affected_security_id",
                    models.AutoField(
                        db_comment="영향받는종목ID", primary_key=True, serialize=False
                    ),
                ),
                (
                    "news",
                    models.ForeignKey(
                        blank=True,
                        db_column="id",
                        db_comment="뉴스ID",
                        null=True,
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="affected_securities",
                        to="trading_discipline.news",
                    ),
                ),
                (
                    "security",
                    models.ForeignKey(
                        db_column="security_id",
                        db_comment="종목ID",
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="news_mentions",
                        to="trading_discipline.security",
                    ),
                ),
            ],
            options={
                "verbose_name": "영향종목",
                "verbose_name_plural": "영향종목",
                "db_table": core.db.table("affected_securities"),
            },
        ),
        migrations.AddIndex(
            model_name="affectedsecurity",
            index=models.Index(fields=["security"], name="affected_sec_idx"),
        ),
        migrations.AddConstraint(
            model_name="affectedsecurity",
            constraint=models.UniqueConstraint(
                condition=models.Q(("is_deleted", False)),
                fields=("news", "security"),
                name="affected_security_unique_alive",
            ),
        ),
    ]
