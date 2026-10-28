# Zippy Logistics — Xano prototype and frontend

This repository contains Xano workspace source plus the Zippy Logistics web frontend under development. **The default `main` branch contains the Xano-exported sources; the React frontend is presently developed on `feat/frontend-tailwind-polish` and must not be assumed to exist on `main`.**

## Project layout

| Location | Purpose |
| --- | --- |
| `api/`, `table/`, `function/`, `middleware/`, `ai/`, `workspace/` | XanoScript workspace/export definitions; source presence does **not** prove publication to the live database |
| `frontend/` (frontend branch) | React 19, Vite 8, TypeScript, compiled Tailwind CSS v4; development-only workspace previews |
| `frontend/server/`, `frontend/api/` | Same-origin API gateway, fail-closed integration adapters, test server |
| `frontend/tests/`, `frontend/playwright.config.ts` | Existing Playwright browser suite; do not replace it |
| `frontend/docs/` | API, deployment, verification and delivery evidence |
| `docs/RELEASE_MANAGEMENT.md` | Release and rollback rules |
| `docs/E2E_TEST_PLAN.md` | Test inventory and execution strategy |

## Frontend development

Checkout `feat/frontend-tailwind-polish` (or a review branch based on it). In `frontend/` use Node 24 and npm 11:

```sh
npm ci
npm run api:dev
```

In a second terminal:

```sh
npm run dev
```

The local application is at `http://127.0.0.1:5173/`. Development fixtures require `?demo=1`. Role preview selectors and fixture workflows are **not** production authentication or authorization.

For full instructions, read [the frontend README](frontend/README.md), [delivery record](frontend/docs/DELIVERY.md), [API and integration notes](frontend/docs/API.md), and [Vercel deployment record](frontend/docs/VERCEL.md).

## Validation

Run from `frontend/` after installing dependencies and a compatible Microsoft Edge browser for Playwright:

```sh
npm run typecheck
npm run lint
npm run build
npm run test:server
npm test
node scripts/scan-browser.mjs
```

Playwright uses its own local frontend/API servers; stop a separately running development API server before executing the browser suite. See [E2E test plan](docs/E2E_TEST_PLAN.md). Historical test pass counts in delivery notes are evidence from that development run, **not** current CI verification.

## Release status and guardrails

- Frontend: protected Vercel **Preview** documented, not a production launch.
- Xano: published vs draft contracts must be verified independently. Existing discovery records show authentication and booking release blockers; do not interpret exported XanoScript files as functioning live APIs.
- The live auth path, booking reads/writes, Zoho reads, payments, POD verification and financial actions must remain blocked until their respective security, tenant-isolation, authorization, testing and owner-approval gates are satisfied.
- Never commit API keys, service tokens, customer data, `.env.local`, browser session material or full provider responses.

The separate [New-logistic- repository](https://github.com/Gopi-git-bit/New-logistic-) preserves the earlier application/control-plane work. Its Playwright and release-management PRs are reference work, not automatically applicable to this Vite/Xano frontend.

See [release policy](docs/RELEASE_MANAGEMENT.md) before promotion, merging between branches, enabling any server-only release flag, or changing production infrastructure.
