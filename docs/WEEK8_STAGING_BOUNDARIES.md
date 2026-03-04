# Week 8 - Staging Test Environment Boundaries

Last update: 2026-03-04

## Objective
Define strict boundaries for the Week 8 staging environment used for internal homologation only.

## Mandatory Rules
- Environment scope: `staging-test` only.
- Production deploy is forbidden in Week 8.
- Public release is forbidden in Week 8.
- Production secrets are forbidden in staging.
- Real customer data is forbidden in staging.
- Payment providers must run in test mode only.
- Access must be restricted to internal team members.

## Data and Security Constraints
- Use synthetic/anonymized datasets only.
- Use dedicated staging PostgreSQL and Redis instances.
- Store staging secrets in isolated secret manager paths.
- Keep audit trail enabled for owner actions during homologation.
- Rotate staging credentials after test windows when required.

## Payment Safety
- Stripe keys: `test` keys only.
- Webhooks: staging endpoint only.
- No payout configuration in staging.
- Refund and reconciliation smoke tests must use sandbox transactions.

## Access Control
- Restrict network access by allowlist or SSO group.
- Disable indexation/crawling for staging URLs.
- Enforce owner/convenio role checks in staging as in production logic.

## Exit Criteria Before Any Staging Deploy
- Backend image built from current branch and scanned.
- Frontend build compiled with staging env variables.
- Smoke checklist prepared and assigned.
- Incident/rollback checklist available to the team.

