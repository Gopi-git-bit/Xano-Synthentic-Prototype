# Frontend E2E verification plan — Zippy Logistics

**Reviewed source:** `Gopi-git-bit/Xano-Synthentic-Prototype`, `feat/frontend-tailwind-polish`, commit `00d9ef35eb` (2026-10-28). This is the active React/Vite frontend branch; the Xano-exported default `main` does not contain the frontend.

## Existing harness — preserve, do not regenerate

- `frontend/playwright.config.ts`: `@playwright/test`, Microsoft Edge channel (`msedge`), 1440 × 1000 default viewport, reduced motion, HTML and list reporters, traces and screenshots on failure.
- Playwright starts three loopback web servers: API `127.0.0.1:3001`, Vite development `127.0.0.1:5174`, and Vite production preview `127.0.0.1:4173`. Build `dist/` **before** running Playwright.
- `frontend/tests/workspaces.spec.ts`: existing responsive role workspaces, booking drafts, permissions, POD/financial status separation, accessibility, and explicit development-demo safeguards.
- `frontend/tests/booking-reader.spec.ts`: new booking status filtering/pagination, retry context, concurrent request isolation, Retry-After manual retry, sign-out/401 session recovery, and closed-reader state.
- `frontend/server/gateway.test.mjs` and `frontend/server/xano.test.mjs`: isolated server/API mock and authorization/error behavior.
- `frontend/package.json`: scripts `typecheck`, `lint`, `build`, `test:server`, and `test` already exist. The project already uses Playwright and axe; do not add a second runner.

## Latest reported test evidence (not a CI certification)

The October 28 frontend delivery notes report **26 distinct browser scenarios** (18 previous plus eight new) passing across a full run and focused follow-up reruns, and **17 server tests** passing. The full browser run initially had some new filter-selector failures that were corrected and rerun in focused tests. This documentation change has **not** independently executed a consolidated GitHub Actions run. Do not present historical local passes or mocked responses as a successful live-Xano integration test.

## Required local and GitHub checks

Use Node 24/npm 11 and install a compatible Microsoft Edge browser. From `frontend/`:

```sh
npm ci
npm run typecheck
npm run lint
npm run build
node scripts/scan-browser.mjs
npm run test:server
npm test
```

Stop other local servers on ports 3001, 5174 and 4173 before running `npm test`: the Playwright config starts these with `reuseExistingServer: false`. Browser tests require `dist/`, so run the production build first. The secret scanner checks static private-identifier patterns when no private-file argument is supplied; only an explicitly supplied local private file enables value-based scanning. **Do not put private keys in CI or test artifacts.**

The proposed GitHub workflow is [`/.github/workflows/frontend-quality.yml`](../.github/workflows/frontend-quality.yml); see [CI operator notes](CI_WORKFLOW.md).

## Test matrix

| Capability | Required assertions | Current scope |
| --- | --- | --- |
| Customer draft | Validation, preserved fields, safe empty/error statuses | Local development fixtures |
| Gated booking reader | Filter resets page, retry and refresh preserve scope, denial clears stale data | Injected/mock API responses |
| Session recovery | Late response cannot overwrite a new session; 401 and closed gates return to account entry | Mocked status/identity responses |
| Vehicle owner and driver | Assigned-only information, no financial data for salaried drivers, offline state does not invalidate active tasks | Fixtures and role checks |
| Admin and Zoho | Unavailable CRM is honest; no accidental live provider reads or unauthorized mutation | Unreleased/mock adapters |
| Responsive and accessible UI | 320/390/768/1024/1440 widths, keyboard/axe checks, no overflow | Local browser tests |
| Production safety | No self-selected role, fixtures excluded from production bundles, no false payment/POD success | Built bundle and mock tests |

## Unreleased backend gate — mandatory before live E2E

Published Xano `auth/me` must return authoritative identity, active status, system role and organization; legacy auth logging must not expose credential-bearing user objects. Booking list/detail must be genuinely published (not `200/null` placeholders), tenant constrained, and tested for both authorized and denied accounts using approved **synthetic** identities. Positive read-only integration, negative tenant tests, error handling and session expiry must be demonstrated before enabling `XANO_AUTH_RELEASE` or `XANO_BOOKING_READS_RELEASE`.

All booking mutations, dispatch, payments, refunds, POD confirmation and settlement remain separately blocked pending approved contracts, evidence, authorization, audit and human approvals. CRM read access is independently blocked. Automated CI must not publish Xano schema, send real payments, change provider configuration or deploy Vercel. Protected Vercel Preview is not production authorization.

## CI acceptance and follow-up

The workflow deliberately runs for PRs targeting and pushes to `feat/frontend-tailwind-polish`, **not** Xano-only `main`. It installs Node 24 and Microsoft Edge, builds before Playwright, and runs all existing tests without app code changes. Require a green run at the **proposed commit** before merging; inspect failures and keep evidence attached to the PR. A passing CI check establishes only this mocked/frontend quality baseline. It does not verify Xano publication or production readiness.
