# Zippy Logistics frontend

Enhanced in the existing `frontend/` subproject on `feat/frontend-tailwind-polish`. React, Vite, TypeScript, compiled Tailwind v4, reusable components, reference captures and role themes are preserved.

Commits **`f2fdbba` and `c36631c` are preserved**. Published commit **`00d9ef3`** completes status filtering, page-preserving retries and session-expiry handling for the release-gated booking reader. The next integration step awaits safe backend publication and approved test accounts. See [frontend plan and publication handoff](docs/FRONTEND-PLAN.md).

[Protected Git-triggered Preview](https://zippy-frontend-preview-cknmd8fll-gopi-nathan-s-projects.vercel.app) — the user’s Composio handoff confirms publication complete and READY for `00d9ef3`. Requires Vercel team access; Xano sign-in remains blocked pending backend fixes and live validation. [Deployment evidence](docs/VERCEL.md).

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
- Production: release-gated Xano account entry/registration and `auth/me` verification, authoritative system-role checks and customer-organization booking reads. All release flags are currently blocked. Admin CRM displays honest unavailability; Vehicle Owner assigned-work access awaits callable contracts.

No operational writes, payment collection, GPS, broadcasts or CRM record mutations are performed by previews. Financial and upload actions remain unavailable until their authoritative APIs exist.

## Integration status

**Deployed Xano endpoints and OpenAPI contracts were located.** Workspace 3 / v1 authentication is at `api:pofBqnrY`; logistics is at `api:zippy-v1`. Safe live probes verified anonymous `auth/me` → **401** and booking list → **200 / null**. The latter is a published placeholder, not success. Booking/security implementations exist as unpublished drafts. Live auth uses an unsafe older logger, so credential entry stays blocked. No positive login or booking-to-delivery workflow is claimed; an approved test account is still needed.

Auth and booking list/detail are wired and mock-tested behind separate server-only release gates. The read UI filters canonical booking states, keeps pagination context across refresh/retry, cancels superseded reads and returns to account entry when a session ends. All booking mutations are refused. The existing demo workflows remain development fixtures, excluded from production bundles. [Release sequence and exact blockers](docs/XANO.md).

The existing Zoho MCP URL was probed read-only: **HTTP 401**, no tools/modules discovered and no records accessed. REST OAuth client ID, client secret and refresh token are absent. See [connectivity evidence](docs/zoho-connectivity.json) and [API/security contract](docs/API.md).

## Checks

```powershell
npm run typecheck
npm run lint
npm run build
npm run test:server
npm test
node scripts/scan-browser.mjs
```

Playwright uses installed Microsoft Edge, test Vite port **5174**, production preview **4173**, and API adapter **3001**. Stop a manually started API server before `npm test`; test servers are isolated. Responsive checks cover 320, 390, 768, 1024 and 1440 px. Tests regenerate current screenshots. Server tests use injected HTTP mocks, never tenant records.

The optional private-file argument to `scan-browser.mjs` checks exact configured values without printing them. Do not copy private configuration into the project or documentation.

## Structure

```text
src/main.tsx               Explicit development-only fixture import
src/Access.tsx, api.ts      Account entry and same-origin API client; token in memory
src/Bookings.tsx           Gated read-only customer booking list/detail
src/CRM.tsx                Unavailable Admin screen; dormant reader retained
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
