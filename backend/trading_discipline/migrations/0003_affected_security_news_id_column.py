"""`affected_securities` 의 뉴스 FK 컬럼을 `id` → `news_id` 로.

DDL 은 이 컬럼을 `id` 로 잡았지만 따르지 않는다. 이 테이블의 기본키는
`affected_security_id` 다. 기본키가 아닌 컬럼에 `id` 라는 이름을 붙이면 raw SQL·
조인·덤프를 읽는 사람이 전부 한 번씩 틀린다. 이름 하나 아끼자고 만들 위험이 아니다.
ERD 도 `news_id` 로 고쳐야 한다.

컬럼 RENAME 이라 데이터는 그대로 옮겨 간다.
"""

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("trading_discipline", "0002_news_reparent_affected_securities"),
    ]

    operations = [
        migrations.AlterField(
            model_name="affectedsecurity",
            name="news",
            field=models.ForeignKey(
                blank=True,
                db_column="news_id",
                db_comment="뉴스ID",
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="affected_securities",
                to="trading_discipline.news",
            ),
        ),
    ]
