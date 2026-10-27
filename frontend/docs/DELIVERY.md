# Zippy unified MVP frontend delivery

## Delivered source

Continued the existing frontend in `C:\Users\ashok\Documents\GitHub\zippy-frontend-polish\frontend` on `feat/frontend-tailwind-polish`. Existing React/Vite/TypeScript, compiled Tailwind v4, role palettes, components and published reference captures are preserved. Historical delivery documents are retained as `BASELINE-README.md` and `BASELINE-DELIVERY.md`.

**Preserved base: `f2fdbba`.** This increment locates the actual deployed Xano workspace/contracts, adds fail-closed release gates and read-only booking validation, and deploys a verified protected Vercel Preview. Backend publication and Zoho troubleshooting remain with the user.

### Workspaces

- **Customer:** Home, Book, Orders, Payments, Profile. Personal/company profile forms, registration draft plus secure account-entry implementation, four-step booking with preserved inputs, immediate/custom IST scheduling, full/partial/ToPay request options, quote breakdown unavailable states, local confirmation drafts, search/filter/CSV, tracking detail, cancellation-request preparation, payment/collection/balance/consent/invoice distinctions, notifications and support.
- **Vehicle Owner:** Home, Jobs, Vehicles, Earnings, Profile. Driver/provider are consolidated. Owner-driver, salaried-driver and fleet-owner preview grants independently control execution, evidence preparation, management and financial visibility. Only assigned fixture records are passed to the view; restricted finances are redacted before rendering/export. Availability does not cancel active work. Offers, local accept/decline responses, assigned next-action drafts, pickup/POD evidence selection, recipient-confirmation status, re-upload preparation, history and settlement-hold reasons are included.
- **Admin:** order/payment/tracking oversight, participant and vehicle context, POD/damage exceptions, scoped hold requirements, human refund-review requirements, support/announcement drafts and CRM. Financial execution remains unavailable pending permission, confirmation and audit contracts. Operational holds never imply vehicle immobilization.

### Integration infrastructure

- Server-runtime proxy for discovered Xano login/signup/auth-me endpoints, blocked pending auth security release. Sessions validate active status/system role before releasing a token; legacy company `role` does not grant access.
- Production account-entry screen, disabled credential entry while unreleased, in-memory Xano token, no production role selector.
- Separately gated customer booking list/detail with bounded queries, tenant checks, strict null/malformed-response rejection and scalar field projection. Mock-tested against discovered draft shapes; positive live reads remain unverified.
- All booking writes are blocked; reported actions never become client command grants. Assigned-trip, delivery, POD and financial execution remain unavailable.
- Admin CRM displays unavailable status with independent MCP 401 and REST OAuth blockers. The earlier read-only adapter and its mock coverage remain dormant behind a separate blocked release flag.
- Vercel project configuration, API/SPA routes, security headers and secret-free environment example.

All operational examples are explicitly development-only (`demo=1`). Timers never generate payment, assignment, upload, verification or GPS success. Sample POD review states no longer serve as order lifecycle states. ToPay consent and timeout/reconciliation are independent from collections.

## Verification

Node 24.22.1, npm 11.19.1 and installed Microsoft Edge. **Current local results: build/TypeScript and lint passed; 18 browser tests and 17 server tests passed; browser secret scan passed.**

| Check | Coverage |
|---|---|
| Build / TypeScript | Passed: `npm run build` compiled TypeScript and Vite production bundle |
| Lint | Passed: frontend, tests, server, API entry and scripts |
| Server tests | 17 passed: release gates/no upstream calls, legacy-role/inactive/organization denial, safe session issuance, tenant and response validation, immutable write refusals, provider errors/timeouts, plus retained dormant CRM object/field/refresh/rate-limit tests |
| Browser tests | 18 passed: preserved responsive role workflows and state separation, production isolation, disabled credential entry, authenticated CRM unavailable, booking read contract and stale-record clearing on denial |
| Responsive | 320, 390, 768, 1024, 1440 px dashboards; every main destination at 320 px |
| Accessibility | Targeted axe WCAG A/AA dashboards + booking/jobs/reviews; keyboard dialog return focus and reduced-motion configuration |
| Secret scan | Passed: local/remote browser bundles checked against eight private provider values; repository review checked those plus the Xano metadata credential (nine total), without printing values; 27 deployed source hashes match local files |
| Vercel Preview | READY / preview; protection, SPA routing, API denial/gates/no-store, same-origin CSP, mobile entry and deployed-bundle isolation verified; temporary bypass revoked |

