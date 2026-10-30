# Stage P1 — Xano platform capability matrix

**2026-10-30 — BLOCKED_PENDING_XANO_CONFIRMATION.** Investigation milestone: `W3-P1-PLATFORM`; predecessor: `W3-P0`, private checkpoint `55d4dd278602c5a81706db70d91b53ca363f4d9c`. No tenant or restricted credential exists. This is a read-only feasibility record, not Stage P authorization.

## Evidence vocabulary and limits

- **VERIFIED_INSTANCE**: observed in the retained, independently verified P0 receipts, including exposed schema; no new authenticated instance request was made.
- **VERIFIED_DOCUMENTATION**: an official statement captured on 2026-10-30; not an account-specific guarantee.
- **SUPPORTED_BUT_UNPROVEN**: a documented mechanism whose applicability or enforcement on this instance is unproved.
- **REQUIRES_VENDOR_CONFIRMATION**: an exact missing guarantee or safe proof procedure requires Xano.
- **UNSUPPORTED**: the specifically named approach contradicts documented capabilities or fails the required boundary; not a blanket claim about Xano.
- **BLOCKED**: prerequisites prevent acceptance or execution.

Source IDs D01–D18 resolve to exact URLs, UTC access times and SHA-256 values in [SOURCE_CATALOG](../backend/m1-platform-capability-20261030/SOURCE_CATALOG.md). Retained private input paths/hashes are in `investigation-context.json` in that directory. `schema-observations.json` is an offline projection of the retained P0 Metadata schema, not a fresh API call. Official Markdown variants were captured for the requested documentation pages. D16 is captured pricing HTML plus a reproducible text extraction.

## Seven-question determination

| ID | Determination | Precise evidence | Remaining proof / responsible party |
|---|---|---|---|
| P1-01 Entitlement | **REQUIRES_VENDOR_CONFIRMATION** | D01: ephemeral lifetime 1–24h, own DB/config; D16: Essential sandbox yes, RBAC no, Multiple Tenants no (Pro also no). P0: `essential2`, empty tenant lists, CLI 1.3.4 and create schema exposed. | Xano must reconcile ephemeral exception, exact SKU/allocation, four-hour use, cost and required owner permissions without a create probe. |
| P1-02 Tenant-only identity | **BLOCKED** | D04 scopes span instance workspaces; D03 combines roles/settings/scopes. D02/D16 put granular RBAC on Pro/Custom; D05 describes overrides and an override-toggle caveat. | Vendor-supported effective authorization proof across parent, target and unrelated tenants, including aliases and bypass paths. Owner then reviews a least-privilege permission design; no credential issuance yet. |
| P1-03 Physical DB isolation | **SUPPORTED_BUT_UNPROVEN** | D01/D05 promise distinct tenant DBs; D05 distinguishes Shared from Dedicated/Remote resources. D08 connector is instance-wide. No actual DB identities in P0. | Xano supplies a safe DB identity/placement attestation or approved metadata/catalog procedure with tenant-restricted access. |
| P1-04 Empty/no-copy bootstrap | **REQUIRES_VENDOR_CONFIRMATION** | D05 general tenant: no automatic release, release contains logic/schema not records. D01: own env/config, no explicit empty-secret guarantee. Ephemeral create schema lacks copy and task-disable parameters. | Exact ephemeral bootstrap contract before creation; independent record/secret-presence and disabled-executor receipts before any later import. |
| P1-05 External effects | **BLOCKED** | D10 general tenants have tasks switch, default on; D06/D07 control incoming traffic; D17 outgoing static IP is not an egress firewall. P0 allowlist omits providers/executors. | Enforced deny-by-default outbound policy plus independent deny/attempt counters for every runtime; tenant-specific engine controls. No complete supported Essential mechanism identified. |
| P1-06 Application tokens | **REQUIRES_VENDOR_CONFIRMATION** | Retained published TTL 86,400s; D11 configurable expiry; D12 native auth uses JWE. No documented tenant-key binding or destruction revocation guarantee found. | Vendor token/key/tenant-resolution semantics and safe auth-only negative tests; shorter TTL alone is insufficient. |
| P1-07 Expiry/recovery | **SUPPORTED_BUT_UNPROVEN** | D01 four hours allowed, automatic destruction, edit cannot extend; D03 one-hour Metadata expiry and revocation. Retained schemas expose `created_at`, no explicit `expires_at`. | Server-issued expiry field/audit event, removal SLA, revocation semantics, independent observer and fail-closed mid-run recovery; entitlement still unresolved. |

