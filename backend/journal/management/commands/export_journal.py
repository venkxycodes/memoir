import json
from pathlib import Path

from django.core.management.base import BaseCommand
from django.utils import timezone

from journal.models import Entry
from journal.serializers import EntrySerializer


class Command(BaseCommand):
    help = "Export the local journal to a UTF-8 JSON file."

    def add_arguments(self, parser):
        parser.add_argument("output", help="Destination JSON file")

    def handle(self, *args, **options):
        payload = {
            "format": "memoir-v1",
            "exported_at": timezone.now().isoformat(),
            "entries": EntrySerializer(Entry.objects.filter(user_id=1), many=True).data,
        }
        Path(options["output"]).write_text(
            json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        self.stdout.write(self.style.SUCCESS("Journal exported."))
