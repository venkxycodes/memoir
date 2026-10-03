from datetime import timedelta

from django.db import IntegrityError, transaction
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from journal.models import Entry


class JournalAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.today = timezone.localdate()

    def create(self, days=0, **values):
        return Entry.objects.create(
            entry_date=self.today - timedelta(days=days),
            content="A quiet afternoon",
            **values,
        )

    def test_create_read_patch_delete(self):
        response = self.client.post(
            "/api/v1/entries",
            {
                "entry_date": str(self.today),
                "content": "  First line\nSecond line  ",
                "mood": "good",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        entry_id = response.data["id"]
        self.assertEqual(response.data["content"], "  First line\nSecond line  ")
        response = self.client.patch(
            f"/api/v1/entries/{entry_id}", {"title": "A memory"}, format="json"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["content"], "  First line\nSecond line  ")
        self.assertEqual(self.client.get("/api/v1/entries/today").data["id"], entry_id)
        self.assertEqual(
            self.client.delete(f"/api/v1/entries/{entry_id}").status_code, 204
        )
        self.assertEqual(
            self.client.get(f"/api/v1/entries/{entry_id}").status_code, 404
        )

    def test_daily_conflicts_and_constraint(self):
        self.create()
        entry = self.create(days=1)
        response = self.client.post(
            "/api/v1/entries",
            {"entry_date": str(self.today), "content": "duplicate"},
            format="json",
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.data["error"]["code"], "entry_conflict")
        response = self.client.patch(
            f"/api/v1/entries/{entry.id}",
            {"entry_date": str(self.today)},
            format="json",
        )
        self.assertEqual(response.status_code, 409)
        with self.assertRaises(IntegrityError), transaction.atomic():
            self.create()

    def test_invalid_input(self):
        for payload in [
            {"entry_date": str(self.today), "content": "   "},
            {"content": "x"},
            {"entry_date": "invalid", "content": "x"},
            {"entry_date": str(self.today), "content": None},
            {"entry_date": str(self.today), "content": "x", "mood": "bad"},
            {"entry_date": str(self.today), "content": "x", "user_id": 2},
            ["wrong"],
        ]:
            self.assertEqual(
                self.client.post("/api/v1/entries", payload, format="json").status_code,
                400,
            )
        for url in [
            "/api/v1/entries?limit=0",
            "/api/v1/entries?cursor=bogus",
            "/api/v1/entries/random?exclude=invalid",
            "/api/v1/entries/today?date=wrong",
        ]:
            self.assertEqual(self.client.get(url).status_code, 400)

    def test_today_does_not_create_and_respects_explicit_date(self):
        self.assertEqual(self.client.get("/api/v1/entries/today").status_code, 404)
        self.assertEqual(Entry.objects.count(), 0)
        entry = self.create(days=1)
        self.assertEqual(
            self.client.get(f"/api/v1/entries/today?date={entry.entry_date}").data[
                "id"
            ],
            entry.id,
        )

    def test_cursor_history_and_preview(self):
        expected = [self.create(days=i).id for i in range(5)]
        first = self.client.get("/api/v1/entries?limit=2").data
        second = self.client.get(
            "/api/v1/entries", {"limit": 2, "cursor": first["next_cursor"]}
        ).data
        third = self.client.get(
            "/api/v1/entries", {"limit": 2, "cursor": second["next_cursor"]}
        ).data
        self.assertEqual(
            [e["id"] for e in first["results"] + second["results"] + third["results"]],
            expected,
        )
        self.assertIsNone(third["next_cursor"])
        self.assertNotIn("content", first["results"][0])

    def test_search_random_and_user_scope(self):
        own = self.create(days=2, title="Cricket")
        other = self.create(days=1, user_id=2, title="Cricket")
        self.assertEqual(
            self.client.get("/api/v1/entries/search?q=CRICKET").data["results"][0][
                "id"
            ],
            own.id,
        )
        self.assertEqual(
            len(self.client.get("/api/v1/entries/search?q=CRICKET").data["results"]), 1
        )
        self.assertEqual(self.client.get("/api/v1/entries/random").data["id"], own.id)
        self.assertEqual(
            self.client.get(f"/api/v1/entries/random?exclude={own.id}").status_code, 404
        )
        for method in [self.client.get, self.client.patch, self.client.delete]:
            self.assertEqual(method(f"/api/v1/entries/{other.id}").status_code, 404)

    def test_export_contains_only_local_entries(self):
        own = self.create()
        self.create(days=1, user_id=2)
        response = self.client.get("/api/v1/entries/export")
        self.assertEqual(response.status_code, 200)
        self.assertIn("attachment", response["Content-Disposition"])
        self.assertEqual([row["id"] for row in response.json()["entries"]], [own.id])

    def test_random_excludes_today_and_future(self):
        self.create()
        self.create(days=-1)
        self.assertEqual(self.client.get("/api/v1/entries/random").status_code, 404)
        previous = self.create(days=1)
        self.assertEqual(
            self.client.get("/api/v1/entries/random").data["id"], previous.id
        )

    def test_partial_update_preserves_unmodified_concurrent_fields(self):
        from journal.serializers import EntrySerializer

        entry = self.create()
        stale = Entry.objects.get(pk=entry.id)
        Entry.objects.filter(pk=entry.id).update(title="New title")
        serializer = EntrySerializer(
            stale, data={"content": "Changed writing"}, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(user_id=1)
        entry.refresh_from_db()
        self.assertEqual(entry.title, "New title")
        self.assertEqual(entry.content, "Changed writing")
