"""frontend/src/data/mock.js 를 실제 API 응답으로 다시 만든다.

    python manage.py seed_demo --reset
    python manage.py dump_mock

손으로 쓴 목 데이터는 필드명 하나만 어긋나도, 백엔드를 붙이는 순간 화면이 조용히
빈칸이 된다. 실제 응답을 떠서 굳혀 두면 목과 실데이터의 모양이 갈라질 수가 없다.
"""

import json
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.test import Client

BASE = "/api/trading"

HEADER = """// 백엔드 없이 화면을 확인하기 위한 목 데이터.
//
// ⚠ 이 파일은 손으로 고치지 않는다.
// 시드가 들어간 백엔드의 실제 응답을 떠서 생성한 것이라, 필드명과 모양이
// API 계약과 정확히 일치한다. 다시 만들려면:
//
//     cd backend
//     python manage.py seed_demo --reset
//     python manage.py dump_mock
//
// VITE_USE_MOCK=1 일 때만 쓰인다.

"""


class Command(BaseCommand):
    help = "실제 API 응답으로 프론트 목 데이터를 생성한다."

    def add_arguments(self, parser):
        parser.add_argument(
            "--out",
            default=str(Path(settings.BASE_DIR).parent / "frontend" / "src" / "data" / "mock.js"),
        )

    def handle(self, *args, **options):
        # 테스트 클라이언트는 Host 를 'testserver' 로 보낸다.
        if "testserver" not in settings.ALLOWED_HOSTS:
            settings.ALLOWED_HOSTS = [*settings.ALLOWED_HOSTS, "testserver"]

        client = Client()

        def get(path, **params):
            res = client.get(f"{BASE}{path}", params)
            if res.status_code != 200:
                raise CommandError(f"{path} -> {res.status_code}: {res.content[:300]!r}")
            return res.json()["results"]

        securities = get("/security/", no_page=1)
        strategies = get("/trading-strategy/")
        security_id = securities[0]["id"] if securities else None
        strategy_id = strategies[0]["id"] if strategies else None

        if security_id is None:
            raise CommandError("데이터가 비어 있다. 먼저 `manage.py seed_demo` 를 돌린다.")

        exports = {
            "cascade": get("/cascade/"),
            "homeBoard": get("/home/board/"),
            "securityPlans": get(f"/security/{security_id}/plans/"),
            "executionCompare": get("/execution/compare/"),
            "performanceSummary": get("/performance/summary/"),
            "aiDigest": get("/ai/digest/"),
            "aiFeedbackFor": get("/ai/feedback-for/", table_name="weekly_investment_plan"),
            "choices": get("/meta/choices/"),
            "brokerAccounts": get("/broker-account/", no_page=1),
            "securities": securities,
            "loans": get("/securities-loan/", no_page=1),
            "priceData": get("/security-price-data/"),
            "annualPlans": get("/annual-plan/"),
            "quarterlyPlans": get("/quarterly-plan/"),
            "monthlyPlans": get("/monthly-plan/"),
            "weeklyPlans": get("/weekly-plan/"),
            "dailyPlans": get("/daily-plan/"),
            "mandatoryPrinciples": get("/mandatory-principle/", no_page=1),
            "principleSources": get("/principle-source/", no_page=1),
            "investmentPrinciples": get("/investment-principle/", no_page=1),
            "quarterlyPrinciples": get("/quarterly-principle/"),
            "monthlyPrinciples": get("/monthly-principle/"),
            "marketDirections": get("/market-direction/"),
            "strategies": strategies,
            "strategyDetail": get(f"/trading-strategy/{strategy_id}/") if strategy_id else {},
            "orders": get("/order/"),
            "performanceRecords": get("/performance-record/"),
            "aiModelRuns": get("/ai-model-run/"),
            "aiFeedback": get("/ai-decision-feedback/"),
        }

        chunks = [HEADER]
        for name, value in exports.items():
            body = json.dumps(value, ensure_ascii=False, indent=2)
            chunks.append(f"export const {name} = {body};\n")

        out_path = Path(options["out"])
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text("\n".join(chunks), encoding="utf-8", newline="\n")

        self.stdout.write(self.style.SUCCESS(f"{out_path} 를 만들었다."))