Browser authentication and positive booking reads use explicitly controlled mocks; they do not prove live Xano success. Original fixture workflows still cover booking draft preservation, restricted finances, evidence, offers and separate payment/consent/POD states. The new read screen also passes targeted axe and 320px overflow checks.

## Screenshots

Current images are regenerated by Playwright; all are fixture/unavailable views rather than live service evidence.

| Workspace | Desktop | Mobile |
|---|---|---|
| Customer | [Desktop](screenshots/customer-desktop.png) | [Mobile](screenshots/customer-mobile.png) |
| Vehicle Owner | [Desktop](screenshots/owner-desktop.png) | [Mobile](screenshots/owner-mobile.png) |
| Admin | [Desktop](screenshots/admin-desktop.png) | [Mobile](screenshots/admin-mobile.png) |

Additional: [salaried financial restriction](screenshots/owner-salaried-restriction.png), [CRM unavailable](screenshots/admin-crm-unavailable.png), [Tamil navigation](screenshots/customer-tamil-navigation.png), [production entry](screenshots/production-access-gate.png). Earlier Driver/Provider and original published-reference images remain as historical artifacts.

Visual review retained the sidebar/card/truck/map/timeline design. Role controls fit mobile widths, status colors retain their meaning, touch targets are approximately 44px, and 180–200ms transitions respect reduced motion. Existing English/Tamil navigation is preserved; remaining copy is not fully localized.

## Verified connectivity versus blockers

- **Verified live Xano behavior:** anonymous auth/me returns 401; anonymous booking list returns 200/null. Deployed bases and authenticated Metadata API Swagger were located in workspace 3 / v1. **No successful live authentication, booking read or booking-to-delivery workflow is claimed.**
- **Auth release blocker:** published login/signup pass a password-containing user object to the old logger, and published auth/me lacks authoritative system-role/status/organization fields. Credential entry and upstream authentication calls are blocked by default.
- **Booking release blocker:** published booking/security/domain handlers are placeholders; substantive implementations are unpublished drafts. Read adapters are gated and mock-tested; every mutation remains blocked. [Exact discovery and backend-owner handoff](XANO.md).
- **Zoho MCP: HTTP 401.** Read-only discovery failed; no tools/modules or CRM records were accessed. [Sanitized probe evidence](zoho-connectivity.json).
- **Zoho REST:** client ID, client secret and refresh token are missing. Actual modules, field permissions and test record IDs remain unverified. Default server record grants deny access.
- **Later-stage contracts not found:** assignment/availability/trip execution/GPS, upload/POD/recipient confirmation, verified collections/reconciliation/invoices/refunds/settlements and messaging. Booking/quote/consent/hold contracts were found in drafts and are not incorrectly described as absent. [Integration matrix](API.md).
- **Development fixtures:** all full Customer, Vehicle Owner and operational Admin workflows. They are explicitly local previews, never substituted for failed live calls.
- **Deployment evidence:** see [Vercel status and checks](VERCEL.md). No Git push or merge was performed.

## Preview and review

See [README](../README.md) for two-terminal startup and commands. Preview entry points use `http://127.0.0.1:5173/?demo=1&preview=customer`, `preview=owner`, or `preview=admin`. Without the explicit development demo flag, the app opens secure account entry.

Changes are confined to `frontend/` for a new reviewable commit above `f2fdbba`. Existing Xano sources are unchanged. Deferred visualization, lending, insurance automation, predictive intelligence, advanced analytics, fleet sync, withdrawals and multi-stop optimization are not implemented.
