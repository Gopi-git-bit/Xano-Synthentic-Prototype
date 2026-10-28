# Zippy unified MVP frontend delivery

## Delivered source

Continued the existing frontend in `C:\Users\ashok\Documents\GitHub\zippy-frontend-polish\frontend` on `feat/frontend-tailwind-polish`. Existing React/Vite/TypeScript, compiled Tailwind v4, role palettes, components and published reference captures are preserved. Historical delivery documents are retained as `BASELINE-README.md` and `BASELINE-DELIVERY.md`.

**Preserved commits: `f2fdbba` and `c36631c`.** The `c36631c` baseline located the actual deployed Xano workspace/contracts and added fail-closed release gates and read-only booking validation. Its protected Preview is published; newer local work is described below. Backend publication and Zoho troubleshooting remain with the user.

### Continuation — 2026-10-28

The user supplied a successful Composio publication handoff for `c36631c`, preserving `f2fdbba`, and its READY Git-triggered Preview. The publication blocker is resolved; [VERCEL.md](VERCEL.md) records that handoff separately from historical direct-upload evidence.

The next local frontend increment completes the gated customer booking reader: canonical status filtering, page-preserving refresh/retry, cancellation of superseded reads, bounded manual Retry-After handling and session-expiry recovery. Authenticated UI is removed on 401 (including non-JSON denials), unsupported identity or closed auth release; account availability is rechecked. A late response cannot expose previous-session data or invalidate a newer session. The filter has a separate accessible description. [Current plan and next GitHub action](FRONTEND-PLAN.md).

Deployment settings, release gates, backend sources and the existing role-themed fixture workspaces are unchanged. The new reader/session code is local until published through Composio.

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

Node 24.22.1, npm 11.19.1 and installed Microsoft Edge. **Build/TypeScript, lint, 17 server tests and browser secret scan passed. All 26 browser cases have passing results across the full run and focused reruns.** The full run passed the 18 preserved workspace cases and four new session cases. Four new filter scenarios initially failed due to an exact-label locator; after separating the filter hint and targeting its accessible combobox role, all four passed. The existing reader and session scenarios also passed the focused rerun.

| Check | Coverage |
|---|---|
| Build / TypeScript | Passed: `npm run build` compiled TypeScript and Vite production bundle |
| Lint | Passed: frontend, tests, server, API entry and scripts |
| Server tests | 17 passed: release gates/no upstream calls, legacy-role/inactive/organization denial, safe session issuance, tenant and response validation, immutable write refusals, provider errors/timeouts, plus retained dormant CRM object/field/refresh/rate-limit tests |
| Browser tests | 26 unique cases covered: 18 preserved workflows plus 8 new reader/session cases; all passing after focused fixes. New coverage includes status/paging/retry, stale-response isolation, rate-limit waiting, non-JSON 401/identity/gate expiry and blocked-reader isolation |
| Responsive | 320, 390, 768, 1024, 1440 px dashboards; every main destination at 320 px |
| Accessibility | Targeted axe WCAG A/AA dashboards + booking/jobs/reviews; keyboard dialog return focus and reduced-motion configuration |
| Secret scan | Current local bundle passed against eight private provider values. The earlier remote bundle and nine-value repository review belong to the `c36631c` baseline; its deployed source hashes are not claimed to match this newer local increment |
| Vercel Preview | Composio handoff reports READY / Git Preview at `c36631c`; historical protection/routing/gate smoke results are retained in VERCEL.md. No new remote deployment or bypass was created for this increment |

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
- **Deployment evidence:** Composio published the `c36631c` baseline and verified its Git Preview, as supplied in the user handoff. This local continuation performed no GitHub push, merge or deployment. See [Vercel status and checks](VERCEL.md).

## Preview and review

See [README](../README.md) for two-terminal startup and commands. Preview entry points use `http://127.0.0.1:5173/?demo=1&preview=customer`, `preview=owner`, or `preview=admin`. Without the explicit development demo flag, the app opens secure account entry.

Changes are confined to `frontend/` for a new reviewable commit above `f2fdbba`. Existing Xano sources are unchanged. Deferred visualization, lending, insurance automation, predictive intelligence, advanced analytics, fleet sync, withdrawals and multi-stop optimization are not implemented.
