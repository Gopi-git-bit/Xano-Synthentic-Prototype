# Customer registration and draft bookings — isolated milestone

## Actual result, 2026-11-03

**45/45 XanoScript definitions validated; 48/48 real HTTP runtime checks passed.**
Tenant **`ev0h-65a7-56ce`**, ID **5**, internal workspace **1**, branch `v1`;
expires **2026-11-04 05:51:27 UTC**. This tenant is independent of the seven-tool tenant.

| API group | Canonical | ID |
|---|---|---:|
| Customer Draft Authentication | `zippy-customer-draft-auth` | 1 |
| Customer Draft Bookings | `zippy-customer-drafts` | 2 |

| Method/path | Group | Endpoint ID |
|---|---:|---:|
| POST `auth/register` | 1 | 4 |
| POST `auth/login` | 1 | 1 |
| GET `auth/me` | 1 | 2 |
| GET `organization/membership` | 1 | 3 |
| GET `bookings` | 2 | 6 |
| GET `bookings/{booking_id}` | 2 | 5 |
| POST `bookings` | 2 | 7 |

Synthetic proof: user **1**, organization **1**, pending review **1**, draft booking **1**.
IDs above are tenant-local. `evidence/runtime-20261103.json` records each actual test
outcome and counts; no credentials, tokens, passwords, raw responses or records are retained.
After this milestone, the source workspace's published and draft exports still matched
the original inspection byte-for-byte across **87 files each**; see
`evidence/source-preservation-20261103.json` (manifest paths normalized to `/`).

## Behavior and contract

- Registration accepts `name`, `email`, `password`, `organization_name`, optional
  `phone`. `requested_system_role` must be omitted/null; other fields are rejected.
  Email is normalized and unique. Password uses the existing database password field.
- One database transaction creates a new customer organization (`active`, KYB false),
  active `customer_admin` user (legacy role `member`), active owner membership, pending
  customer-onboarding review, and audit event. The response matches PR #8's recovery
  registration fields, including `booking_scope: draft_only`, and contains no token.
  Active status permits isolated draft work; it is not verification approval.
- Login issues a one-hour user token after checking the current account and membership.
  `auth/me` uses the six existing gateway identity fields. Membership reads are limited
  to the current user and an actively joined customer organization.
- Booking reads reuse the published security guards and minimal projections reviewed
  in PR #8. Missing and foreign detail IDs return identical 404 responses.
- Draft POST accepts `request_id` (UUID), `pickup_city`, `pickup_street`, `delivery_city`,
  `delivery_street`, and four ordered future window timestamps. Identity, organization,
  reference, version, state, matching state and all financial fields are server-managed.
  Unknown fields are rejected. Drafts start at version 1 with zero amounts, pending
  payment and no quote. `prepaid` is a stored placeholder, not payment selection execution.
- Owner/admin/dispatcher/member customer memberships can create drafts; billing can
  read only. Vendors, drivers, operators and autonomous identities cannot use these
  customer routes. Roles and membership are rechecked even on idempotent replay.
- The unique idempotency key includes organization, actor and request UUID. A fixed-order
  array of validated primitives is hashed. Same request returns the committed response;
  different payload is rejected. Concurrent losers may return sanitized 400; retrying
  the same request returns the winner. No automatic expiry/reclaim worker is installed.
- Both groups use `history = 0`; password inputs are sensitive. Audit/review context
  contains only IDs and scope, never the registration password or complete request.

The sole schema change from the preserved 34-table candidate is the additive
`approval_request.request_type = customer_onboarding` enum option in this tenant.
It is not a KYB override or an approval. There is no review-approval endpoint.
The 34 schemas are included for a reproducible empty-tenant import; no source migration
was applied. New writes and login are not bound to an MCP server or an agent.

## Reproduce

1. Install pinned tooling in `../agent-tools-review`: `npm ci --ignore-scripts`.
2. Create a fresh ephemeral tenant with the CLI. Copy
   `../agent-tools-review/target.example.json` to ignored `target.local.json`; fill its
   actual nonproduction identity. The original seven-tool target must not be reused.
3. From this directory:

```powershell
node -e "require('./scripts/client.cjs').verify({prepare:true}).then(console.log)"
node scripts/validate.mjs
xano ephemeral push <tenant-name> -p <profile> -w <parent-workspace> -d candidate --dry-run
# Expected: 34 tables, two security functions, two groups and seven endpoints.
xano ephemeral push <tenant-name> -p <profile> -w <parent-workspace> -d candidate --force
node scripts/test.cjs
```

The suite uses actual HTTP registration/login/read/create calls, synthetic random
emails/passwords, and metadata-only fixture edits for revocation/negative-role checks.
It tests registration rollback by hitting the database unique constraint *after* an
organization insert, and independently verifies all table fingerprints afterward.
Concurrency tests prove one committed registration or draft per competing request.
Local evidence is written to ignored `.sandbox/`; tokens exist only in process memory.
Use a fresh tenant for repeated full runs to keep fixture pages bounded.

## Integration boundary and remaining work

PR #8's release gates remain unchanged. No frontend registration/write forwarding has
been added. These results establish this isolated milestone, not production readiness.
The HTTP base pattern is `<isolated-origin>/tenant/<tenant>/api:<canonical>`; production
origins and existing preview values are not included in this package.

This milestone creates the registering user's owner membership and exposes its scope;
invitations, joining existing organizations, membership administration, verification
approval, cargo editing, pricing and operational transitions are later work. Read
guards are rechecked per call; concurrent revocation versus an in-flight write has not
been proven serializable. Provider integrations, registration abuse controls and live
release acceptance remain separate work. No financial, messaging, dispatch, or agent
execution was installed or performed.

Current documentation consulted: [APIs](https://docs.xano.com/xanoscript/api),
[transactions](https://docs.xano.com/the-function-stack/functions/database-requests/database-transaction),
[utilities](https://docs.xano.com/xanoscript/function-reference/utility-functions),
and Developer MCP 2.2.6 syntax/HTTP/database reference. Actual runtime resolved the
raw-input primitive (`util.get_raw_input`) and array membership filter (`in`) where
examples differed. The first input-allowlist attempt was corrected before the passing run.
