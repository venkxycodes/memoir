# Memoir

A quiet, local personal journal. React + TypeScript + Vite, Django REST Framework, and PostgreSQL.

## Local setup

Requires Python 3.11+, Node 20+, and PostgreSQL. The development app has no authentication; bind it to localhost only.

```sh
cd backend
uv venv .venv
uv pip install --python .venv/bin/python -e .
cp .env.example .env
# Set DATABASE_URL and DJANGO_SECRET_KEY in .env.
.venv/bin/python manage.py migrate
.venv/bin/python manage.py runserver 127.0.0.1:8000
```

In another terminal:

```sh
cd frontend
npm install
npm run dev -- --host 127.0.0.1
```

Open http://127.0.0.1:5173. Vite proxies `/api` to the backend. Entries are created on meaningful input, one per local calendar day. Drafts are stored in this browser before autosave, and retried after reconnecting. Keep using the same browser origin to recover its drafts.

## Checks

```sh
cd backend
.venv/bin/python manage.py check
.venv/bin/python manage.py test --settings=config.test_settings
cd ../frontend
npm test
npm run build
```

## Export

Use **Export journal** in the app to download a JSON copy. From the backend directory, you can also run:

```sh
.venv/bin/python manage.py export_journal /path/to/memoir-journal.json
```

## Local backups

For the existing `codebases-postgres` container, save a backup outside version control:

```sh
mkdir -p backups
docker exec codebases-postgres pg_dump -U memoir -d memoir -Fc > backups/memoir.dump
```

Run this regularly using your local scheduler. Restore into a **new database** to verify backups without touching the journal:

```sh
docker exec codebases-postgres sh -c 'createdb -U "$POSTGRES_USER" -O memoir memoir_restore_check'
docker exec -i codebases-postgres pg_restore -U memoir -d memoir_restore_check < backups/memoir.dump
docker exec codebases-postgres psql -U memoir -d memoir_restore_check -c 'SELECT count(*) FROM journal_entry;'
```

A backup is only verified after a successful restore. Protect backup files as private journal data. Browser drafts are not a substitute for database backups.

See [product specification](docs/PRODUCT_DESIGN_SPEC.md) and [engineering design](docs/ENGINEERING_DESIGN.md) for scope and API details.
