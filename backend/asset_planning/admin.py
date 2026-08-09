from django.contrib import admin

from asset_planning.models import (
    Account,
    AssetSnapshot,
    Holding,
    JournalEntry,
    JournalTag,
    Plan,
    ProjectionSnapshot,
    Review,
    Scenario,
    Transaction,
)

for model in (
    Account,
    Holding,
    Transaction,
    AssetSnapshot,
    Plan,
    Scenario,
    ProjectionSnapshot,
    JournalTag,
    JournalEntry,
    Review,
):
    admin.site.register(model)