## P1-01 — entitlement, allocation, permissions and price

**VERIFIED_INSTANCE:** retained plan observation at `2026-10-30T12:10:58.691Z` reports `essential2`; feature arrays are empty; additional RBAC, tenant/tier2/tier3 allocations are 0. These are observed fields, not an authoritative denial or complete subscription contract. Existing authenticated tenant lists were empty. CLI version/help/list and Metadata operation exposure establish discoverability, not permission to provision. The create operation describes `Tenant_center: Create`; actual membership entitlement remains unknown.

**VERIFIED_DOCUMENTATION:** D01 supports `expires_hours = 4` within 1–24. D16 advertises CLI sandbox environments on Essential, Permissions Center only on Pro/Custom, and Multiple Tenants only on Custom. It does not name ephemeral tenants. D15 recommends Billing → Plan and Support for account-specific mapping; its captured feature table is incomplete and cannot establish missing entitlements. D18 account `GET /instance/{name}` documents only name/display/domains/rate-limit/Metadata URLs, not entitlement/allocation/cost fields. Its authentication is at `app.xano.com`, not the instance origin.

**REQUIRES_VENDOR_CONFIRMATION / safe proof:** owner reviews existing Billing → Plan/add-on details read-only and supplies a redacted entitlement view or vendor ticket stating exact package revision, ephemeral eligibility, concurrent/total limits, four-hour limit, billing rate/overage/cleanup charges and required membership/scopes. Request an authoritative feature endpoint if one exists. No account API token was repurposed across origins; no license endpoint was used as a subscription lookup. `Secrets: Read` tenant licenses and cluster kubeconfig are inappropriate probes.

**UNSUPPORTED:** claiming creation is entitled because listing succeeds, an endpoint exists, or `additional.tenants = 0` has an assumed meaning. No instance-specific additional cost is verified.

## P1-02 — highest-priority tenant-only authorization

**VERIFIED_DOCUMENTATION:** D04 explicitly spans all workspaces in an instance. D03 says roles, tenant roles/settings and token scopes affect access, and changes may require reauthentication/token regeneration. D02 default admin/developer roles cannot be modified; Live Data Source denial still permits other datasource content where other rights allow. Neither profile selection, `-w 3`, tenant URL, `X-Tenant`, nor a datasource name is an authorization boundary.

**VERIFIED_DOCUMENTATION:** D05 offers per-tenant overrides and separate deploy, deploy-bypass, backup, impersonate and secrets permissions. It explicitly warns that denying **Tenant Center RBAC** editing does **not** prevent enabling/disabling overrides. A deploy review gate is also not a substitute for denying production deployment permissions. D02/D16 exclude standard Permissions Center from Essential; D05 calls Tenant Center an add-on without establishing this account's entitlement.

**BLOCKED:** no dedicated identity or effective target-only restriction exists in the retained evidence. Granting general content/API/database write scopes could allow parent or unrelated-resource actions unless a resource-level deny is enforced. Denying parent Live Data Source access must also be reconciled with permitted synthetic-record access to the tenant's own live datasource.

**REQUIRES_VENDOR_CONFIRMATION — proof design required before issuance:** Xano must provide the supported permission configuration and a read-only policy-evaluation/audit procedure returning decisions for:

