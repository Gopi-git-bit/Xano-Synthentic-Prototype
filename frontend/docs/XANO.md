# Xano discovery and release handoff — 2026-10-27

## Located deployment

- Configured instance: `https://xynd-fnea-khtp.n7e.xano.io`.
- Workspace **3**, **Zippy Synthetic Prototype_1**; branch **v1**, live.
- Authentication group **5**: `https://xynd-fnea-khtp.n7e.xano.io/api:pofBqnrY`.
- Zippy_V1 group **7**: `https://xynd-fnea-khtp.n7e.xano.io/api:zippy-v1`.
- Event Logs group **6**: `api:h1FBhliB`; not connected to the frontend.
- This worktree belongs to `Gopi-git-bit/Xano-Synthentic-Prototype`. The historical `New-logistic` repository is separate; no local checkout was found and GitHub lookup timed out. The old local Xano sources at `223bae3` do not represent the current deployed workspace.

Metadata discovery used the configured Xano CLI profile, without printing its token. `workspace list`, `branch list -w 3`, and separate `workspace pull -w 3` / `workspace pull -w 3 --draft` calls retrieved **83 documents and one knowledge file per snapshot**. Environment values and records were not pulled. Xano backend publication and changes remain with the user; no push, publish, mutation, test-user creation or backend edit was performed.

## Swagger evidence

The logistics group's public Swagger is disabled. Its contracts were successfully retrieved through authenticated Metadata API reads:

```text
GET /api:meta/workspace/3/apigroup
GET /api:meta/workspace/3/apigroup/5/openapi
GET /api:meta/workspace/3/apigroup/6/openapi
GET /api:meta/workspace/3/apigroup/7/openapi
GET /api:meta/workspace/3/openapi?branch=v1
```

Raw snapshots/specs remain outside the repository under the approved local temporary directory, in `zippy-xano-discovery-20261027`, `zippy-xano-drafts-20261027`, and `zippy-xano-contracts-20261027`. The sanitized [evidence manifest](xano-discovery.json) records spec hashes and observed runtime behavior. Published Swagger has empty input schemas and no auth requirement on placeholder logistics handlers; it is not evidence that draft security has been deployed.

Repeat only the anonymous read/denial probes with `node --env-file=.env.example scripts/probe-xano.mjs` from `frontend/`. It prints status/response type, never record bodies, and does not use the Metadata API token. This is not a positive-auth or workflow acceptance test.

## Published versus draft versus runtime

| Capability | Published source / runtime | Unpublished draft | Frontend disposition |
|---|---|---|---|
| Login / signup | Real handlers; old logger receives user object including password hash | Newer logging/auth work exists | Credentials blocked before any upstream request |
| `GET auth/me` | Anonymous request returns **401**; authenticated projection is legacy `id, created_at, name, email, role` | Adds `phone, system_role, active_organization_id, status`; side-effect-free read | Requires active status and authoritative system role; legacy role alone fails closed |
| Booking list/detail | Empty handlers; anonymous list returns **200 with JSON null** | Tenant-scoped list and authorized detail | Gated, mock-tested read adapter; null is an error, never an empty list |
| Booking commands | Empty handlers | Create/update/quote/accept/payment selection/consent/confirm/cancel/holds/resume | All mutations blocked; no live execution claimed |
| Security dependencies | `resolve_context`, `authorize_resource`, domain functions and middleware are placeholders | Active membership and action checks | Read gate stays blocked until publication and live permission tests |
| Assignment through delivery | No callable endpoint found in published or draft inventory | Tables alone do not define APIs | Development fixtures only; no production commands |

### Located logistics routes (12 paths / 14 operations)

```text
GET, POST    /bookings
GET, PATCH   /bookings/{booking_id}
POST         /bookings/{booking_id}/cancel
POST         /bookings/{booking_id}/confirm
POST         /bookings/{booking_id}/quotes
POST         /bookings/{booking_id}/quotes/{quote_id}/accept
POST         /bookings/{booking_id}/payment-selection
POST         /bookings/{booking_id}/consent-attempts
POST         /consent-attempts/{attempt_id}/decision
POST         /bookings/{booking_id}/holds
POST         /bookings/{booking_id}/holds/{hold_id}/release
POST         /bookings/{booking_id}/resume
```

Draft list input: `page`, `per_page` (1–100), optional `status` and `requested_org_id`. Response is a paged Xano list. Detail returns `{booking, cargo, active_holds, blocking_reasons, allowed_actions}`. The adapter derives organization from the validated account, permits customer system roles only, verifies every returned organization, and projects a small read-only response. Membership is still the responsibility of the published Xano guard; an organization ID alone is not a membership grant. Live paging shape and positive reads remain unverified.

Draft create input requires pickup/delivery cities, structured address objects, four ordered window timestamps and itemized `cargo_items`. Its response contains `booking_id`, `booking_reference`, `status`, `version`, cities and currency. The existing demo wizard is not blindly submitted to this different contract.

Draft lifecycle: `draft`, `quoted`, `booked`, `assigned`, `in_transit`, `delivered`, `completed`, `cancelled`. Payment selection accepts `prepaid` / `topay`; the table also lists `credit`. No approved partial-payment percentage or collection success is inferred. POD/consent/payment/settlement remain separate from booking status.

## Backend-owner handoff and next validation sequence

1. Review/fix the **published** login/signup logger so password hashes, reset data, tokens and credentials are never logged. Publish the required safe identity projection and verify account status/revocation. Existing logs require the backend owner's review.
2. Supply approved test accounts with customer, different-organization, suspended and restricted-driver cases. Validate login/signup/me and role injection denials before setting server-only `XANO_AUTH_RELEASE=verified` in a new preview deployment. URL configuration alone does not release access.
3. Review/publish booking read endpoints together with `security/resolve_context`, `security/authorize_resource` and required middleware. Validate active membership, unauthorized IDs, cross-organization reads and financial restrictions. Confirm real list/detail shapes, then release `XANO_BOOKING_READS_RELEASE=verified` for the tested deployment. Keep Production independently blocked until approved.
4. Review draft mutation dependencies before the next frontend increment: create defaults missing distance to **480 km**, references use second-resolution time, and booking insertion precedes per-item weight validation. Confirm transaction rollback, collision handling, idempotency and authoritative routing/pricing evidence rather than treating a null/timeout as success. These are review findings, not backend changes made here.
5. Validate draft → quote → accept → payment selection → consent/collection → confirmation/cancellation/holds incrementally with approved synthetic records. This frontend increment has **no mutation release switch** and submits none of those commands.
6. Provide callable assignment, trip execution, delivery, upload/POD and settlement contracts, then test assigned-record access and state separation. Those endpoints were not found; no guessed routes are wired.

Release flags are operator attestations, not automatic proof of backend security. They must stay blocked until the corresponding published code and runtime tests are verified. If Xano changes, revoke the relevant flag and redeploy before revalidating.

Zoho is independent: the earlier MCP probe returned **401**, while REST OAuth credentials were missing. Its Admin screen stays unavailable; troubleshooting remains with the user.
