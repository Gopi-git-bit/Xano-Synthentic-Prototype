# Frontend integration handoff — 29 October 2026

**Keep auth/read release gates blocked. Current published Xano readers and identity projections match the inspected adapter structurally, but approved-account and cross-tenant runtime acceptance is incomplete.**

Backend branch `codex/xano-m1-reconciliation-20261029`, base `ed62038f571c02f339972ad7ec5d7cd1a9cffe18`. Frontend inspected at `35461bd62bfd90b6f7e901791aa3d097b6649ead`; requested remote `8eeef1e0cdca218f8bdf17f792f3b2cb6b68937b` remains **BLOCKED** by GitHub transport/authentication. Preserved application checkpoint `00d9ef35eb4eb2688eeea290eb412320e0b50366`. No frontend files, release flags, Vercel configuration or unrelated branches were changed.

Target is **workspace 3 / Zippy Synthetic Prototype_1 / v1 / live** on `xynd-fnea-khtp.n7e.xano.io`. Authentication base: `https://xynd-fnea-khtp.n7e.xano.io/api:pofBqnrY`. Logistics base: `https://xynd-fnea-khtp.n7e.xano.io/api:zippy-v1`. These are live URLs, not synthetic fixture environments. No isolated current environment or approved account credentials are available.

**VERIFIED** below specifies source, mock or HTTP scope; **FAILED** is a failed executed check; **BLOCKED** means missing prerequisites; **NOT RUN** means no execution; **NOT IMPLEMENTED** means absent current behavior.

## What supersedes the October 27 handoff

| Earlier blocker | Current result |
|---|---|
| Login logging could include sensitive user/credential objects | **VERIFIED published source:** minimal login selection, sensitive password input, event logger drops all metadata and allowlists action. Persisted synthetic log/runtime inspection **BLOCKED**. |
| `auth/me` incomplete/non-authoritative | **VERIFIED published source:** current backend status/system role/membership resolved each call; narrow identity response. Positive/suspended token tests **BLOCKED**. |
| Booking readers draft-only/empty | **VERIFIED published source:** customer-only tenant-scoped list/detail now present. **8/8** missing/malformed-token probes return 401. Positive isolation acceptance **BLOCKED**. |
| Disabled writes | Published handlers remain empty `null` stubs. Explicit-refusal source checks **FAILED** for 12 routes. A local refusal candidate is prepared but deployment/runtime **NOT RUN**. Business commands are **NOT IMPLEMENTED**. |
| Existing reader/session UI | Preserved. **17/17 server mock tests pass** on inspected frontend; historical browser results remain separate. |

Do not replace current published auth/security/read definitions with the available drafts: 41 definitions differ and several drafts regress projection/logging/disabled recovery protections.

## Backend contract versus adapter

| Endpoint | Published contract and adapter expectation |
|---|---|
| POST `auth/login` | Email/password only; returns `authToken,user_id`. Adapter must revalidate through `auth/me` before returning usable session. No client role/org grants. Approved login HTTP is **NOT RUN**. |
| GET `auth/me` | `{id,name,email,system_role,status,active_organization_id}`. Active status and recognized database role required. Non-admin frontend identity requires a positive organization ID. Backend derives that organization from active organization/membership records; legacy `role` never grants privilege. |
| GET `bookings` | `page` default 1, `per_page` default 20 (max 100), optional status; `{curPage,nextPage,items}`. Adapter passes `requested_org_id` derived from revalidated identity and rejects browser overrides/unknown parameters. Backend validates membership independently. |
| GET `bookings/{booking_id}` | `{booking,cargo,active_holds,blocking_reasons,allowed_actions}`. Cargo and hold arrays contain IDs only; `allowed_actions:[]`; adapter exposes counts, not raw private objects or executable actions. |

Each booking row has exactly the minimal projected fields `id`, `booking_reference`, `customer_organization_id`, `status`, `payment_status`, `payment_mode`, `pickup_city`, `delivery_city`, `version`. The browser projection drops organization ID after verifying it and does not expose amounts/contacts. Current status vocabulary: `draft`, `quoted`, `booked`, `assigned`, `in_transit`, `delivered`, `completed`, `cancelled`. Payment state is separate; transport delivery does not prove payment settlement.

The inspected `frontend/server/bookings.mjs` requires positive IDs/version, supported statuses/payment modes, correct page sequence, arrays, no duplicate list IDs and matching detail ID. Its retained comment calling this a “draft” contract is historical; current published source now supplies this shape. Runtime serialization of successful Xano pages/cargo arrays still needs approved-fixture verification.

Mock tests verify null/malformed provider pages become **502**, foreign projected rows become **403**, valid empty pages remain valid, and denials/timeouts never become success. These tests validate the adapter; they do not establish Xano tenant isolation. No frontend redesign or adapter relaxation is required by current evidence.

## Remaining release acceptance

1. Verify the reported frontend revision remotely and compare adapters/configuration; do not assume local `35461bd` equals `8eeef1e`.
2. Establish an approved isolated expiring workspace-3 test target with approved active A/B and suspended/removed-membership identities. The current broad metadata credential must never be used as application auth.
3. Execute AB-01–AB-08 from [TEST_PLAN.md](../backend/reconciliation-20261029/TEST_PLAN.md): approved login, synthetic logging, own-tenant reads, status/membership revocation, foreign/missing equivalence, filtered pagination and malformed-provider rejection. Record actual statuses and sanitized shapes.
4. Validate the local refusal candidates in isolation; current source does not prove hosted non-2xx mutation behavior. Publish selectively only under separate approval and after a fresh draft/published drift check.

`XANO_AUTH_RELEASE` and `XANO_BOOKING_READS_RELEASE` must not be set to `verified` from this report. Booking writes, payment and Zoho gates remain independent and blocked for release. The inspected gateway's signup mock is not permission to onboard users; published signup/recovery currently refuse.

## Handoff artifacts

- [Current state and complete metadata inventory](XANO_CURRENT_STATE.md)
- [M1 blockers, five-agent map and exact next task](XANO_M1_RECONCILIATION.md)
- [Actual commands, hashes and HTTP evidence](XANO_BACKEND_TEST_EVIDENCE.md)
- [Local-only 12-route refusal candidate](../backend/reconciliation-20261029/candidate)

Next task: verify approved current-workspace isolation/access/fixtures, then execute the refusal and auth/read acceptance matrix. No frontend release is authorized by the local source correction.
