---
name: django-backend
description: Build, extend, or review backend features in Django projects, including Django REST Framework APIs when the repository uses DRF. Use for Django models, views, serializers, validation, authentication, permissions, and request-to-database behavior; do not assume a new API framework when the project has not chosen one.
---

# Django Backend

Build backend behavior that fits the project’s existing Django structure and exposes clear, validated interfaces.

## Workflow

1. Inspect the installed Django version, project settings, URL routing, existing API framework, app boundaries, auth model, and neighboring tests before choosing an implementation.
2. Keep request parsing and response formatting at the HTTP boundary. Put domain rules in the narrowest existing module that can own them; do not add a generic service/repository layer without a concrete reason.
3. Use Django models and the ORM for persistence. Put durable invariants in database constraints where possible, with form/serializer validation for useful user errors. Remember `save()` does not automatically call `full_clean()`.
4. If Django REST Framework is already selected, follow its installed-version documentation and local conventions for serializers, viewsets/views, authentication, permissions, pagination, and error responses. If no API framework is selected, check whether the endpoint needs DRF’s serialization, validation, and auth features before adding the dependency; simple Django views may be sufficient.
5. Apply authentication and object-level authorization on the server for every protected endpoint. A hidden UI route or client-provided identity is not authorization. Check ownership and tenant scope in the queryset or permission boundary to avoid IDOR/BOLA.
6. Use `transaction.atomic()` when multiple database writes represent one business operation. Prefer database-side updates (`F()` expressions or locking where appropriate) when concurrent requests could lose an update. Keep external network calls outside a long-running transaction.
7. Add focused tests for behavior, invalid input, access denial, and transaction-sensitive calculations. Run the project’s existing checks and inspect generated migrations before claiming completion.

## Django migration discipline

- Treat model changes and migration files as one reviewable change. Review `makemigrations` output and use `sqlmigrate` when SQL details matter.
- For `RunPython`, use historical models from the migration app registry (`apps.get_model`) and provide a reverse operation when meaningful.
- For large data rewrites or operational imports, use a resumable management command or dedicated migration job instead of loading an unbounded dataset into a schema migration.
- Read the docs for the deployed Django version before using recently added APIs or security settings.

## Current references

- [Django models](https://docs.djangoproject.com/en/6.0/topics/db/models/)
- [Django transactions](https://docs.djangoproject.com/en/6.0/topics/db/transactions/)
- [Django migrations](https://docs.djangoproject.com/en/6.0/topics/migrations/)
- [Django security](https://docs.djangoproject.com/en/6.0/topics/security/)
- [Django database support](https://docs.djangoproject.com/en/6.0/ref/databases/)
- [Django REST Framework documentation](https://www.django-rest-framework.org/) (only when DRF is used)
