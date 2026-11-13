# Workspace-3 isolated acceptance scope — approval requested

**PROVISIONING_NOT_APPROVED / BLOCKED.** Current parent target: `xynd-fnea-khtp.n7e.xano.io`, workspace **3**, source branch **v1**. Its existing live data source is excluded from all provisioning, schema, fixture, application and cleanup mutations.

## Supported method, verified read-only

The current Metadata OpenAPI, installed CLI implementation and official [ephemeral-tenant documentation](https://docs.xano.com/xano-cli/ephemeral.md) agree on:

- `POST /api:meta/workspace/3/ephemeral` with `{display, description, expires_hours, tag}`. **Not called.**
- CLI `xano ephemeral create <display> -p <approved-profile> -w 3 --expires-hours 4`.
- Ephemeral tenants are documented as database-isolated, workspace-scoped, auto-expiring environments with **1–24 hour** lifetime. The installed CLI enforces these bounds. Its edit command does not extend expiry.
- Tenant code preview/import is scoped to `/workspace/3/tenant/<returned-name>/multidoc/dry-run` and `/multidoc`. The ephemeral push implementation uses those paths and does not support branches; **v1 is the source branch**, not an assumed independently selectable tenant branch.
- `--dry-run` performs a server-side preview POST. It is an approval-gated operation, not part of this read-only discovery.
- `GET .../impersonate` mints a session/credential despite being GET. It was **not called** and is not a read-only substitute for restricted authentication.

Fresh discovery executed **seven GETs**: Metadata OpenAPI, identity, workspace, branches, data sources, tenant list and ephemeral list. Workspace remains 3/v1, data-source label is `live`; tenant and ephemeral lists remain empty. Existing metadata credential remains admin/nonexpiring with live scope 15. No records, environment values, application APIs or credential-minting routes were read. Receipt: `backend/m1-acceptance-preparation/evidence/isolation-discovery.json`.

Documentation establishes a supported product mechanism, not successful provisioning, empty-database semantics, plan entitlement, restricted-role enforcement or physical isolation on this instance. Those remain acceptance prerequisites.

## Exact owner approval requested: stage P (provisioning and proof only)

1. **One** new ephemeral tenant, display `zippy-w3-m1-ab-<run-id>`, parent workspace **3**, expiry **4 hours**, no automatic renewal. Record the server-returned tenant name and expiry; do not invent either.
2. Confirm with the platform/owner that creation starts with no parent records or environment secrets copied. The create API has no explicit `copy_records=false` switch; absence of such a parameter is not proof. If this cannot be established, stop before creation.
3. Owner-created **dedicated restricted metadata identity/credential**, initially **1 hour** expiry, never later than tenant expiry. Do not reuse the discovered admin token as an executor or application identity. New credential/profile values stay outside Git and logs. Owner provisioning authority may create the tenant/role; it is not supplied to the acceptance runner.
4. Bind code/schema/content permissions only to this returned tenant. Parent workspace live data: deny **read/create/update/delete**. Deny parent code/schema/env publication, cross-tenant access, unrestricted impersonation, agent/tool runs, releases, billing, notifications and payment credentials. No blanket account-role changes or alterations to existing credentials.
5. Permit only the reviewed **59-definition A/B source allowlist** in a new empty isolated database: 33 captured table definitions, two API groups, three security/logging functions, nine existing auth/read/disabled queries and 12 refusal candidates. No draft business implementations, records, environment values, operational agents, tools, tasks, triggers or MCP servers. Source manifest SHA-256: `23f6d3bd00c267f481e62bb31506935eda92f4888e909cc6ce16056ef0e20997`.
6. Preview this allowlist, review the exact change set, then import only within the approved tenant. No `workspace push`, `--delete`, `--truncate`, `--no-transaction`, `--env`, `--records` or production release deployment. Initial fixture writes are a separate bounded step below.
7. Establish deny-all external provider egress for the test environment; no real provider credentials; scheduled/agent execution disabled. If the platform cannot independently enforce and observe these controls, side-effect acceptance stays blocked.
8. Authorize read-only native catalog/physical-identity observation **inside the isolated tenant**, and an owner-supplied supported read-only parent database-identity receipt without customer records or live helper publication. Compare identities; metadata table counts alone are insufficient.

Stage P approval is **not** permission to run application tests, seed users, publish live, enable release gates or process money. A new approval reference must identify this scope and expiry.

## Permission verification requirements

Official [Metadata API documentation](https://docs.xano.com/xano-features/metadata-api.md) describes token scopes combined with user roles, tenant roles, tenant settings and RBAC. [Workspace RBAC](https://docs.xano.com/team-collaboration/role-based-access-control-rbac.md) distinguishes Live Data Source access. A CLI profile is only a target selector; it is not an access boundary.

- Obtain supported tenant-specific overrides that allow the test database while denying the **parent** live database. The tenant's own data-source label may also be `live`; a label comparison cannot establish safety.
- Record effective identity/role/scope/expiry under the restricted credential, after any role changes/re-authentication. Numeric scope bits must not be guessed or copied from the admin token.
- Prove parent live denial through supported permission evaluation and a no-record negative read probe approved by the owner. If using a documented record-read endpoint, use an impossible/nonexistent record identifier with no potential real row, and accept only an authorization denial; 400/404 is inconclusive. Do not enumerate live content. No live POST/PATCH/DELETE is permitted merely to test whether it is denied.
- Obtain independent proof that tenant application tokens cannot authenticate against parent live identities. Do not probe live `auth/me` in a way that could return a real user's record. If tenant-specific signing/authorization isolation cannot be established through safe platform evidence, application execution stays blocked.
- Current captured login JWT lifetime is **86400 seconds**. It was not silently changed. The metadata credential is separately short-lived. Before execution, either approve a separately hashed isolated-only TTL change or explicitly accept the application-token lifetime with verified tenant-token isolation/destruction semantics. Do not claim these JWTs expire in one hour.
- Tenant guest impersonation is a read-only review session, not an application JWT or proof of restricted write capability. Never publish impersonation URLs.

Exact minimum role configuration and token-issuance capability are **BLOCKED** until verified on this instance. No token-generation API endpoint is inferred from CLI profile creation; credential issuance is through the documented owner access-token/RBAC workflow.

## Subsequent approval requested: stage F/AB (fixtures and execution)

Only after stage P passes, approve these synthetic-only fixtures and actions:

- **2 organizations:** A and B, active customer type.
- **7 users:** active customer A, active customer B, suspendable customer A, membership-revocable customer A, restricted driver A, operations-admin test identity, pending-verification customer A. Reserved `.invalid` emails; randomly generated passwords; no real contacts or outbound verification.
- **6 memberships:** all except the operator identity, with the driver role restricted. Record all assigned IDs and ownership in a private fixture registry.
- **5 bookings:** A has two draft and one booked; B has one draft and one booked. **2 cargo rows + 2 active holds**, one for each organization's selected booking. Other business tables start empty. Do not invoke draft create/price/confirm logic to seed.
- Fixture-controlled nonexistent booking ID and UUID path tokens for refused quote/consent routes; no real quote, OTP, consent, payment or refund action.
- Exact temporary controls: suspend/restore the dedicated customer; revoke/restore the dedicated membership; deactivate/restore organization A. These are the only state-changing acceptance controls beyond fixture seeding and legitimate login audit rows. Never update real accounts or parent data.
- A maximum **220 tested application requests** (144 refusal variants plus bounded B cases), six prerequisite logins, six fixture control calls and read-only observations. Observer/native adapter calls must receive a separate explicit bound when implemented. No retries of ambiguous mutations.

The native adapter/observer is **NOT IMPLEMENTED**, because no approved tenant/routing/access exists. Its API and proof obligations are in [execution preparation](XANO_ACCEPTANCE_EXECUTION.md). Approving the JSON template yourself is not evidence of owner approval or isolation.

## Recovery and cleanup

Stop immediately on target/expiry/source drift, unexpected effects, credential leakage or transport ambiguity. Capture sanitized receipts; freeze further requests. Do not retry writes or automatically repair partially completed fixture controls. An owner-approved recovery may restore only the registry's changed synthetic fields, after inspecting row-level deltas. Otherwise leave the isolated tenant untouched for inspection until its approved expiry.

Default cleanup is the tenant's **documented automatic expiry**, with destruction verified afterward through the tenant listing/owner platform receipt. Export sanitized evidence before expiry; revoke the dedicated credential at completion or expiry. No database reset, truncate, parent restore or bulk deletion is authorized. Immediate tenant deletion or a replacement/recovery tenant requires its own explicit approval; backup/restore routes are not part of this scope.

**Next environment action remains an approval decision. No environment was created or modified.**