| Resource/action family | Required decision for eventual test identity |
|---|---|
| Named returned tenant only | Only separately approved source/schema/fixture/runtime operations, no broader administration |
| Parent live records and parent code/schema/env changes | Deny across Metadata, UI, direct connector and aliases; no parent-record reads or attempted parent writes as probes |
| Other workspaces/tenants | Deny irrespective of URL, headers, CLI profile or selected datasource |
| Impersonation, secrets, license/kubeconfig, privilege/override changes | Deny unrestricted access, self-escalation, override toggle and credential/session minting |
| Production releases, review approval/bypass, restore/clone/reuse | Deny; no permission to promote test work into production |
| Token lifecycle | Server-enforced lifetime ≤3,600 seconds, no self-renewal/issuance; revocation propagation documented |

No public policy-simulator endpoint was identified in the inspected schema subset. This table is a **required proof contract**, not an invented API. Vendor must supply a supported mechanism; owner/vendor-produced sanitized effective-permission attestation may establish design feasibility, with separately authorized enforcement testing later in wholly synthetic environments. Read denials against parent records and mutation probes remain excluded. A broad administrative credential kept in a different profile does not qualify.

## P1-03 — physical identities and comparison

**VERIFIED_DOCUMENTATION:** D01 says each ephemeral has its own database; D05 Shared provides data isolation while Dedicated/Remote add separate resource allocations. Neither proves a separate physical host for an ephemeral. D08 explicitly says direct connector access is instance-wide, not workspace-isolated, including when read-only.

**SUPPORTED_BUT_UNPROVEN:** candidate read-only tenant detail route is `GET /api:meta/workspace/3/tenant/{returned_name}` with `Tenant_center: Read`. Retained schema has logical tenant/cluster/release/platform and `k8s` fields but no declared authoritative physical database identity. Dedicated/Remote Infrastructure views document pods/PVCs; that observability is not promised for Shared. No returned tenant or parent DB identity is available now.

**REQUIRES_VENDOR_CONFIRMATION / safe proof:** request vendor-owned, timestamped mapping of parent environment → immutable database/storage identity and returned tenant → immutable database/storage identity, allocation type, provider/cluster scope and access boundary. If using an approved catalog route later, vendor must specify an allowlisted read-only query returning identity only, exact tenant routing/privileges and whether it leaks other resources. Compare qualified identities (cluster plus database/storage identity), not bare names or DB OIDs from different clusters. Demonstrate distinct databases and absence of cross-database access; if the requirement means distinct server/VM/storage resources, Shared documentation is insufficient and the owner must retain that stronger requirement when evaluating Dedicated/Remote/separate-instance options.

**UNSUPPORTED:** table counts, `live` labels, tenant name/URL or connector availability as physical separation proof. A wide connector credential fails tenant-only access. No SQL, connector connection, customer records or helper function was used.

## P1-04 — empty initialization before source import

**VERIFIED_DOCUMENTATION:** D05 general tenants do not deploy a release by default; releases contain logic/schema only and preserve existing tenant data/env. D01 describes own env/config but also advertises testing with records/env; it does not say precisely what initialization copies. General release behavior does not establish ephemeral bootstrap semantics.

**REQUIRES_VENDOR_CONFIRMATION:** ask whether ephemeral creation copies any parent tables/records, environment values, authentication material, integration credentials, files, cache, queues, schedules, triggers or agents; whether any default release or startup hook executes; and whether task/executor denial is atomic at creation. The narrow ephemeral create body has no explicit no-copy or tasks-off switches. Setting tasks off after creation may leave a startup race and is not accepted as pre-creation protection.

**Safe proof sequence, for a later separately approved scope:** (1) vendor supplies the exact empty-start/no-secret-copy and no-execution contract; (2) outbound/executor denial is effective before runtime starts; (3) privileged independent observer obtains secret-presence indicators/key names only, record-count/empty-state attestations only for the isolated database, and code/release/agent/task/trigger inventories; (4) bind all receipts to returned tenant and physical DB identity before import; (5) abort on any unexpected inherited content. Keys can be redacted/hashes used where names are sensitive. Do not export secret values or inspect parent records to prove absence. Counts establish empty state, not physical DB separation.

**BLOCKED:** no supported value-free secret inspection or atomic bootstrap denial has yet been established for this exact ephemeral implementation. Retained source omission and absent copy flags do not close this gap.

## P1-05 — egress, providers and independent observation

