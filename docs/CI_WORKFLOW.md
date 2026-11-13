# GitHub Actions CI handoff — Zippy frontend

**Status:** Proposed review-only workflow. `docs/frontend-readme-release-e2e-20261028` is a draft pull request branch targeting `feat/frontend-tailwind-polish`. The active frontend commit inspected for configuration is `00d9ef35eb` (2026-10-28).

## Workflow

[`.github/workflows/frontend-quality.yml`](../.github/workflows/frontend-quality.yml) is scoped to:

- `pull_request` with **base** `feat/frontend-tailwind-polish`
- `push` to **exactly** `feat/frontend-tailwind-polish`

It **does not** run on `main`, which currently contains Xano-exported backend source but not this React frontend. It has read-only GitHub permissions, bounded concurrency and no deployment, GitHub release, schema-publishing, branch-merging, or feature-flag steps.

## Validation sequence

Runs on Ubuntu 24.04 with Node 24, npm lockfile installation and the Microsoft Edge binary needed by the repository's existing `msedge` Playwright configuration:

1. `npm ci --no-audit --no-fund`
2. `npm run typecheck`
3. `npm run lint`
4. `npm run build` (also generates the `dist/` used by the Vite preview server)
5. `node scripts/scan-browser.mjs`
6. `npm run test:server`
7. `npx playwright install --with-deps msedge`
8. `npm test` (existing `workspaces.spec.ts` and `booking-reader.spec.ts`)

All npm commands run from `frontend/`. Existing Playwright config starts the loopback API, Vite and preview servers at ports 3001, 5174 and 4173. The job does **not** need `.env.local`, Xano metadata credentials, Zoho secrets, or Vercel access tokens. The server-only environment release switches are explicitly set to `blocked`. `scan-browser.mjs` without a private-value file checks forbidden identifiers, **not** exact secret values; do not describe it as a complete credential-leak audit.

On failure, the workflow may upload Playwright HTML reports and traces for **synthetic tests only**, retained for seven days. Review access to artifacts and avoid putting real tenant information or private credentials into tests.

## Required review evidence

Before approving or promoting the frontend PR:

- Check the Actions run conclusion **and** commit SHA. A YAML file committed to GitHub is not proof that checks executed.
- Verify no fixture-role controls or simulated payment/POD success appear in the production bundle.
- Confirm role restrictions, session 401/recovery, filtering, pagination, stale response clearing and denial tests still pass.
- Confirm no unexpected external calls, backend publication, Vercel deployment or changes to release gates.
- Review [the E2E plan](E2E_TEST_PLAN.md) and [the release policy](RELEASE_MANAGEMENT.md).

## Deployment and backend boundaries

The latest frontend delivery report documents a protected Vercel Preview of an older commit, and OpenCode's later `00d9ef35eb` code has no proven new preview deployment in this audit. CI does **not** connect Vercel. It also does **not** prove a callable, safe, published Xano auth/booking contract: both live integrations remain blocked.

The GitHub repository's default branch is `main`. GitHub Actions visibility and branch protection may need a later owner-approved configuration decision; this PR does not change them. Only promote after independently verified release gates, approved test identities, tests and an explicit owner deployment decision.
