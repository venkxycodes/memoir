from django.urls import path

from .views import (
    EntryDetail,
    EntryList,
    ExportEntries,
    RandomEntry,
    SearchEntries,
    TodayEntry,
)

urlpatterns = [
    path("entries", EntryList.as_view()),
    path("entries/export", ExportEntries.as_view()),
    path("entries/today", TodayEntry.as_view()),
    path("entries/search", SearchEntries.as_view()),
    path("entries/random", RandomEntry.as_view()),
    path("entries/<int:entry_id>", EntryDetail.as_view()),
]
