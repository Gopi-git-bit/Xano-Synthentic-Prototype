# Xano Stage P capability request — PRIVATE OWNER REVIEW DRAFT

**Status: REQUIRES_VENDOR_CONFIRMATION. PREPARED / NOT SENT.** Owner review and routing decision pending. Do not publish this targeted support draft with the public tracker handoff.

## Check existing correspondence first

The retained 24 October workspace-1 inventory/permissions request was acknowledged; its receipt has no ticket ID and says `response_received:false`. The 27 October workspace-1 guard-preview diagnostic package is unrelated to these platform guarantees. No relevant reply was found in reviewed local material; the owner's current inbox and vendor ticket system were unavailable. Please check for newer responses and append to an appropriate existing thread rather than submitting a duplicate. Do not attach raw private receipts or credentials.

---

**Subject: essential2 / workspace 3 — confirm safe ephemeral isolation and tenant-only permissions before provisioning**

Hello Xano Support,

We are evaluating an isolated, synthetic-only test environment. No provisioning or subscription change is authorized. Target:

- Instance: `xynd-fnea-khtp.n7e.xano.io`, ID **9940**.
- Workspace **3**, **Zippy Synthetic Prototype_1**, source branch **v1**, parent datasource **live**.
- Retained Metadata observation (30 October 2026): package **essential2**; CLI **1.3.4**. Tenant inventories were empty. We have not tested entitlement by creating a tenant.
- Desired environment: an empty ephemeral tenant lasting **four hours**, with a dedicated test identity valid for **at most one hour**, no parent/unrelated-resource access, no real provider effects and independently verifiable cleanup.

Please answer each item for this exact instance/package and provide official documentation, required SKU/add-on, and the supported safe proof mechanism. We require **pre-creation feasibility confirmation**, followed by separately authorized returned-tenant evidence; a generic feature description or successful listing is insufficient.

1. **P1-01 — Entitlement/cost:** May this exact instance create a four-hour workspace-3 ephemeral tenant? Pricing currently says Essential has CLI sandboxes but no Permissions Center or Multiple Tenants; Pro has RBAC but also no Multiple Tenants. Are ephemerals a separate exception? Specify allocation/concurrency limits, required membership/scopes, incremental charges/overages and cleanup billing. Can entitlement be established from a supported non-secret, read-only feature endpoint or Billing view? Account Get Instance documentation does not expose these fields.

2. **P1-02 — Tenant-only identity (critical):** Provide the exact supported role/scope/tenant-override configuration that allows approved operations only in the returned tenant while denying parent live records; parent code/schema/env writes; all unrelated workspaces/tenants; unrestricted impersonation/session issuance; production deploy/review/bypass; secrets/connector/kubeconfig access; and self-renewal or permission escalation. Metadata scopes span workspaces: how is the resource-specific deny enforced? Does Live Data Source denial also prevent necessary synthetic access to the tenant's own live datasource? Tenant Center docs say disabling its RBAC permission does not prevent toggling overrides: what separately prevents that bypass? Explain role-change caching/reauthentication and ≤1-hour expiry/revocation. Supply a read-only effective-policy evaluation or vendor attestation procedure covering URL/header/CLI aliases without parent-record reads or attempted parent mutations. Which exact entitlement is required if Essential cannot do this?

3. **P1-03 — Physical DB proof:** What supported metadata endpoint, vendor attestation or allowlisted catalog identity-only query identifies the actual parent database and returned tenant database, qualified by cluster/storage identity, and proves they differ? What permission boundary prevents the test principal from reaching the parent or other databases? Clarify shared DB server versus separate DB/storage/compute for ephemeral tenants. Table counts, datasource labels and tenant URLs are insufficient. The direct connector is documented instance-wide; we cannot use unrestricted connector access or publish a live helper to obtain proof.

4. **P1-04 — Bootstrap/no-copy:** For the exact ephemeral create implementation, confirm whether parent records, secrets/env values, auth keys, files/cache/queues, integrations, releases, agents, tasks or triggers are copied or executed. General Tenant Center's no-default-release statement is not enough to establish ephemeral behavior. Can a guaranteed empty/no-secret/no-execution state be enforced atomically at creation, before any runtime starts? Provide a supported independent empty-state/secret-presence inspection that reveals no secret values and occurs before source import. Explain which guarantees are contractual before creation and which require later observation.

5. **P1-05 — External effects:** Identify a supported, enforced deny-by-default outbound boundary with independent allow/deny/attempt counters for APIs, lambdas, background tasks, triggers, autonomous agents/tools and microservices. It must block Razorpay payments/refunds, Telnyx email/SMS, WhatsApp and Zoho CRM writes; all production provider credentials must be absent. Specify tenant/instance/network scope, DNS/direct-IP/IPv6/proxy bypass coverage, task/agent/trigger disablement at startup and import, monitor ownership and counter retention. Ingress rules, static IP, source omission and empty outboxes do not establish egress denial. Can Essential provide this? If not, which supported separate-instance or Remote/self-hosted arrangement can, without changing production integrations?

6. **P1-06 — Native application tokens:** Existing application-token TTL is **86,400s**; Metadata-token TTL is independent. Native auth is documented as **JWE**. Are auth keys and user/table resolution tenant-bound? Can a tenant token be accepted by parent live/another tenant, including colliding user IDs or `X-Tenant` routing? What is rejected at expiry/destruction, and after restore/name reuse? Provide an authentication-only/no-real-record proof method for parent rejection plus wholly synthetic cross-tenant tests. Can the existing TTL safely remain with proven invalidation, or is a separately reviewed isolated-only TTL ≤3,600s needed? Shorter TTL alone cannot prove cross-tenant denial. We are not changing source or minting tokens now.

7. **P1-07 — Lifecycle/recovery:** Identify server-issued creation/expiry timestamps and lifecycle audit fields/endpoints; retained schemas show `created_at` but no explicit `expires_at`. Confirm auto-expiry/deletion SLA, revocation propagation, safe read-only removal verification, audit export/retention and behavior during in-flight requests. The executor expires after one hour while the tenant lasts four: specify a separately scoped read-only observer/vendor receipt rather than executor renewal. How can renewal, restore, clone and identifier reuse be denied? What fail-closed process applies if expiry interrupts tests or teardown is delayed? Identify plan restrictions.

If any mandatory protection is unavailable on this package, please state it explicitly and distinguish **Pro RBAC**, **Tenant Center/add-on or Custom entitlement**, and **separately isolated instance/infrastructure**. Recommend the least-privileged supported design satisfying all seven requirements, with a quote only for the features actually needed. We will review feasibility before considering any purchase, credentials, provisioning or tests.

Please do not provision, change roles/plans, mint credentials, inspect customer records, execute queries or modify our instance in response to this request without separate owner authorization. A written capability answer and safe verification procedure are the requested deliverables.

Thank you.

---

## References for owner/support review

Official pages revalidated 2026-10-30:

- https://docs.xano.com/xano-cli/ephemeral.md
- https://docs.xano.com/team-collaboration/role-based-access-control-rbac
- https://docs.xano.com/xano-features/metadata-api
- https://docs.xano.com/xano-features/metadata-api/token-scopes-reference
- https://docs.xano.com/enterprise/enterprise-features/tenant-center
- https://docs.xano.com/xano-features/instance-settings/direct-database-connector.md
- https://docs.xano.com/xano-features/instance-settings/static-ip-outgoing.md
- https://www.xano.com/pricing/

Local provenance/hashes are in the private investigation directory. This draft contains the necessary target identifiers but no credentials, customer records, raw permission maps, machine paths or private source payloads. Owner review has not yet occurred.
