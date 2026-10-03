# Memoir — Product & Design Specification

## 1. Product Summary

Memoir is a private digital journal built around one simple loop:

**Write → remember → rediscover.**

It should feel closer to opening a personal diary than using a productivity app.

The product is intentionally quiet:
- no streaks
- no gamification
- no pressure to write every day
- no dashboards full of metrics
- no AI interrupting the writing experience

The core job is simple:

> Give me a calm place to write what is on my mind, keep it safely, and let me revisit it later.

---

## 2. Product Principles

### 2.1 Writing should be frictionless

Opening Memoir should take the user directly into writing.

The user should not have to:
- choose a template
- select a journal type
- fill metadata
- answer prompts
- click through multiple screens

The page itself is the editor.

### 2.2 Journaling should not become another obligation

Memoir must not create artificial pressure.

Avoid:
- daily streaks
- missed-day warnings
- achievement badges
- writing targets
- guilt-driven notifications

### 2.3 The journal becomes more valuable over time

The differentiator is not writing itself. Many apps can store text.

Memoir should become increasingly useful because it helps the user rediscover old parts of their life.

Examples:
- “On this day last year”
- random old entry
- search
- resurfaced entries from months or years ago

### 2.4 Private by default

Journal entries are highly personal.

The product should minimize unnecessary exposure and collect only what is needed.

Longer term, Memoir should support client-side encryption or another architecture where journal contents cannot casually be inspected server-side.

---

## 3. V1 Scope

V1 has four primary surfaces.

### Today

The default screen.

Shows:
- current date
- optional lightweight prompt
- large writing surface
- autosave state

If today's entry already exists, opening Today returns to it.

### Journal

Chronological history of entries.

Default ordering:
- newest first

Each item shows:
- date
- title, when available
- short content preview

Entries should be easy to scan without feeling like a database table.

### Entry

Read or edit an individual journal entry.

The same visual language should be used for both reading and writing.

The product should avoid a strong distinction between “editor mode” and “reader mode”.

### Rediscover

A lightweight memory surface.

V1 can begin with:

**Take me somewhere**

Opens one random previous entry.

Later this can expand into:
- on this day
- one year ago
- six months ago
- forgotten entries

---

## 4. Journaling Model

Entries are primarily free-form text.

A user should be able to write:

> Today was surprisingly good...

and stop there.

Metadata must be optional.

Possible optional fields:
- title
- mood
- tags

Do not make any of these required for V1.

### Prompts

Prompts exist only to help when the page feels blank.

They should be subtle and dismissible.

Examples:
- What's occupying your mind right now?
- What happened today that you don't want to forget?
- What went well today?
- What annoyed you today?
- What did you learn?
- What are you worried about?
- What are you looking forward to?
- What are you thinking about but haven't said out loud?
- If you read this five years from now, what would you want to remember?

The prompt must never become a structured questionnaire.

---

## 5. Core User Flows

### Write today's entry

1. Open Memoir.
2. Land on Today.
3. Cursor is ready in the writing area.
4. Start typing.
5. Entry autosaves.
6. Close the app whenever finished.

No explicit Save button should be required.

### Read an old entry

1. Open Journal.
2. Scroll through chronological entries.
3. Select an entry.
4. Read it in a clean, distraction-free layout.

### Edit an old entry

1. Open an entry.
2. Click/tap into the text.
3. Edit naturally.
4. Changes autosave.

### Rediscover something

1. Select “Take me somewhere”.
2. Memoir opens a random previous entry.
3. User can move to another random entry if desired.

---

## 6. Visual Direction

Memoir should look like quiet, polished software — not a simulated paper notebook.

Avoid:
- handwritten fonts
- paper textures
- ruled notebook lines
- fake page shadows
- skeuomorphic diary graphics
- decorative wellness-app imagery

The visual system should rely on:
- typography
- spacing
- subtle surfaces
- restrained color
- motion

---

## 7. Typography

Use **Open Sans only**.

No serif fonts.

Suggested hierarchy:

| Use | Size | Weight | Line height |
| --- | ---: | ---: | ---: |
| Page title / date | 28px | 600 | 1.3 |
| Journal body | 17–18px | 400 | 1.7–1.8 |
| Section heading | 16px | 600 | 1.4 |
| UI text | 14px | 500 | 1.4 |
| Metadata | 13px | 400 | 1.4 |

The journal body should prioritize long-form readability.

Maximum writing width on desktop:

**680–720px**

---

## 8. Color System

Direction: **Soft Lavender**

### Core colors

```text
Background        #F7F5FA
Surface           #FFFFFF
Primary text      #252229
Secondary text    #77717E
Accent            #756A8B
Accent subtle     #EEEAF3
Border            #E7E2EB
```

The interface should remain mostly neutral.

Lavender should appear in:
- active navigation
- selected states
- focus states
- subtle buttons
- links
- memory/resurfacing accents

Do not flood the interface with purple.

---

## 9. Layout

### Desktop

Use a restrained application shell.

Possible structure:

```text
Memoir                             Search

Today
Journal
Rediscover


                    Saturday, 3 October
                    4:42 PM

                    What's on your mind?

                    |
                    | Writing begins here...
                    |
                    |
                    |

                                             Saved
```

The actual writing area should not look like a bordered textbox.

The page itself should feel editable.

### Mobile

The writing experience should become almost fullscreen.

Prioritize:
- date
- writing area
- minimal navigation
- autosave feedback

Avoid permanent sidebars.

Use a bottom navigation or compact top navigation.

---

## 10. Writing Experience

This is the most important interaction in the product.

### Editor

