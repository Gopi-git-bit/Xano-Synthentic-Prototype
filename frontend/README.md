# Zippy Logistics frontend

Enhanced in the existing `frontend/` subproject on `feat/frontend-tailwind-polish`. React, Vite, TypeScript, compiled Tailwind v4, reusable components, reference captures and role themes are preserved.

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
- Production: Xano account entry/registration and `auth/me` adapter. Verified Admin users can access the read-only CRM UI when OAuth, tenant permissions and explicit per-user record grants are configured. Member operational access remains unavailable until a logistics authorization contract exists.

No operational writes, payment collection, GPS, broadcasts or CRM record mutations are performed by previews. Financial and upload actions remain unavailable until their authoritative APIs exist.

## Integration status

**No live Xano or Zoho REST integration has been verified.** The local Xano sources establish `POST auth/login`, `POST auth/signup`, and `GET auth/me`. Those paths are wired through a server adapter, tested with controlled mocks. A deployed base URL and test account are missing.

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
src/CRM.tsx                Metadata-driven authorized CRM reads
src/components.tsx         Reusable accessible UI, map and timeline
src/styles.css             Compiled Tailwind v4 + semantic role themes
src/demo/                  Preserved/enhanced fixture workspaces and permissions
server/gateway.mjs         Xano authentication, CRM role/object/field authorization
api/gateway.mjs            Vercel Node function and bounded request parsing
server/dev.mjs             Loopback development API
tests/, server/*.test.mjs  Browser workflows and security/failure tests
docs/                     Delivery, API/Vercel setup, screenshots, historic baseline
references/               Original reference assets; never imported by the app
```

[Delivery and screenshots](docs/DELIVERY.md) · [API contracts and blockers](docs/API.md) · [Vercel setup](docs/VERCEL.md)
