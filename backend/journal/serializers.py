from rest_framework import serializers

from .models import Entry


class EntrySerializer(serializers.ModelSerializer):
    content = serializers.CharField(allow_blank=True, trim_whitespace=False)

    class Meta:
        model = Entry
        fields = [
            "id",
            "title",
            "content",
            "entry_date",
            "mood",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
        validators = []

    def validate_content(self, value):
        if self.instance is None and not value.strip():
            raise serializers.ValidationError(
                "Write something before creating an entry."
            )
        return value

    def update(self, instance, validated_data):
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save(update_fields=[*validated_data, "updated_at"])
        return instance

    def to_internal_value(self, data):
        if not isinstance(data, dict):
            raise serializers.ValidationError(
                {"non_field_errors": ["Expected a JSON object."]}
            )
        unknown = set(data) - {"title", "content", "entry_date", "mood"}
        if unknown:
            raise serializers.ValidationError(
                {field: "Unknown or read-only field." for field in sorted(unknown)}
            )
        return super().to_internal_value(data)


class EntryPreviewSerializer(serializers.ModelSerializer):
    preview = serializers.SerializerMethodField()

    class Meta:
        model = Entry
        fields = ["id", "title", "preview", "entry_date", "mood", "updated_at"]

    def get_preview(self, obj):
        content = " ".join(obj.content.split())
        query = self.context.get("query", "")
        match = content.lower().find(query.lower()) if query else -1
        start = max(0, match - 60) if match >= 0 else 0
        preview = content[start : start + 200]
        return (
            ("…" if start else "")
            + preview
            + ("…" if len(content) > start + 200 else "")
        )
