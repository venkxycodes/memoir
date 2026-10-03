from django.db import models


class Entry(models.Model):
    class Mood(models.TextChoices):
        ROUGH = "rough", "Rough"
        OKAY = "okay", "Okay"
        GOOD = "good", "Good"
        GREAT = "great", "Great"

    user_id = models.BigIntegerField(default=1, editable=False)
    title = models.CharField(max_length=255, null=True, blank=True)
    content = models.TextField()
    entry_date = models.DateField()
    mood = models.CharField(max_length=5, choices=Mood.choices, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-entry_date", "-id"]
        constraints = [
            models.UniqueConstraint(
                fields=["user_id", "entry_date"], name="unique_user_entry_date"
            ),
            models.CheckConstraint(
                condition=models.Q(mood__isnull=True)
                | models.Q(mood__in=["rough", "okay", "good", "great"]),
                name="valid_entry_mood",
            ),
        ]
        indexes = [
            models.Index(fields=["user_id", "-entry_date"], name="entry_user_date_idx"),
            models.Index(
                fields=["user_id", "-updated_at"], name="entry_user_updated_idx"
            ),
        ]
