# Zippy Logistics — Sandbox-only customer vertical slice

**Stage:** implementation candidate, NOT DEPLOYED as a browser API or production feature.
**Backend source:** OpenCode draft PR #10, head 4421892ff9c884e43711753cacde04efd4ddb7c6.
**Frontend base:** draft PR #9, stacked on API-alignment PR #8.
**Date:** 2026-11-03.

## Exact Xano routes

The separate ephemeral customer draft milestone has two API groups:

| API group suffix under the isolated tenant | Route | Capability |
| --- | --- | --- |
| /api:zippy-customer-draft-auth | POST auth/register | Creates customer user, organization, owner membership, pending review, audit (no token) |
| Same | POST auth/login | Issues short-lived auth token |
| Same | GET auth/me | Reads active account and current organization |
| Same | GET organization/membership | Reads current organization and customer membership |
| /api:zippy-customer-drafts | POST bookings | Creates an idempotent draft booking only |
| Same | GET bookings | Tenant-scoped booking list |
| Same | GET bookings/{booking_id} | Tenant-scoped booking detail |

Both API bases MUST be constructed from an independently verified exact HTTPS instance origin and the SAME /tenant/<tenant-name>/ boundary. Neither live API group (api:pofBqnrY or api:zippy-v1) is a valid target. External MCP streaming and tool-debug routes are not app HTTP APIs.

## Frontend integration candidate

The server-only adapter frontend/server/sandbox-customer-flow.mjs implements:

1. Register a synthetic new customer using an @example.invalid address (no browser/production accounts).
2. Log in explicitly; registration returns NO auth token.
3. Read auth/me and organization/membership using the bearer token and validate organization ownership.
4. Create a draft booking using a UUID request_id, pickup/delivery city and street, and future ordered timestamps. Financial fields, status, organization and version are server-managed.
5. Retrieve the draft in a tenant-filtered list and detail view, checking draft-only and allowed_actions=[].

The adapter never copies bearer tokens, passwords, addresses or unfiltered Xano responses to its result. It rejects non-synthetic registrations, forbidden client fields, foreign organization results, unexpected API groups, mismatched tenant, invalid response shapes and redirects. No booking confirmation, dispatch, payment or refund is implemented.

## Tests

From the frontend directory:

    npm run test:server

The new sandbox-customer-flow.test.mjs suite uses injected synthetic fetch responses only. It must pass in CI with NO requests to Xano. The existing real OpenCode Xano tests reported 45/45 syntax validations and 48/48 sandbox HTTP checks independently; these are separate evidence classes and are NOT new frontend end-to-end acceptance.

## Manual local synthetic HTTP test

Only OpenCode or another approved Xano test operator should run the following after independently verifying an isolated tenant: separate DB identity, no live records or secrets, parent/live denial, no provider/agent egress, and valid tenant expiry. The approval flag alone does not prove those conditions.

    $env:ZIPPY_SANDBOX_EXPECTED_ORIGIN = "https://<verified-Xano-instance>"
    $env:ZIPPY_SANDBOX_TENANT = "<verified-sandbox-tenant>"
    $env:ZIPPY_SANDBOX_TEST_APPROVAL = "synthetic-write-test-only"
    npm run verify:sandbox-customer
    Remove-Item Env:ZIPPY_SANDBOX_TEST_APPROVAL, Env:ZIPPY_SANDBOX_TENANT, Env:ZIPPY_SANDBOX_EXPECTED_ORIGIN

This local script writes one synthetic user, organization, pending review and draft booking in the isolated tenant. It generates credentials in memory and emits only synthetic record IDs and status. CI and Vercel explicitly reject execution. The previous sandbox tenant ev0h-65a7-56ce was reported to expire on November 4, 2026 at 05:51:27 UTC. Create a fresh tenant if required.

## Release boundary and next step

This module is intentionally NOT imported by frontend/server/gateway.mjs or frontend/api/gateway.mjs. Production auth, booking reads and booking writes stay blocked; no Vercel promotion, schema publication or payment provider actions are approved.

To complete an actual full-stack vertical slice, a tested protected preview-only gateway/UI route must consume this adapter after the manual HTTP proof passes. It requires Playwright and server denial tests, stable sandbox identity, revocation behavior, and separately reviewed activation. The five Xano operational agents are out of scope for this customer slice.
