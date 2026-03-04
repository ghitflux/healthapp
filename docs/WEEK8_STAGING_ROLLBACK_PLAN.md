# Week 8 - Staging Rollback and Incident Response

Last update: 2026-03-04

## Purpose
Provide a fast and safe rollback path for staging-test incidents without touching production.

## Trigger Conditions
- Critical owner flow blocked (login, dashboard, convenios action, settings save).
- Widespread 5xx errors after deploy.
- Incorrect staging configuration leaking restricted access.

## Rollback Procedure
1. Identify failing deployment version.
2. Redeploy previous known-good staging build.
3. Reapply last known-good staging environment variables.
4. Run smoke subset:
- owner login
- owner dashboard
- owner convenios list
- owner settings read
5. Keep incident status open until validation passes.

## Containment Actions
- Disable only impacted feature flag when possible.
- Keep staging environment internal-only during incident.
- Avoid ad-hoc hotfix in production branches.

## Incident Registration
- Incident ID:
- Start time:
- End time:
- Impact summary:
- Root cause:
- Corrective action:
- Preventive action:

## Explicit Boundary
This rollback plan applies only to staging-test environment.
No production rollback or production operations are part of Week 8 scope.