The editor should:
- have no visible textarea border
- use the page background naturally
- support multiline plain text
- preserve paragraphs
- autosave
- restore unsaved local content after accidental refresh when possible

V1 does not need a rich-text toolbar.

Basic formatting can be omitted entirely initially.

### Typewriter-inspired feel

Typing must remain instantaneous.

Do **not** introduce visible input lag.

Allowed effects:
- slightly pronounced blinking caret
- newly typed characters fading from roughly 70% to full opacity within ~50–80ms
- surrounding interface gently fading while actively typing
- navigation returning after a short period of inactivity

Optional later:
- very subtle typewriter key sound
- disabled by default

The effect should be almost subconscious.

If the animation interferes with typing performance, remove it.

---

## 11. Navigation

Keep top-level navigation very small:

- Today
- Journal
- Rediscover
- Search

Settings can live behind the profile/account menu.

Do not add separate navigation items for:
- moods
- tags
- analytics
- prompts
- stats

Those can exist as secondary features later.

---

## 12. Search

V1 search can be ordinary PostgreSQL-backed text search.

The user should be able to search terms such as:

```text
cricket
interview
family
travel
```

Results show:
- date
- matching excerpt
- title if available

Future semantic search could support:

> When have I felt like this before?

or

> Show me entries where I was uncertain about work.

This is explicitly not required for V1.

---

## 13. Data Model

A minimal entry model:

```text
Entry

id
user_id
title nullable
content
entry_date
mood nullable
created_at
updated_at
```

Optional later:

```text
tags
location
weather
embedding
is_favorite
```

Do not store optional metadata before there is a clear product reason.

---

## 14. Suggested Technical Stack

Keep the architecture intentionally simple.

### Frontend

- React
- TypeScript
- Vite or Next.js
- Open Sans
- lightweight CSS / Tailwind if desired

### Backend

Preferred:

- Django
- Django REST Framework

Alternative:

- FastAPI

Django is preferred because the product benefits from mature authentication, ORM, migrations and admin tooling without adding infrastructure complexity.

### Database

PostgreSQL.

Suitable hosted options:
- Neon
- Supabase
- Railway Postgres

There is no need for a separate document database.

Even decades of personal journal entries represent trivial data volume for PostgreSQL.

### Hosting

Suggested:

```text
Frontend    Vercel
Backend     Railway
Database    PostgreSQL
```

---

## 15. Autosave Strategy

Writing must feel safe.

Suggested approach:

1. Update local editor state immediately.
2. Persist draft to browser storage.
3. Debounce server writes by roughly 500–1000ms.
4. Write latest content to Postgres.
5. Show unobtrusive states:

```text
Saving…
Saved
Offline
```

On reconnection, synchronize the latest draft.

Avoid showing intrusive success toasts on every save.

---

## 16. Privacy & Security

At minimum:

- HTTPS only
- authenticated access
- secure password storage
- secure session cookies
- CSRF protection
- rate limiting on auth endpoints
- database backups
- no public journal URLs by default

Do not log journal content in application logs.

Do not send entry content to analytics platforms.

### Future encryption

A later privacy mode can encrypt journal content client-side before storage.

This should be designed carefully because encryption changes:
- search
- backups
- recovery
- semantic features
- multi-device synchronization

Do not prematurely complicate V1 with encryption unless Memoir is intended for external users immediately.

---

## 17. Backups & Durability

A journal is long-lived data. Data loss is unacceptable.

Requirements:
- automated database backups
- tested restore procedure
- export functionality

Future export formats:
- Markdown
- JSON
- plain text
- PDF

The user should never be locked into Memoir.

---

## 18. Empty States

Empty states should feel calm rather than promotional.

### No journal entries

```text
Nothing here yet.

Write whatever is on your mind.
```

### Search has no results

```text
Nothing found.

Try another word or phrase.
```

### Rediscover without enough history

```text
There isn't much to rediscover yet.

Keep writing. This space gets better with time.
```

---

## 19. Responsive Behaviour

### Desktop

- centered editor
- generous whitespace
- sidebar or compact top navigation
- 680–720px writing width

### Tablet

- collapse unnecessary chrome
- maintain readable editor width

### Mobile

- nearly edge-to-edge editor
- 16–20px page padding
- no persistent sidebar
- navigation must not compete with writing

---

## 20. Accessibility

Minimum requirements:
- WCAG-compliant text contrast
- keyboard navigation
- visible focus states
- semantic HTML
- usable screen-reader labels
- no functionality dependent only on animation
- respect `prefers-reduced-motion`

The typing animation must be disabled or simplified when reduced motion is requested.

---

## 21. Explicit V1 Non-Goals

Do not build these initially:

- AI journal coach
- AI-generated entries
- streaks
- goals
- habit tracking
- social sharing
- public profiles
- followers
- comments
- collaborative journals
- complex rich-text editor
- vector database
- separate search infrastructure
- Redis
- event streaming
- microservices

Memoir should remain a small product until actual usage shows which complexity is justified.

---

## 22. Future Possibilities

Possible later features:

### On this day

Surface entries from the same date in previous years.

### Memory resurfacing

Occasionally present an older entry:

> From your journal — 247 days ago

### Semantic recall

Ask natural-language questions across the journal.

### Favorites

Save meaningful entries.

### Photos

Attach a small number of images to an entry.

### Export

Download the complete journal.

### Encryption

Client-side encrypted journals.

None of these should compromise the simplicity of the writing experience.

---

## 23. Product North Star

Memoir should make this interaction feel completely natural:

**Open → write → leave.**

And months or years later:

**Open → rediscover something you had forgotten.**

If a feature does not improve writing, remembering, privacy or rediscovery, it probably does not belong in the product.
