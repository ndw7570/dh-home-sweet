from django.urls import include, path
from rest_framework.routers import DefaultRouter

from asset_planning.views.dashboard import HomeSummaryView, ReviewDigestView, TimelineView
from asset_planning.views.journal import JournalEntryViewSet, JournalTagViewSet, ReviewViewSet
from asset_planning.views.planning import PlanViewSet, ProjectionSnapshotViewSet, ScenarioViewSet
from asset_planning.views.portfolio import (
    AccountViewSet,
    AssetSnapshotViewSet,
    HoldingViewSet,
    TransactionViewSet,
)

router = DefaultRouter()

# portfolio
router.register(r"account", AccountViewSet)
router.register(r"holding", HoldingViewSet)
router.register(r"transaction", TransactionViewSet)
router.register(r"asset-snapshot", AssetSnapshotViewSet)

# planning
router.register(r"plan", PlanViewSet)
router.register(r"scenario", ScenarioViewSet)
router.register(r"projection-snapshot", ProjectionSnapshotViewSet)

# journal
router.register(r"journal-tag", JournalTagViewSet)
router.register(r"journal-entry", JournalEntryViewSet)
router.register(r"review", ReviewViewSet)

urlpatterns = [
    path("/home/summary/", HomeSummaryView.as_view(), name="home-summary"),
    path("/timeline/", TimelineView.as_view(), name="timeline"),
    path("/review/<int:review_id>/digest/", ReviewDigestView.as_view(), name="review-digest"),
    path("/", include(router.urls)),
]
