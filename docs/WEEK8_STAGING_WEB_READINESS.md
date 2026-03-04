# Week 8 - Web Staging Readiness Checklist

Last update: 2026-03-04

## Build Integrity
- [ ] `npm run lint` passes.
- [ ] `npm run type-check` passes.
- [ ] `npm run test` passes.
- [ ] `npm run build` passes.

## Environment Configuration
- [ ] `NEXT_PUBLIC_API_URL` points to staging backend.
- [ ] No production frontend env variables in staging deployment.
- [ ] Feature flags for staging set according to internal validation scope.

## Access Control
- [ ] Staging app URL restricted to internal users.
- [ ] No public discovery/indexing.
- [ ] Access denied flow validated for unauthorized roles.

## Owner Panel Smoke Prerequisites
- [ ] Owner seed credentials available in staging test dataset.
- [ ] Owner pages load without placeholders:
  - [ ] `/owner/dashboard`
  - [ ] `/owner/convenios`
  - [ ] `/owner/users`
  - [ ] `/owner/audit-logs`
  - [ ] `/owner/financial`
  - [ ] `/owner/settings`
  - [ ] `/owner/analytics`

## Export and Reporting
- [ ] CSV export functional for owner tables.
- [ ] Print-friendly PDF flow functional in staging browsers.

