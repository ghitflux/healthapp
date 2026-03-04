# Week 8 - Backend Staging Readiness Checklist

Last update: 2026-03-04

## Build and Runtime
- [ ] Docker image built from the current commit.
- [ ] Image boots with `DJANGO_SETTINGS_MODULE=config.settings.staging`.
- [ ] Health endpoint responds `200`.
- [ ] Worker/scheduler services boot with staging broker.

## Environment Variables
- [ ] Staging-only secrets loaded.
- [ ] Production credentials absent.
- [ ] Stripe configured with test keys.
- [ ] Email/SMS providers configured for staging sandbox where available.
- [ ] Firebase/Push credentials are staging/test scope only.

## Infrastructure Isolation
- [ ] Dedicated staging PostgreSQL.
- [ ] Dedicated staging Redis.
- [ ] No connection path to production databases.
- [ ] Object storage bucket/path isolated for staging.

## Database and Migrations
- [ ] Migrations run successfully in staging.
- [ ] Seed/synthetic data loaded for owner smoke tests.
- [ ] No destructive migration without backup and rollback notes.

## API Validation
- [ ] Owner endpoints respond in staging:
  - [ ] `/api/v1/admin-panel/dashboard/`
  - [ ] `/api/v1/admin-panel/convenios/`
  - [ ] `/api/v1/admin-panel/users/`
  - [ ] `/api/v1/admin-panel/audit-logs/`
  - [ ] `/api/v1/admin-panel/financial/`
  - [ ] `/api/v1/admin-panel/settings/`

## Observability
- [ ] Structured logs enabled.
- [ ] Error monitoring enabled for staging project.
- [ ] Alert routing points to internal channels only.

