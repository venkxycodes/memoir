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
- authentication
- create/read/update/delete journal entries
- today's entry
- chronological entry history
- text search
- random-entry rediscovery
- autosave-friendly updates

No Redis, queues, vector database, event bus, or microservices.

---

## 2. Core Data Models

### User

Use Django's standard user/auth model rather than implementing authentication primitives ourselves.

Conceptually:

```text
User
- id: UUID
- email: string, unique
- password_hash: string
- created_at: timestamp
```

Email is the login identifier.

### Entry

```text
Entry
- id: UUID
- user_id: FK -> User
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

All entry queries must be scoped by the authenticated `user_id`.

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

Authentication should use secure HTTP-only session cookies.

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
- `401` unauthenticated
- `404` resource not found
- `409` conflicting daily entry

---

## 4. Authentication APIs

Django session authentication is sufficient for V1.

### Register

```http
POST /api/v1/auth/register
```

Request:

```json
{
  "email": "user@example.com",
  "password": "..."
}
```

Response:

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

### Login

```http
POST /api/v1/auth/login
```

Request:

```json
{
  "email": "user@example.com",
  "password": "..."
}
```

Creates the authenticated session cookie.

### Logout

```http
POST /api/v1/auth/logout
```

### Current user

```http
GET /api/v1/auth/me
```

---

## 5. Entry APIs

### Get today's entry

```http
GET /api/v1/entries/today
```

If an entry exists:

```json
{
  "id": "uuid",
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

The entry must belong to the authenticated user.

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
      "id": "uuid",
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
      "id": "uuid",
      "entry_date": "2026-09-27",
      "title": "Sunday cricket",
      "preview": "...played cricket in the evening..."
    }
  ]
}
```

V1 can use PostgreSQL text search or simple case-insensitive matching.

Do not add Elasticsearch or a vector database.

Search must always be restricted to the authenticated user's entries.

---

## 8. Rediscover

### Random entry

```http
GET /api/v1/entries/random
```

Returns one existing entry belonging to the authenticated user.

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

## 11. Security Rules

Every entry endpoint requires authentication.

Never query an entry using only:

```python
Entry.objects.get(id=entry_id)
```

Always scope ownership:

```python
Entry.objects.get(id=entry_id, user=request.user)
```

Additional requirements:
- HTTP-only secure session cookies
- CSRF protection
- password hashing through Django
- rate limiting on login/register
- journal contents must not appear in application logs
- journal contents must not be sent to analytics
- HTTPS in production

---

## 12. Django App Structure

Keep backend organization straightforward:

```text
backend/
  config/
  accounts/
    models.py
    views.py
    urls.py
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

## 13. V1 API Surface

The complete initial API can remain this small:

```text
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
GET    /api/v1/auth/me

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

## 14. Deliberately Deferred

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
