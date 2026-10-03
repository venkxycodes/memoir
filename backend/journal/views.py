import random
import json
from datetime import date

from django.core import signing
from django.http import HttpResponse
from django.db import IntegrityError, transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import serializers
from rest_framework.response import Response
from rest_framework.views import APIView

from .errors import EntryConflict, EntryNotFound
from .models import Entry
from .serializers import EntryPreviewSerializer, EntrySerializer


def entries():
    return Entry.objects.filter(user_id=1)


def get_entry(entry_id):
    try:
        return entries().get(pk=entry_id)
    except Entry.DoesNotExist:
        raise EntryNotFound()


def integer_parameter(request, name, default, minimum=1, maximum=None):
    try:
        value = int(request.query_params.get(name, default))
        if value < minimum or (maximum is not None and value > maximum):
            raise ValueError
        return value
    except (TypeError, ValueError):
        raise serializers.ValidationError({name: "Invalid integer value."})


def persist(serializer):
    try:
        with transaction.atomic():
            return serializer.save(user_id=1)
    except IntegrityError:
        # Validated writable values can only violate the daily unique constraint.
        raise EntryConflict()


class EntryList(APIView):
    def get(self, request):
        limit = integer_parameter(request, "limit", 20, maximum=100)
        queryset = entries()
        cursor = request.query_params.get("cursor")
        if cursor:
            try:
                position = signing.loads(cursor, salt="journal-history")
                cursor_date = date.fromisoformat(position["date"])
                cursor_id = int(position["id"])
            except (signing.BadSignature, ValueError, TypeError, KeyError):
                raise serializers.ValidationError({"cursor": "Invalid cursor."})
            queryset = queryset.filter(
                Q(entry_date__lt=cursor_date)
                | Q(entry_date=cursor_date, id__lt=cursor_id)
            )
        page = list(queryset[: limit + 1])
        has_more = len(page) > limit
        page = page[:limit]
        next_cursor = (
            signing.dumps(
                {"date": page[-1].entry_date.isoformat(), "id": page[-1].id},
                salt="journal-history",
            )
            if has_more
            else None
        )
        return Response(
            {
                "results": EntryPreviewSerializer(page, many=True).data,
                "next_cursor": next_cursor,
            }
        )

    def post(self, request):
        serializer = EntrySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        entry = persist(serializer)
        return Response(EntrySerializer(entry).data, status=201)


class EntryDetail(APIView):
    def get(self, request, entry_id):
        return Response(EntrySerializer(get_entry(entry_id)).data)

    def patch(self, request, entry_id):
        serializer = EntrySerializer(
            get_entry(entry_id), data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        entry = persist(serializer)
        return Response(EntrySerializer(entry).data)

    def delete(self, request, entry_id):
        get_entry(entry_id).delete()
        return Response(status=204)


class TodayEntry(APIView):
    def get(self, request):
        raw_date = request.query_params.get("date")
        if raw_date:
            field = serializers.DateField(input_formats=["%Y-%m-%d"])
            entry_date = field.run_validation(raw_date)
        else:
            entry_date = timezone.localdate()
        entry = entries().filter(entry_date=entry_date).first()
        if entry is None:
            raise EntryNotFound()
        return Response(EntrySerializer(entry).data)


class SearchEntries(APIView):
    def get(self, request):
        query = request.query_params.get("q", "").strip()
        limit = integer_parameter(request, "limit", 50, maximum=100)
        queryset = (
            entries().filter(Q(title__icontains=query) | Q(content__icontains=query))
            if query
            else entries().none()
        )
        return Response(
            {
                "results": EntryPreviewSerializer(
                    queryset[:limit], many=True, context={"query": query}
                ).data
            }
        )


class RandomEntry(APIView):
    def get(self, request):
        raw_date = request.query_params.get("date")
        today = (
            serializers.DateField(input_formats=["%Y-%m-%d"]).run_validation(raw_date)
            if raw_date
            else timezone.localdate()
        )
        queryset = entries().filter(entry_date__lt=today)
        if "exclude" in request.query_params:
            queryset = queryset.exclude(pk=integer_parameter(request, "exclude", None))
        count = queryset.count()
        if not count:
            raise EntryNotFound()
        entry = queryset[random.randrange(count)]
        return Response(EntrySerializer(entry).data)


class ExportEntries(APIView):
    def get(self, request):
        payload = {
            "format": "memoir-v1",
            "exported_at": timezone.now().isoformat(),
            "entries": EntrySerializer(entries(), many=True).data,
        }
        response = HttpResponse(
            json.dumps(payload, ensure_ascii=False, indent=2),
            content_type="application/json; charset=utf-8",
        )
        response["Content-Disposition"] = 'attachment; filename="memoir-journal.json"'
        return response
