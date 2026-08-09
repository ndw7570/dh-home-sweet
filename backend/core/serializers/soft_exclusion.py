"""소프트딜리트 컬럼을 클라이언트 손에서 떼어 놓는 시리얼라이저.

`is_deleted` 는 읽기는 되지만 쓰기는 막는다. 삭제는 DELETE / restore 액션으로만
일어나야 한다. PATCH 본문에 `is_deleted: false` 를 실어 보내 삭제된 행을 되살리는
경로가 열려 있으면, 소프트딜리트가 감사(監査) 장치로서 의미를 잃는다.
"""

from rest_framework import serializers


class SoftDeleteSerializer(serializers.ModelSerializer):
    is_deleted = serializers.BooleanField(read_only=True)


class SoftDeleteWritableSerializer(serializers.ModelSerializer):
    """관리 화면 등에서 is_deleted 를 직접 만져야 할 때만 쓴다."""
