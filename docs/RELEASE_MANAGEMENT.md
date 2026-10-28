# Release management — Zippy Logistics frontend and Xano integration

**Status (2026-10-28): PREVIEW/REVIEW ONLY. No approval to release live booking, payments, authentication or Xano database changes.**

## 1. Ownership and branch policy

- Repository: `Gopi-git-bit/Xano-Synthentic-Prototype`.
- `main`: default branch, Xano-exported sources as inspected. Do not automatically overwrite or publish Xano from frontend commits.
- `feat/frontend-tailwind-polish`: current frontend development branch. OpenCode may be making concurrent local edits.
- Supporting documentation and test-planning updates must use a **separate branch based on the frontend branch** and a pull request targeting `feat/frontend-tailwind-polish`. Do not push directly into OpenCode's branch or overwrite its files.
- The older `New-logistic-` repository has separate Playwright PR #4 and automated-release PR #5. Review for reusable ideas only; merging there does not release this Vite frontend.

Before any merge, inspect current remote branch HEAD and changed files. Never force-push, merge unrelated Xano exports or auto-update a production branch based on unreviewed work.

## 2. Version and change records

- Use SemVer tags for reviewed frontend releases, e.g. `frontend-v0.1.0-rc.1`; do not tag a review branch as a production release.
- Each candidate must include commit SHA, base branch, change summary, test evidence, Xano contract/version tested, Vercel deployment ID and approver.
- Separate *frontend release* from *Xano workspace publish/database migration* and *server-side integration gate change*. Each has an independent approval and rollback procedure.
- Store release notes with the PR or review record; avoid secrets and customer information.

## 3. Required frontend checks

From `frontend/` with Node 24, npm 11, clean `npm ci`, and Playwright-compatible Microsoft Edge:

1. `npm run typecheck`
2. `npm run lint`
3. `npm run build`
4. `npm run test:server`
5. `npm test`
6. `node scripts/scan-browser.mjs`
7. Review Playwright screenshots, mobile widths, keyboard/axe issues and regressions to role/tenant isolation.
8. Confirm no fixture data, provider credentials, local environment files, token values, false success states or production role selectors enter built assets.

**No claim of passing checks should be made from file existence alone.** The frontend delivery report records an earlier local run with 18 browser and 17 server tests passing; independently rerun on the proposed release commit. A failing or unrun required check blocks promotion.

## 4. Xano/authorization release gates — independent of UI quality

The backend owner must verify published, callable contracts in the target workspace/branch, not merely Xano draft code or a GitHub export. Based on the current frontend discovery documents:

- **Authentication BLOCKED:** Published legacy login/signup logging may expose sensitive user objects, while `auth/me` lacks the complete authoritative identity, status, organization and system-role contract required by the frontend. Require safe logging, verified published contract, positive and negative auth tests, and test-account approval.
- **Booking reads BLOCKED:** The observed anonymous booking-list `200 / null` is an unusable placeholder; published tenant guards and valid response shapes must be verified with allowed and denied test tenants. No cross-tenant leaks.
- **Booking writes, dispatch, POD verification, collection, refunds and settlement BLOCKED:** Require their approved API and authorization contracts, idempotency and audit trails, explicit human approvals for finance/refunds, and integration tests.
- **Zoho CRM reads BLOCKED:** Provider connectivity and authorization must be established separately and never bypassed for demo.
- Demo actions and mocked/fixture tests are not proof of functioning live orders, payments, dispatch or logistics agent execution.

Only the server-side owner may change `XANO_AUTH_RELEASE`, `XANO_BOOKING_READS_RELEASE` or `ZOHO_READ_RELEASE`. Changes require independent documented approval and appropriate backend test evidence; never set a flag to enabled solely to make the UI appear functional.

## 5. Preview and production deployment process

1. Review PR diff and scope. Require all Section 3 checks.
2. Deploy the candidate to an **isolated, access-protected Vercel Preview**. Configure project root as `frontend`; use `npm ci`, `npm run build`, output `dist`. Do not silently connect an unrelated Vercel project/repository.
3. Verify SPA/API routing, CSP, `no-store` API responses, asset isolation, protected access, mobile layout and server-side blocked integrations. Release flags and provider credentials must never be public `VITE_` variables.
4. Record preview URL/deployment ID, SHA, screenshots, test evidence and unresolved blockers.
5. Production promotion requires a separate explicit owner decision after published Xano behavior and real end-to-end workflows are verified with authorized test identities. No auto-promotion while backend release flags remain blocked.

The prior protected Vercel Preview reported in `frontend/docs/VERCEL.md` is evidence of one deployed snapshot, **not** proof the current branch is deployable or production-ready.

## 6. Rollback and incident response

- Frontend UI defect: revert the specific reviewed frontend change and redeploy the last known-good Vercel artifact. Keep the previous deployment identifier and rollback trigger in the release record.
- Integration/security defect: first **disable the affected server-only release gate** and deny unsafe requests; then investigate and redeploy as required.
- Xano schema/publish defect: stop writes and use the independently reviewed Xano backup/migration/restore procedure. A Git revert **does not** undo a published database schema or customer-data mutation.
- Payment, refund, POD or authorization discrepancy: stop automated execution, preserve sanitized evidence and route to human review. Never simulate success or automatically refund as a rollback shortcut.
- Document owner decision, blast radius, recovery verification and follow-up actions.

## 7. Stop conditions

Stop release for any leaked secret, unresolved tenant-boundary issue, unauthorized role escalation, Xano draft/published mismatch, failing gate, unexplained 200/null response, unprotected preview, incorrect project targeting, or unverified production payment/financial operation.

This document is a process definition only. It does not publish Xano changes, alter Vercel deployments, enable an API or certify a release.
