# Zippy Logistics frontend

Enhanced in the existing `frontend/` subproject on `feat/frontend-tailwind-polish`. React, Vite, TypeScript, compiled Tailwind v4, reusable components, reference captures and role themes are preserved.

Commits **`f2fdbba` and `c36631c` are preserved**. The current alignment baseline is integration commit **`96619a8`**, draft PR #7. See the checked [backend–frontend mismatch matrix 0.1.0](../contracts/backend-frontend/0.1.0/README.md) for current source, deployment and runtime boundaries.

[Protected Git-triggered Preview](https://zippy-frontend-preview-k6s6izcsx-gopi-nathan-s-projects.vercel.app) — authenticated Vercel metadata on November 2 confirms READY for `96619a8`; protected application behavior was not tested. Requires Vercel team access; Xano sign-in remains blocked pending isolated acceptance. Older [deployment evidence](docs/VERCEL.md) is historical.

## Run locally

Node 24 / npm 11:

```powershell
cd frontend
npm ci
npm run api:dev
```

In another terminal:

```powershell
npm run dev
```

- Secure account entry: http://127.0.0.1:5173/
- Customer preview: http://127.0.0.1:5173/?demo=1&preview=customer
- Vehicle Owner preview: http://127.0.0.1:5173/?demo=1&preview=owner
- Salaried-driver scenario: http://127.0.0.1:5173/?demo=1&preview=owner&scenario=salaried
- Fleet-owner scenario: http://127.0.0.1:5173/?demo=1&preview=owner&scenario=fleetOwner
- Admin preview: http://127.0.0.1:5173/?demo=1&preview=admin

Fixtures require **both development mode and `demo=1`**. Production excludes fixture JavaScript and the role selector. Preview permissions are examples, not backend authorization. Drafts live in memory and reset on reload; individual forms may reset when leaving their view. English/Tamil navigation remains supported; full Tamil localization is pending.

## Current functionality

- Customer: Home, Book, Orders, Payments, Profile. Four-step booking, IST scheduling, payment-plan requests, quote-unavailable breakdown, drafts, search/filter/export, cancellation-request drafts, tracking details, invoices-unavailable, notifications and support.
- Vehicle Owner: Home, Jobs, Vehicles, Earnings, Profile. One workspace with explicit owner-driver, salaried-driver and fleet-owner preview grants. Assigned-record scope, financial redaction, availability, offer-response drafts, active-trip action drafts, evidence/POD selection, recipient-confirmation status, document corrections, vehicle/driver records and settlement holds.
- Admin: oversight, evidence/financial exceptions, damage reports, scoped hold details, human refund review requirements, announcement/support drafts, five responsibility areas and CRM.
- Production build: release-gated approved-account login and `auth/me` verification, authoritative system-role checks and customer-organization booking reads. Registration has no callable integration and remains unavailable independently of login. Admin CRM checks authenticated server status before showing dynamically granted modules. Release flags remain blocked; Vehicle Owner assigned-work access awaits callable contracts.

No operational writes, payment collection, GPS, broadcasts or CRM record mutations are performed by previews. Financial and upload actions remain unavailable until their authoritative APIs exist.

## Integration status

**Retained October 29 published source contains hardened auth and customer booking readers.** Workspace 3 / v1 authentication is at `api:pofBqnrY`; logistics is at `api:zippy-v1`. This supersedes the October 27 placeholder/logger snapshot. Published booking mutations remain empty null stubs; signup/recovery refuse. Historical malformed/anonymous read probes returned 401. Positive auth, tenant isolation and serialization remain unverified. Proposed recovery and owner/admin routes are **NOT_DEPLOYED**; no isolated runtime is currently verified for this task.

Auth and booking list/detail are wired and mock-tested behind separate server-only release gates. The read UI filters canonical booking states, keeps pagination context across refresh/retry, cancels superseded reads and returns to account entry when a session ends. All booking mutations are refused. The existing demo workflows remain development fixtures, excluded from production bundles. [Release sequence and exact blockers](docs/XANO.md).

The **2026-10-31** OpenCode MCP connection successfully read organization/module/field metadata for **Zippy Logitech**, superseding the historical October 27 MCP 401 result. REST OAuth credentials and explicit server record grants are still absent; MCP does not supply them to the frontend gateway. The Admin reader is tested through the real gateway with synthetic providers, not live-connected. See [CRM acceptance and release blockers](docs/ZIPPY_ZOHO_CRM_FRONTEND_ACCEPTANCE.md), [sanitized audit](docs/zoho-audit-2026-10-31.json) and [API/security contract](docs/API.md).

## Checks

```powershell
npm run typecheck
npm run lint
npm run build
npm run test:server
npm test
npm run verify:crm
node scripts/scan-browser.mjs
```

Playwright uses installed Microsoft Edge locally and installed Chromium on CI, test Vite port **5174**, production preview **4173**, and API adapter **3001**. Stop a manually started API server before `npm test`; test servers are isolated. Responsive checks cover 320, 390, 768, 1024 and 1440 px. Tests regenerate current screenshots. Server tests use injected HTTP mocks, never tenant records. The dedicated frontend PR workflow runs these checks with blocked gates and no provider secrets; it does not deploy.

The optional private-file argument to `scan-browser.mjs` checks exact configured values without printing them. Do not copy private configuration into the project or documentation.

## Structure

```text
src/main.tsx               Explicit development-only fixture import
src/Access.tsx, api.ts      Account entry and same-origin API client; token in memory
src/Bookings.tsx           Gated read-only customer booking list/detail
src/CRM.tsx                Gated Admin CRM module/list/detail reader; preview stays offline
src/components.tsx         Reusable accessible UI, map and timeline
src/styles.css             Compiled Tailwind v4 + semantic role themes
src/demo/                  Preserved/enhanced fixture workspaces and permissions
server/gateway.mjs         Release gates, authoritative identity, read authorization
server/bookings.mjs        Strict tenant-scoped response validation and projection
api/gateway.mjs            Vercel Node function and bounded request parsing
server/dev.mjs             Loopback development API
tests/, server/*.test.mjs  Browser workflows and security/failure tests
docs/                     Delivery, API/Vercel setup, screenshots, historic baseline
references/               Original reference assets; never imported by the app
```

[Delivery and screenshots](docs/DELIVERY.md) · [API contracts and blockers](docs/API.md) · [Vercel setup](docs/VERCEL.md)