**VERIFIED_INSTANCE:** P0 observed empty task/table-trigger/agent-trigger inventories; the reviewed 59-definition package omits providers, tasks, agents and tools. The parent instance has task infrastructure enabled. These are source/inventory observations, not network or engine enforcement.

**VERIFIED_DOCUMENTATION:** D10 regular tenant `--no-tasks` is a management control and defaults to enabled; applicability to ephemeral creation is not established. D06/D07 security policies describe incoming IP rules, Direct Query/Redis and login controls. D17 Static IP identifies outgoing API traffic and can require a migration/base-URL change; it supplies neither outbound deny policy nor coverage of every runtime. D05 ingress disablement and a proxy URL also do not establish outbound enforcement.

**BLOCKED:** no complete documented, currently enabled Essential tenant-level egress deny and independent counter mechanism was found. No security-policy flag, pricing claim or empty outbox establishes it.

**REQUIRES_VENDOR_CONFIRMATION — candidate enforcement design:** Xano-managed tenant-specific outbound deny-by-default policy, or a Xano-supported isolated Remote/self-hosted network with firewall/network-policy enforcement covering APIs, background tasks, agents/tools, triggers, lambdas/microservices, DNS, direct IP, IPv4/IPv6 and alternative proxy paths. Any allowlist must exclude real payment/messaging/CRM destinations and prevent bypass. An optional observation proxy is insufficient unless all runtime egress is forced through it. Instance-wide controls are candidates only on a separate isolated test instance, not changes to production.

Required blocked effects: Razorpay payment/refund; Telnyx email/SMS; WhatsApp messaging; Zoho CRM writes. Credentials for these providers must be absent, and autonomous agents, scheduled tasks and table-trigger execution must be disabled independently of source omission. Vendor must identify per-engine switches, trigger activation behavior during later imports and which controls require Custom/Remote infrastructure.

**Independent proof required:** effective network policy ID/hash and target binding, externally controlled allow/deny/attempt counters or flow logs with time range and completeness/retention guarantees, plus separate engine state/invocation counters. Application code must not be able to alter these observations. Observe denied attempts as well as successful egress; no log entries alone is not proof the monitor works. A later approved harmless canary to an owner-controlled sink can establish monitoring coverage without contacting a real provider. Native adapter and independent observer remain unimplemented. No canary/provider call occurred here.

## P1-06 — native application authentication (JWT/JWE)

**VERIFIED_INSTANCE:** retained published login issues application tokens for 86,400 seconds. The proposed Metadata identity lifespan is a different credential control. **VERIFIED_DOCUMENTATION:** D11 `security.create_auth_token` has configurable seconds; D12 describes native tokens as **JWE**, not necessarily readable/JWS JWTs. Do not decode or assume readable issuer/audience/key claims or undocumented signing-key namespaces.

**REQUIRES_VENDOR_CONFIRMATION:** exact per-instance/per-workspace/per-tenant key boundary, tenant/table/user resolution before data access, behavior for colliding synthetic user IDs, routing via base URL/`X-Tenant`, key inheritance on clone/release/restore, rejection by parent/other tenants, token validity during teardown and after destruction, retained backups and tenant-name reuse. A 404 after deletion only establishes that route is unavailable at that time, not cryptographic revocation or rejection by another environment.

| Strategy | Classification | Required proof / residual risk |
|---|---|---|
| A: retain 86,400s | **SUPPORTED_BUT_UNPROVEN** for issuance; **BLOCKED** for acceptance | Vendor must establish cross-tenant rejection and invalidation after the four-hour tenant lifetime, including restore/reuse; the token otherwise outlives the tenant by many hours. |
| B: isolated-only TTL ≤3,600s | **SUPPORTED_BUT_UNPROVEN** for configurable expiry; **BLOCKED** for execution | Separate reviewed isolated-only source delta, new manifest/hash, owner authorization and runtime proof. Preserve original manifest/source. Short TTL reduces exposure but does not prevent cross-tenant acceptance, copied keys or user-ID collisions; a token minted near teardown can still outlive the tenant. |

