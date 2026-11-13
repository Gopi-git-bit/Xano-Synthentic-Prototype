# Stage P1 platform decision — 30 October 2026

## Decision

**BLOCKED_PENDING_XANO_CONFIRMATION.** Classification: **BLOCKED**. The current `essential2` instance has not demonstrated all mandatory Stage P safeguards. Do not request provisioning approval yet. Standard Essential Permissions Center RBAC is explicitly excluded by current pricing; whether short-lived ephemerals have a supported alternative entitlement and tenant-only authorization mechanism requires Xano confirmation. No upgrade is assumed necessary or sufficient.

Evidence milestone: **`W3-P1-PLATFORM`**, predecessor **`W3-P0`**. Accepted private P0 commit: `55d4dd278602c5a81706db70d91b53ca363f4d9c`; parent `61d1b139d27646187f7d4a52bcc6546e11b70a4c`. Canonical public tracker head `af298f4b0cc10a2b42a88f9adb76c54751477b06` is user-supplied and was not retrievable here. This decision is a new unsealed continuation, not a replacement for historical approval/source records.

## Preserved baseline and investigation scope

**VERIFIED_INSTANCE, inherited P0:** workspace 3 / v1; 15 historical discovery GETs; 84 published/84 draft definitions, 41 differences; 59/59 source integrity; 25/25 offline preparation passes; two preserved pre-hardening negative counterexamples. Source manifest: `23f6d3bd00c267f481e62bb31506935eda92f4888e909cc6ce16056ef0e20997`. Existing 11 business-source failures and separate finance-authority/atomic-version findings are unchanged. Historical tests were not replayed; seals and the original private history are preserved.

**VERIFIED_DOCUMENTATION:** 18 official public pages were captured on 2026-10-30 with URL/time/byte hashes. The investigation made zero authenticated Xano requests, application requests, credential operations, SQL calls, provider calls or Xano mutations. P0's 15 GETs are historical, not additional P1 traffic. Hosted acceptance remains **0 requests / 0 passes**. Native adapter and independent observer remain absent.

The [capability matrix](XANO_STAGE_P_CAPABILITY_MATRIX.md) contains each determination, exact missing guarantee, safe proof requirement and owner/vendor dependency. The [support draft](XANO_STAGE_P_SUPPORT_REQUEST.md) is private, pending owner review, and **not sent**. [Source catalog](../backend/m1-platform-capability-20261030/SOURCE_CATALOG.md) supplies the full official URLs/timestamps/hashes.

## Options A–E

| Option | Evidence-qualified status and boundary | Principal residual risks | Setup / migration and cost | Stage P / later A/B suitability and approvals |
|---|---|---|---|---|
| **A — Essential ephemeral** | **REQUIRES_VENDOR_CONFIRMATION**. D01 documents own DB/config, 1–24h expiry; retained CLI/schema expose creation. D16 Essential Multiple Tenants/RBAC exclusions are unresolved for ephemerals. Same parent instance/control plane. | Tenant-only permissions, no-copy bootstrap, authoritative DB IDs, egress/engine controls and application-token separation unproved. | No setup performed. Need exact entitlement, allocation and quote; ephemeral incremental cost unknown. | **BLOCKED** until all seven safeguards have a supported proof method; then separate owner approval for provisioning, credentials and proof, followed by separately approved A/B execution. |
| **B — supported Essential alternative** | **VERIFIED_DOCUMENTATION** for personal sandbox (D09/D16). **UNSUPPORTED** as a drop-in equivalent: it persists until reset/deleted, lacks the documented ephemeral auto-expiry, and `get` can auto-create. Standard regular Multiple Tenants excluded on Essential (D16); account-specific exception **REQUIRES_VENDOR_CONFIRMATION**. Branches/datasources are not independent physical DB proof. | Shared instance membership, promotion paths, no tenant-only deny proof, manual lifecycle; no complete egress/JWE solution. | Sandbox included in public Essential offer; exact account scope/additional charges unverified. A regular tenant workflow involves releases; no production-release authority can be given to the test executor. | Existing workspace-1 sandbox is not repurposed. **BLOCKED** for Stage P/A/B; any alternative must satisfy equivalent controls and separately approved lifecycle design. |
| **C — separately isolated Xano instance** | **SUPPORTED_BUT_UNPROVEN**. D16 documents paid dedicated infrastructure and Custom self-hosting; D04 scopes tokens to the instance. A test-only membership with no parent membership removes dependence on within-parent workspace filtering. | Physical placement, credential/key separation, no production integrations, outbound enforcement and cleanup still need proof; shared account/admin privileges must not leak to executor. A new instance alone does not imply a firewall or token invalidation. | Create empty, transfer only separately reviewed source without records/secrets; no parent backup/clone. New URLs/identity, cost quote, adapter/observer and timed teardown required. Separate-instance recurring charge/usage is not quoted. | Preferred fallback **for vendor feasibility evaluation**, especially if a supported independent outbound boundary is available. **BLOCKED** pending proof design, purchase/setup approval and separate runtime approval. |
| **D — upgrade/add-on** | **VERIFIED_DOCUMENTATION**: Pro adds Permissions Center; D16 Multiple Tenants remains Custom-only. D05 documents Tenant Center overrides and Dedicated/Remote infrastructure. Exact add-on SKU/availability **REQUIRES_VENDOR_CONFIRMATION**. | Pro alone does not establish tenant entitlement, override immutability, egress, empty bootstrap, DB identity or JWE semantics. Ingress security/Static IP does not solve outbound denial. | Potential role/tenant migration and operational effects; D05 tenant type cannot be changed in place, and D17 Static IP can migrate instance/change URL. No change authorized. Custom/add-on quotes unknown. | **BLOCKED** until a written feature/proof delta resolves named gaps. Separate owner purchase/change authorization, followed by Stage P approval only after feasibility. |
| **E — remain blocked; offline work** | **SUPPORTED_BUT_UNPROVEN** for future implementation; current read-only/offline investigation is authorized and completed. No hosted boundary claimed. | No runtime isolation or business acceptance achieved; existing failures remain open. | Owner reviews support request; prepare proof contracts/observer design and review source changes separately when authorized. No platform purchase in this task. | **Recommended current action.** `W3-P`, A/B, C and RELEASE stay unadvanced. No unchanged historical test reruns. |

