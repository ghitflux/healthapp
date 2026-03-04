# Week 8 - Staging Smoke Tests (Owner)

Last update: 2026-03-04

## Scope
Run minimal end-to-end owner validation on staging-test environment.

## Smoke Checklist
1. Login as owner.
- Expected: redirect to `/owner/dashboard` with authorized session.

2. Open owner dashboard.
- Expected: KPIs and charts load, period filters update visualization.

3. Open owner convenios.
- Expected: list loads, filters work, detail drawer opens.
- Action: run approve/suspend operation on test convenio.
- Expected: status updates without manual page reload.

4. Open owner users.
- Expected: list, role/status filters and detail drawer work.
- Expected: unavailable admin actions are explicitly marked as unavailable.

5. Open owner audit logs.
- Expected: filters and pagination work.
- Action: export CSV/PDF from current filtered view.

6. Open owner financial.
- Expected: global cards, reconciliation block and breakdown render.
- Action: export CSV/PDF from financial table.

7. Open owner settings.
- Expected: current settings load.
- Action: update test value and save.
- Expected: success feedback and persisted update on refetch.

## Incident Capture Template
- Feature:
- URL:
- User/Role:
- Timestamp:
- Reproduction steps:
- Expected vs actual:
- Severity:
- Evidence (logs/screenshots):

