# Memoir — Engineering Design

## 1. Scope

This document defines the V1 backend contract for Memoir.

Keep the system intentionally simple:

```text
React + TypeScript
        |
     REST API
        |
      Django
        |
    PostgreSQL
```

V1 needs:
- create/read/update/delete journal entries
- today's entry
- chronological entry history
- text search
- random-entry rediscovery
- autosave-friendly updates

No Redis, queues, vector database, event bus, or microservices.

---

## 2. Core Data Models

### User identity

V1 is a local, single-user application and has no authentication or `User` table.

Keep `user_id` on journal records as a simple integer so the data model can be extended to multiple users later. For V1, all records use:

```text
user_id = 1
```

If multi-user support is added later, introduce a `User` table with an auto-incrementing integer primary key and convert `Entry.user_id` into a foreign key.

### Entry

```text
Entry
- id: bigint, auto-increment
- user_id: bigint
- title: string, nullable
- content: text
- entry_date: date
- mood: string, nullable
- created_at: timestamp
- updated_at: timestamp
```

Constraints:

```text
UNIQUE(user_id, entry_date)
```

For V1, a user has at most one diary entry per calendar day. Opening Today therefore maps naturally to one entry.

Suggested indexes:

```text
INDEX(user_id, entry_date DESC)
INDEX(user_id, updated_at DESC)
```

All V1 entry queries use `user_id = 1`.

### Mood

Do not create a separate table.

If mood is included in V1, keep it as a nullable enum-like string:

```text
rough
okay
good
great
```

This can be changed later without complicating the core journal model.

---

## 3. API Conventions

Base path:

```text
/api/v1
```

Use JSON request/response bodies.

Common errors:

```json
{
  "error": {
    "code": "entry_not_found",
    "message": "Entry not found."
  }
}
```

HTTP semantics:

- `200` successful read/update
- `201` successful creation
- `204` successful deletion
- `400` invalid request
- `404` resource not found
- `409` conflicting daily entry

---

## 4. Entry APIs

### Get today's entry

```http
GET /api/v1/entries/today
```

If an entry exists:

```json
{
  "id": 1,
  "title": null,
  "content": "Today was...",
  "entry_date": "2026-10-03",
  "mood": "good",
  "created_at": "...",
  "updated_at": "..."
}
```

If no entry exists, return `404`.

The frontend can then create the entry when the user first types rather than creating empty rows every day.

### Create entry

```http
POST /api/v1/entries
```

Request:

```json
{
  "entry_date": "2026-10-03",
  "content": "Today was...",
  "title": null,
  "mood": null
}
```

The server rejects a second entry for the same user/date with `409`.

### Get entry

```http
GET /api/v1/entries/{entry_id}
```

Fetch the entry with `user_id = 1`.

### Update entry

```http
PATCH /api/v1/entries/{entry_id}
```

Used by autosave.

Request:

```json
{
  "content": "Updated journal content"
}
```

Only supplied fields are modified.

Editable fields:
- title
- content
- mood
- entry_date

If changing `entry_date` conflicts with another entry, return `409`.

### Delete entry

```http
DELETE /api/v1/entries/{entry_id}
```

Return `204`.

Deletion should require an explicit confirmation in the frontend.

---

## 6. Journal History

### List entries

```http
GET /api/v1/entries?limit=20&cursor=<cursor>
```

Entries are returned newest first.

Response:

```json
{
  "results": [
    {
      "id": 1,
      "title": null,
      "preview": "Today was surprisingly...",
      "entry_date": "2026-10-03",
      "mood": "good",
      "updated_at": "..."
    }
  ],
  "next_cursor": "..."
}
```

Use cursor pagination rather than page numbers.

The list endpoint should return a preview rather than unnecessarily returning the complete journal content for every entry.

---

## 7. Search

### Search entries

```http
GET /api/v1/entries/search?q=cricket
```

Response:

```json
{
  "results": [
    {
      "id": 1,
      "entry_date": "2026-09-27",
      "title": "Sunday cricket",
      "preview": "...played cricket in the evening..."
    }
  ]
}
```

V1 can use PostgreSQL text search or simple case-insensitive matching.

Do not add Elasticsearch or a vector database.

Search is restricted to `user_id = 1`.

---

## 8. Rediscover

### Random entry

```http
GET /api/v1/entries/random
```

Returns one existing entry for `user_id = 1`.

Optional query:

```http
GET /api/v1/entries/random?exclude=<entry_id>
```

This lets “Take me somewhere else” avoid immediately returning the same entry.

If the user has no entries, return `404`.

---

## 9. Autosave

The frontend owns typing state.

Flow:

```text
keypress
   |
update React state immediately
   |
persist local draft
   |
debounce ~750 ms
   |
PATCH /entries/{id}
   |
Saved
```

For a new day:

```text
first meaningful input
   |
POST /entries
   |
receive entry id
   |
subsequent autosaves use PATCH
```

Do not create an entry merely because the Today page was opened.

The client should keep the latest draft locally so a refresh or temporary network failure does not destroy writing.

V1 does not need collaborative-editing semantics.

---

## 10. Date Handling

`entry_date` represents the user's journal day, not UTC.

The frontend determines the local calendar date and explicitly sends:

```text
YYYY-MM-DD
```

`created_at` and `updated_at` remain timezone-aware UTC timestamps.

This avoids a late-night entry unexpectedly appearing under the previous or next day because of UTC conversion.

---

## 10. Local Data Safety

Memoir V1 is local-only and has no authentication boundary.

Requirements:
- journal contents must not appear in application logs
- journal contents must not be sent to analytics
- keep local database backups
- do not expose the Django server publicly

---

## 11. Django App Structure

Keep backend organization straightforward:

```text
backend/
  config/
  journal/
    models.py
    serializers.py
    views.py
    urls.py
    services.py
    tests/
```

Avoid introducing repository/service abstractions unless actual complexity requires them.

Django ORM is sufficient for normal data access.

---

## 12. V1 API Surface

The complete initial API can remain this small:

```text
GET    /api/v1/entries/today
GET    /api/v1/entries
POST   /api/v1/entries
GET    /api/v1/entries/{id}
PATCH  /api/v1/entries/{id}
DELETE /api/v1/entries/{id}

GET    /api/v1/entries/search?q=
GET    /api/v1/entries/random
```

That is enough to build the complete V1 product.

---

## 13. Deliberately Deferred

Do not design infrastructure for these yet:

- semantic search
- embeddings
- AI analysis
- image attachments
- tags
- sharing
- collaborative editing
- notifications
- event streams
- Redis caching
- background workers
- microservices

Add them only when a concrete product requirement demands them.

## Implemented local API additions

- `GET /api/v1/entries/today?date=YYYY-MM-DD` accepts the browser's local journal day; without `date`, the configured Django local day is used.
- `GET /api/v1/entries/random?date=YYYY-MM-DD&exclude=<id>` considers only entries before that day. Without `date`, it uses the configured local day.
- `GET /api/v1/entries/export` downloads all journal entries as a `memoir-v1` JSON attachment. The same export is available through `manage.py export_journal`.
- Whitespace-only new entries are rejected. Existing entries can be cleared intentionally.

This implementation follows the local-only, single-user contract above. It must remain on localhost until authentication is added.