**Safe future proof:** vendor-supported authentication-only policy evaluation that returns acceptance/rejection without resolving or returning real records, plus synthetic test identities in wholly isolated test contexts with matching/nonmatching IDs and controlled clocks. Prove rejection across routing variants, after token expiry, after tenant expiry/destruction and after attempted identifier reuse. For parent-live rejection require a supported no-record verifier/vendor attestation; do not call a parent profile/`auth/me` application endpoint as a shortcut. No supported no-record parent verifier has yet been identified. No token was minted or tested; neither strategy is selected or implemented.

## P1-07 — expiry, cleanup, audit and recovery

**VERIFIED_DOCUMENTATION:** D01 supports four hours, automatic destruction at expiry, and edit changes display/description only, not expiry. D03 supports a one-hour Metadata token and revocation at any time. These statements do not establish teardown latency, revoked-token propagation or key erasure. D16 advertises Essential audit retention 7 days, Pro 28 days; those marketing durations do not guarantee the required tenant/security events or receipt export.

**SUPPORTED_BUT_UNPROVEN:** retained create/list/detail schema declares `created_at`; no explicit `expires_at` was found. Ask Xano for server-issued creation/expiry timestamps and deletion audit events/clock source. Do not derive authoritative expiry solely from a client clock or the requested `expires_hours` value. Example timestamps/default fields in OpenAPI are not observations.

**REQUIRES_VENDOR_CONFIRMATION / future runbook:** pin immutable returned tenant identity and server creation/expiry timestamps; reject mismatches and cap execution to the earlier credential or tenant expiry with a documented clock-skew margin. A ≤1h executor token cannot observe a 4h teardown unaided: owner/vendor must provide a separately approved, minimal read-only observer independent of the executor, or a vendor audit receipt; do not renew the executor automatically. Require revocation receipt after use and proof of revocation enforcement using a supported harmless auth decision, not data retrieval.

Observe removal through an approved detail/list operation with pagination and a positive control showing the observer is still authorized, plus lifecycle audit evidence. A 404, timeout or empty page alone is not enough. Retain sanitized tenant/DB-identity references, UTC times, policy/source hashes, token fingerprint (never token), revocation/deletion event references and network/engine counters outside the expiring tenant.

If expiry occurs mid-test: stop all transport dispatch/retries immediately; mark incomplete/in-flight results **NOT VERIFIED**, retain independent counters and reconciliation evidence, and request owner review. Never fall back to parent live, recreate, renew, restore, replay pending mutations or reuse a prior identity. Any cleanup failure or lingering runtime is a vendor escalation under a separately authorized runbook, not permission to perform cleanup now. Deny restore/clone/expiry-modification rights to the executor and confirm operator/name-reuse/backup semantics with Xano. Plan eligibility, event retention/export and server-issued expiry evidence remain unresolved.

## Documentation qualifications and disagreements

1. **VERIFIED_DOCUMENTATION:** D16 excludes standard Essential RBAC/Multiple Tenants, while D01 describes ephemerals without plan conditions. **REQUIRES_VENDOR_CONFIRMATION:** whether ephemerals are a separate entitlement/exception; endpoint exposure does not override pricing.
2. **VERIFIED_INSTANCE:** retained `securitypolicy:false` coexists with D06/D07 describing some settings for all paid plans. Flag meaning/version is unresolved; neither conclusion implies outbound blocking.
3. **VERIFIED_DOCUMENTATION:** D09 says direct tenant push is unsupported; D10/D01 explicitly distinguish regular tenants from ephemerals, which accept direct push. Preserve this scope distinction. Current public docs may describe newer CLI capabilities than installed 1.3.4; only retained version/help/schema observations establish that installation's exposure.
4. **VERIFIED_DOCUMENTATION:** D05 bytes differ from P0's recorded Tenant Center hash; both receipts remain preserved. A hash difference alone is not proof of a semantic contradiction.
5. **REQUIRES_VENDOR_CONFIRMATION:** “own database” is not “own host”; general no-release defaults are not ephemeral no-secret guarantees; documented expiry is not observed deletion. All seven controls still need exact-instance acceptance evidence before Stage P.