### Verified public pricing, not an account quote

**VERIFIED_DOCUMENTATION — D16, accessed 2026-10-30:** Essential advertises **$99/month monthly** or **$85/month billed annually**; Pro **$249/month monthly** or **$224/month billed annually**; Custom is contact-sales pricing. These are advertised dollar amounts, not verified charges for this existing `essential2` account, taxes, prorations, ephemeral usage, tenant allocations or a separate-instance configuration. No purchase or price-driven option selection is made.

## Recommendation and feasibility exit criteria

**BLOCKED:** choose E operationally now. Have the owner review and route the support questions after checking existing threads. Ask Xano first whether A can satisfy every control under the current entitlement. If no, evaluate C with a test-only principal and vendor-supported independently observed outbound boundary, alongside the exact D feature delta; choose the least-privileged **fully demonstrable** option. Standard sandbox/branch separation and a bare Pro upgrade are insufficient substitutions.

**REQUIRES_VENDOR_CONFIRMATION:** no complete hosted implementation option is currently verified. A documented candidate architecture is identified, not approved as safe to execute. The next feasibility decision needs:

1. Account-specific entitlement/allocation/cost and the exact least-privilege identity configuration.
2. Supported non-mutating proof of parent/unrelated-resource denial and prevention of self-escalation/override toggling.
3. Vendor-approved qualified physical DB identity comparison, with the required infrastructure isolation level explicitly stated.
4. Exact ephemeral no-record/no-secret/no-execution bootstrap semantics and independent pre-import inspection.
5. Atomic provider/engine denial plus independent attempt counters; all real payment/CRM/messaging routes covered.
6. Tenant authentication/key/identity/expiry semantics and safe no-record proof method; decide TTL strategy only afterward.
7. Server-issued expiry evidence, observer lifetime design, revocation/cleanup evidence and fail-closed recovery.

Written vendor confirmation can resolve design feasibility; actual returned-tenant runtime receipts can only follow a separate, narrowly scoped Stage P approval. Neither documentation nor a structural validator substitutes for those receipts.

## Support and canonical synchronization

**VERIFIED_INSTANCE (retained local support evidence only):** the 24 October workspace-1 inventory request was acknowledged, has no retained ticket ID and records no reply; the 27 October guard-preview package is a different workspace-1 diagnostic. Neither answers P1. **REQUIRES_VENDOR_CONFIRMATION:** owner's current inbox/ticket state is inaccessible; do not infer no external reply exists. The new request is prepared, not submitted.

**BLOCKED:** canonical `AGENTS.md`, `SOUL.md`, `DECISION.md`, tracker, evidence and validator were unavailable locally; the commit-pinned GitHub API read failed with `Transport error`. No replacements were invented. Prepare only reviewed, sanitized proposed changes to DECISION/tracker/evidence and the two public-safe reports; keep the support draft, raw instance receipts and private source evidence private.

Intended new record: `W3-P1-PLATFORM`, predecessor `W3-P0`, investigation scope completed read-only, feasibility `BLOCKED_PENDING_XANO_CONFIRMATION`, approval `NOT_REQUIRED_READ_ONLY`, provisioning approval absent. Canonical verification-enum syntax must be checked against the actual validator before applying. Preserve the existing P0 record and `W3-P` predecessor; do not silently rewire the execution chain. Link P1 as an additional prerequisite/decision reference using the existing schema. Do not advance `W3-P: NOT_RUN / NOT_APPROVED`, `W3-AB: NOT_RUN`, `W3-C: NOT_RUN`, or `W3-RELEASE: NOT_RUN`.

Required canonical command remains **NOT RUN — files unavailable**: `node --test scripts/validate-evidence-chain.cjs`. New local document/hash/preservation checks are recorded separately and do not establish a canonical structural pass. No public push or PR merge occurred.

## Exact next owner decision

**Review the private support draft, confirm whether an existing vendor thread already covers these questions, and authorize routing the capability questions to Xano.** Ask Xano to confirm the current Essential path or specify a fully supportable separate-instance/add-on alternative and safe proof procedures. This is not a request to create resources, issue credentials, change plans or execute Stage P.
