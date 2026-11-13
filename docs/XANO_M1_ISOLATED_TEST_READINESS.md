# M1 isolated test readiness — 30 October 2026

**BLOCKED — Stage P has no owner approval. Read-only P0 discovery and local acceptance preparation are complete to the extent available. No tenant, restricted credential or physical database identity has been established. Hosted acceptance: 0 requests, 0 passes.**

This is a new **unsealed continuation**, based on private commit `61d1b139d27646187f7d4a52bcc6546e11b70a4c` and preserved ancestor `ea543e9c4679006479144fc6412597b074dd5505`. Fresh receipts are in [`backend/m1-isolated-readiness-20261030`](../backend/m1-isolated-readiness-20261030/). Historical evidence and its seals were not regenerated. All eleven requested implementation files were inspected before execution.

Status vocabulary: **VERIFIED** = observed within the named scope; **FAILED** = an executed assertion failed; **BLOCKED** = a missing prerequisite; **NOT RUN** = no execution; **NOT IMPLEMENTED** = implementation absent. Documentation, source checks and offline tests are not hosted acceptance.

## 1. Verified target and access

| Item | Observation / status |
|---|---|
| Repository / local worktree | `Gopi-git-bit/Xano-Synthentic-Prototype`; `C:\Users\ashok\Documents\GitHub\zippy-backend-m1-review` |
| Git branch / HEAD | **VERIFIED** `codex/xano-m1-reconciliation-20261029` / `61d1b139d27646187f7d4a52bcc6546e11b70a4c`; ancestor check exit 0 |
| Instance | **VERIFIED** `https://xynd-fnea-khtp.n7e.xano.io`, ID **9940** |
| Workspace | **VERIFIED** **3**, **Zippy Synthetic Prototype_1** |
| Source branch | **VERIFIED** `v1`, `live:true`; only returned branch |
| Parent data source | **VERIFIED metadata only** label `live`; no physical database ID in this response |
| Tenant / ephemeral inventory | **VERIFIED** both empty, `nextPage:null`; CLI also returns `items:[]` |
| Actual isolated tenant ID / database ID | **BLOCKED**, neither exists in available evidence; no invented ID |
| Parent physical database ID | **BLOCKED**, not supplied by metadata discovery; no record or SQL probe |
| Authenticated principal | **VERIFIED** Metadata principal **178782**, instance membership role **admin** |
| Credential expiry / scope | **VERIFIED** expiry `never`; `workspace:datasource:live=15`, `workspace:database=15`, `workspace:content=15`, `workspace:api=15`, `workspace:function=15`, `workspace:settings=15`, `tenant_center=15`, `tenant_center:rbac=16`, `tenant_center:impersonate=16`, `tenant_center:impersonate:edit=16`, `release=15` |
| Effective permission qualification | Numeric role/scope maps are retained verbatim in `discovery.json`; they are broad, not a restricted test identity. No permission bit mapping or write authorization was experimentally inferred. Membership workspace array is empty and overrides are null; this is not tenant-only access proof. |
| Installed CLI | **VERIFIED** `@xano/cli/1.3.4`, Windows x64, Node `v24.22.1` |
| Explicit profile | **VERIFIED** profile **named `default`**, selected explicitly with `-p default -w 3 -c <existing-private-credentials.yaml>`. Its in-memory origin/workspace were checked; the repository's workspace-1 `profile.yaml` was not used. |
| CLI authentication | **VERIFIED** scoped `ephemeral list` exit 0; direct Metadata identity GET HTTP 200 |
| MCP | **BLOCKED** for Xano operation in this session: no Xano MCP tool is exposed; resource discovery returned zero resources/templates. This does not establish whether an external MCP service is configured elsewhere. |
| Actual package | **VERIFIED** server reports `package.name="essential2"`; package/instance feature arrays empty; additional RBAC and tenant allocations 0; `direct_query_access:true`, database connector allocation 1, `securitypolicy:false`, BYOC disabled |

The extra identity projections were limited to plan, feature and permission metadata. Names/emails, authentication tokens, environment values and customer records were not retained. `direct_query_access:true` is a capability flag, not authorization to run SQL or proof of a restricted connection.

## 2. Essential capability and isolation matrix

**Conclusion: this Essential instance cannot currently be verified as supporting the full requested restriction set.** Ephemeral inventory access and product support are verified. Creation entitlement and tenant-exclusive permission enforcement are not. Official [workspace RBAC documentation](https://docs.xano.com/team-collaboration/role-based-access-control-rbac.md) lists granular RBAC for **Pro and Enterprise/Custom**, not Essential. The returned admin permission map does not establish that the Essential plan enables custom RBAC overrides. Obtain owner/Xano confirmation of an enforceable configuration on this exact instance before provisioning; a plan change would require separate owner authorization.

| Required control | Status | Evidence / remaining proof |
|---|---|---|
| One ephemeral tenant, four-hour expiry | **VERIFIED** syntax/documentation; creation **NOT RUN** | CLI create accepts integer `--expires-hours` 1–24, default 1. Metadata create schema exposes `display,description,expires_hours,tag`. No creation entitlement test was performed. |
| Native database isolation | **BLOCKED** | [Ephemeral documentation](https://docs.xano.com/xano-cli/ephemeral.md) promises a separate database. Need supported parent and returned-tenant physical identity receipts, not labels/counts. |
| Empty initial DB; no copied secrets | **BLOCKED** | General Tenant Center documentation says new tenants do not deploy a release automatically. Ephemeral creation has no explicit record/secret-copy denial switches. Need platform confirmation of actual ephemeral bootstrap semantics **before creation**, followed by isolated empty-state/secret-presence proof before import. No secret-value export. |
| Dedicated identity; credential lifetime ≤1 hour | **BLOCKED** actual issuance; **VERIFIED** documented capability | [Metadata documentation](https://docs.xano.com/xano-features/metadata-api.md) supports expiry from one hour to never. Owner must issue a new tenant-restricted identity/token and record issue/expiry times; existing admin token is unsuitable. |
| Parent live records denied | **BLOCKED** | [Token scopes](https://docs.xano.com/xano-features/metadata-api/token-scopes-reference) apply across the instance's workspaces. Live-data scope restriction exists, but allowing the isolated tenant's own database while denying parent `live` is not demonstrated. Use supported effective-permission evidence; no parent-record probe is authorized. |
| Parent code/schema/env writes denied | **BLOCKED** | Need tenant-specific enforcement. A profile and workspace argument are selectors, not access boundaries. No live write probe. |
| Cross-tenant access / unrestricted impersonation denied | **BLOCKED** | Tenant RBAC override is documented; no actual tenant or restricted identity exists. GET impersonation mints a session and was not invoked. |
| Application JWT isolation and invalidation | **BLOCKED** | Fresh published login source still uses **86,400 seconds**. Metadata expiry does not affect it. Need platform proof of tenant-bound signing/authorization and invalidation on destruction, without querying parent user records. |
| Providers, payment, SMS, email, WhatsApp, CRM blocked | **BLOCKED** runtime | Source allowlist excludes outbound implementations and secrets. Independent egress enforcement and attempted-call observation are still required; an empty outbox is insufficient. |
| Autonomous agents/tasks/triggers disabled | **VERIFIED** bounded source/inventory; isolated enforcement **BLOCKED** | Fresh task, table-trigger and agent-trigger lists empty. Parent source still has its documentation example agent/tool/MCP. None are in the 59-definition package. Tenant `tasks` setting is exposed by GET/PUT schema; no setting changed. Parent task infrastructure being enabled is not evidence of isolated disablement. |
| Expiry/cleanup/recovery | **VERIFIED** documented lifecycle; actual expiry **NOT RUN** | Ephemeral expiry destroys tenant infrastructure/data; edit does not extend lifetime. Record actual server timestamps, verify disappearance after expiry, revoke dedicated credential at completion/expiry. No renewal, delete/reset/restore or replacement tenant without separate approval. |
| Exact native observer / application routes | **NOT IMPLEMENTED** | No returned tenant URL or tenant-bound observer credentials. Captured spec offers tenant multidoc and run endpoints, but no verified direct tenant table-content/catalog observer. No impersonation workaround or guessed `X-Tenant` routing is accepted. |

Application testing must remain blocked until application-token isolation/invalidation is demonstrated. Required correction: a separately approved, isolated-only ≤3,600-second application-token change with a reviewed delta/new manifest, **plus** tenant-token isolation proof; alternatively, separate explicit owner acceptance of the existing 86,400-second lifetime with verified destruction/isolation semantics. Neither option is approved. The original 59-definition package remains unchanged and retains its original hash.

## 3. Published/draft drift and source package

**VERIFIED:** fresh code-only exports used `branch=v1&env=false&records=false`, then `include_draft=false` and `true`. Both contain **84 definitions**: 33 tables, 23 queries, 19 functions, three API groups, and one each addon/agent/MCP/middleware/tool/workspace. Their normalized digests exactly match the reconciliation baseline; **41 definitions differ between published and draft**. No repeated behavioral source audit was needed.

| Inventory | SHA-256 |
|---|---|
| Published normalized inventory | `7b06e6a779037407224fb357d2cfb1133d251f1ce0104d717ff0b74b6312c374` |
| Draft normalized inventory | `535399c4c635b3ba2eec841e885fd7e09a73a4cc550798eb9061b91b543d85e5` |
| Reviewed source manifest, exact bytes | `23f6d3bd00c267f481e62bb31506935eda92f4888e909cc6ce16056ef0e20997` |

**VERIFIED:** the existing private package at `C:\Users\ashok\AppData\Local\Temp\opencode\zippy-m1-isolated-source-20261029` matches that manifest; all **59/59** file hashes and GUIDs match both the manifest and original private files. Exactly those files plus `source-manifest.json` exist. No package rebuilding, source import or PR #4 candidate use occurred.

Allowlist: **33 tables + two API groups + three logging/security functions + nine published auth/read/disabled queries + 12 fail-closed refusal candidates**. Unsafe booking/OTP/finance drafts, operational agents, tools, tasks, triggers, actual records, secrets and provider configurations are excluded. Published mutation routes remain the original empty stubs; the local refusals are not deployed.

### Preview/import preparation

**VERIFIED CLI form**, currently **BLOCKED** pending Stage P and prerequisites:

```powershell
xano ephemeral create "zippy-w3-m1-ab-20261030t120849z" -p <owner-approved-provisioning-profile> -w 3 --expires-hours 4
xano ephemeral push <actual-returned-tenant-name> -p <approved-restricted-profile> -w 3 -d <verified-private-source-directory> --dry-run --no-guids
```

`zippy-w3-m1-ab-20261030t120849z` is the proposed **display name**, never the tenant identifier. Record the actual server-returned name, URL and expiry. Source branch `v1` describes package provenance: the installed ephemeral push uses `supportsBranches:false`. Its URLs are `/api:meta/workspace/3/tenant/<returned-name>/multidoc/dry-run` and `/multidoc`.

Additional implementation findings that must govern future execution:

- Preview is an approval-gated POST. CLI 1.3.4 internally sends `delete=true` **to the preview endpoint only** to enumerate remote-only objects even without `--delete`; actual import defaults are `delete=false,truncate=false,env=false,records=false,transaction=true`. Review the complete returned operation set and reject any destructive/foreign change. No `--delete` import is allowed.
- Nonverbose preview hides operation details/reasons. `--verbose` logs fragments of the bearer credential, so it must not be used. A reviewed sanitized response capture is required for the complete diff; CLI summary/exit 0 alone cannot approve import.
- Partial mode is the default; inspect all 59 identities and references. Check source/profile workspace remains 3 because the CLI also derives `source_workspace_id` from the profile.
- Default GUID writeback can modify local source. Preserve the private original package; `--no-guids` prevents writeback. Any server GUID remapping must be captured and reconciled explicitly, never resolved with PR #4's GUID-free copies.
- Import requires exact target proof and successful prerequisite/preview review. No fallback to workspace push, no forced preview bypass, record/env copy, destructive flags, release or production publish. Noninteractive CLI import cannot be treated as approved merely by adding `--force`.

## 4. Fixture and native adapter readiness

**BLOCKED — Stage F approval is absent; fixture creation NOT RUN.** Existing proposal is retained:

- Two active synthetic customer organizations, aliases **A/B**.
- Seven synthetic users: A, B, suspendable A, membership-revocable A, restricted driver A, operator, pending-verification A. Six memberships, excluding operator.
- Five bookings: A has two draft/one booked; B one draft/one booked. Two cargo rows and two holds, split across organizations. All other business tables initially empty.
- Use run prefix `20261030t120849z` only if this approved run proceeds; emails under `.invalid`, random private passwords, explicitly fictitious location text. No production contacts or onboarding bypass.
- A private fixture registry must bind every server-assigned ID to the returned tenant, physical DB, run, owner approval and created/expiry times, plus approved cleanup/control fields. No IDs or credentials have been assigned.
- Stage F seeding and Stage A/B controls are distinct approvals. Six possible controls are suspend/restore user, revoke/restore membership, deactivate/restore organization A. Restore is allowed only after verified state differences; no blind recovery following ambiguity.

**NOT IMPLEMENTED:** tenant-bound native adapter and independent observer. Reuse the existing engine/interface in [XANO_ACCEPTANCE_EXECUTION.md](XANO_ACCEPTANCE_EXECUTION.md), with these release prerequisites:

1. Discover exact tenant application/metadata/observer URLs and bind them to independently verified physical identity. No parent fallback, redirects, arbitrary URL dispatch or module-load I/O.
2. Reauthenticate the restricted identity after owner permission setup; independently validate actual permissions, issue/expiry times and approval references. Proof strings/JSON booleans alone are not proof.
3. Observer must read all isolated rows of all 33 tables, producing stable count/content/per-row digests and physical DB/run IDs. Independent provider-attempt/agent counters must detect direct calls, not just outbox writes. Observation must not mutate the monitored database.
4. Capture actual status codes, sanitized response shapes, executed assertions, per-request before/after digests and audit events, including failed/ambiguous requests. The current engine's minimal result records alone do not supply the complete native evidence trail.
5. Test tenant misrouting, expiry during execution, redirects, response limits, observer failure, same-count changes, source drift and redaction before any hosted acceptance. Review and pin adapter/observer hashes. No test may claim success from an echoed preflight or constant observer.

Prepared acceptance scope: authoritative login/me/logging; wrong/absent/pending/suspended denial; membership/organization invalidation; A/B list/detail/filter/pagination and foreign/missing equivalence; driver/operator denial; fail-closed malformed projections; **12 × 4 caller modes × 3 variants = 144 mutation-refusal requests**, with independent pre/post snapshots and non-success assertions.

Retain the reviewed ceiling of **220 tested application requests**, **six prerequisite logins**, **six fixture-control calls**, no automatic retries of ambiguous writes, immediate stop on unexpected effects. Native preflight/observer/audit traffic needs its own owner-approved numerical budget after its transport is known. The engine does not establish a request-rate/observer budget by itself. Full role-change, expired-JWT and additional invalid-pagination/browser-selector coverage remain NOT RUN; existing malformed-provider mocks are offline evidence only.

## 5. Local preparation changes and executed checks

Two new **offline FAILED** counterexamples were preserved in `acceptance-preparation.json`: the original gate accepted a credential with two hours remaining and an arbitrary manifest hash. These are new runner-readiness findings, separate from the eleven historical business-source failures.

Local corrections to the existing engine/template now require:

- Three distinct owner approval references, `approval_refs.P`, `.F`, `.AB`; the committed template remains `NOT_APPROVED` with null references.
- Observed `tenant_created_at` and `credential_issued_at`; full lifetimes at most four hours and one hour respectively, rather than just time remaining when the runner starts. Future timestamps are rejected, and credential expiry cannot outlive the tenant.
- The exact reviewed 59-definition manifest hash. A separately approved TTL/source delta needs a separately reviewed pin change, not a blanket arbitrary-hash exception.

**VERIFIED offline: 25/25 existing-plus-new preparation tests passed**, including nine new lifetime/source/stage-gate regressions. Tests use only the existing transport-neutral engine. No native adapter was loaded and no approved readiness file was created. These checks validate local rejection logic, not owner authority, platform expiry or permission enforcement.

| Actual check | Result | Receipt |
|---|---|---|
| Direct GET-only Metadata/spec discovery | **VERIFIED** 14 HTTP 200 responses: 12 initial + two plan/feature follow-ups; no record/env/run routes | `discovery.json`, `instance-capabilities.json`, `instance-plan-features.json` |
| Authenticated CLI ephemeral inventory | **VERIFIED** exit 0, `items:[]`; underlying numeric HTTP status was not logged by CLI | `cli-checks.json` |
| CLI version/create help/push help | **VERIFIED** three local commands, exit 0 | `cli-checks.json` |
| Published/draft drift | **VERIFIED** both normalized inventories unchanged | `published-inventory.json`, `draft-inventory.json`, `published-draft-diff.json` |
| Existing private allowlist integrity | **VERIFIED** 59/59, exact manifest hash, no extras | `source-integrity.json` |
| Existing plan and unapproved-template gate | **VERIFIED** 144-request plan; `APPROVAL_REQUIRED` before any adapter access | `acceptance-preparation.json` |
| Original gate counterexamples | **FAILED** two offline assertions before correction; retained | `acceptance-preparation.json` |
| Hardened preparation suite | **VERIFIED** 25/25 offline, exit 0; hosted passes 0 | `acceptance-hardening-tests.json` |
| Public capability documentation | **VERIFIED** five HTTP 200 hash receipts; supports documentation claims only | `documentation-receipts.json` |
| Git history/config preservation | **VERIFIED** original HEAD/ancestor; initial tracked diff empty; credential/profile bytes unchanged during CLI checks | `git-preservation.json`, `cli-checks.json` |

Total scoped discovery traffic: **15 Xano GETs** including the public Metadata specification and CLI list. **Zero** Xano writes, preview/import calls, credential minting, application requests, record reads, environment-value reads or operational executions. Public documentation fetches/resource discovery are separate. No historical acceptance totals were incremented.

### Executed commands

From the backend review worktree (private argument paths are existing local files, never token values):

```powershell
node scripts/verify-m1-isolated-readiness.cjs --profile default --workspace 3 --branch v1 --credentials C:\Users\ashok\.xano\credentials.yaml --cli-root C:\Users\ashok\AppData\Roaming\npm\node_modules\@xano\cli --out backend\m1-isolated-readiness-20261030
node scripts/record-m1-readiness-checks.cjs default 3 C:\Users\ashok\.xano\credentials.yaml C:\Users\ashok\AppData\Roaming\npm\node_modules\@xano\cli C:\Users\ashok\AppData\Local\Temp\opencode\zippy-m1-isolated-source-20261029 C:\Users\ashok\AppData\Local\GitHubDesktop\app-3.6.9\resources\app\git\cmd\git.exe backend\m1-isolated-readiness-20261030
node backend/m1-acceptance-preparation/runner.cjs --plan
node --test --test-reporter=tap scripts/test-m1-acceptance-preparation.cjs
```

The recorder invoked installed `bin/run.js` for `xano --version`, `ephemeral create --help`, `ephemeral push --help`, and `ephemeral list -o json`; all target-bearing commands explicitly supplied `-p default -w 3 -c <existing-private-credentials.yaml>`, with `XANO_VERBOSE=false`. Supplemental capture commands used `C:\Users\ashok\AppData\Local\Temp\opencode\zippy-readiness-capabilities-20261030.cjs default 3 <credentials> <cli-root> <new-receipt>` for the two identity projections and `zippy-readiness-docs-20261030.cjs <new-receipt>` for documentation hashes. Initial capability capture omitted nested package features; the final receipt confirms they are empty. Temporary script hashes are included in the continuation hash index.

The initial recorder is a one-shot pre-hardening capture pinned to an unchanged tracked tree; do not rerun it over this receipt directory. The test command was wrapped in a local `spawnSync` recorder to save output/exit code/hashes. `git diff --check` exited 0. Version-check cache refresh is incidental CLI behavior; credentials and repository configuration remained unchanged.

### Evidence SHA-256 anchors

| New unsealed receipt | SHA-256 |
|---|---|
| `discovery.json` | `7f901b29b6fb6eded41c33057bd2048ce19c2ed6221e6ec0ae2a379427722c6c` |
| `instance-plan-features.json` | `32e58570c616f59beae9ddc161123714702d3763298beaa9cab21c2c14ce7c9a` |
| `cli-checks.json` | `653c10c2edb97c0284679c3fe3e04878dd340bfb402addc799534a5a11fd5f00` |
| `source-integrity.json` | `8138e37e8d5792aab54e3044a8091a2c9e06e1f15646cc3115488ef313e402e8` |
| `acceptance-preparation.json` (original failures) | `94d788bcf5207d744198eeaee3646d61728feaeeead0d2b2b0c8fd48041b5cc1` |
| `acceptance-hardening-tests.json` | `7fbd766188e3fb81e00ef55ffa27aad65f1f3e7250c97fa0d51ec3d29f7f513f` |

`continuation-hashes.json` indexes the remaining new receipts and current local preparation artifacts. It is an unsealed hash index, not a replacement for the historical seal. Git commits, sealed reconciliation files, original source package, frontend worktree and release configuration are preserved. Current local changes are the new report/capture artifacts plus the existing runner, unapproved template and its offline tests; no commit, history rewrite, push or merge occurred.

## 6. Blocked execution and preserved defects

**NOT RUN:** tenant creation, permission changes, credential issuance, preview/import, fixtures, application login/read/refusal tests, physical identity/constraint probes, real side-effect observations, token invalidation and expiry cleanup verification. **NOT IMPLEMENTED:** verified native adapter, independent native observer and sanitized full-preview capture. **BLOCKED:** Stage P/F/A/B and all sixteen Phase C cases.

All **eleven historical FAILED source gates** remain unchanged: untrusted 480 km fallback; cargo validation after insertion; timestamp-based reference collisions; missing create transaction; missing confirm transaction; optional idempotency; unenforced idempotency expiry; vehicle/driver uniqueness; missing worker fencing; fixed OTP; premature OTP consumption. Separate weak atomic-version enforcement and absent finance authority findings also remain open. The unchanged fresh source hashes carry these findings forward without rerunning or relabeling them. Transactional booking, dispatch, finance, POD and all five operational agents remain blocked.

## 7. Exact next owner action — conditional Stage P approval

**Next executable milestone: owner/platform prerequisite confirmation, followed by Stage P provisioning/proof only if both approval and safeguards are satisfied.** Approval alone cannot cure unsupported Essential controls.

Before the create command, provide supported evidence for (a) Essential ephemeral entitlement and empty/no-secret-copy bootstrap, and (b) a dedicated identity that can operate only on the returned tenant while parent live data and parent code/schema/env writes, other tenants and unrestricted impersonation are denied. Supply a safe read-only parent physical-identity receipt. Identify how provider egress, schedules/agents and tenant JWT isolation/invalidation will be enforced and observed. No parent-record or live-write probe is included.

Requested owner approval text:

> I approve **Stage P only**, reference **[owner-supplied reference]**, on instance **xynd-fnea-khtp.n7e.xano.io / 9940**, workspace **3**, source branch **v1**: one ephemeral tenant with display **zippy-w3-m1-ab-20261030t120849z**, lifetime **4 hours from creation**, no renewal. Bind subsequent actions exclusively to its actual server-returned tenant name and verified database identity. I authorize the specifically named provisioning profile **[profile]** and owner creation of one dedicated restricted test identity/profile **[identity/profile]**, credential lifetime **at most 1 hour from issuance and never past tenant expiry**. Allow only tenant-specific metadata/schema/code observation and the reviewed 59-definition preview/import after isolation prerequisites pass; isolated read-only physical/catalog and empty-state observation; tenant-only task/agent disablement and effective external-provider blocking. Deny parent live record access, parent code/schema/environment writes, other tenants, unrestricted impersonation, releases and production deployment. Keep credentials outside logs/Git. No fixtures or application tests are approved. Default cleanup is verified automatic tenant expiry and credential revocation; recovery/deletion/replacement requires separate approval. Stop before creation if entitlement/no-copy/restriction prerequisites are unresolved; stop before import if isolation safeguards fail.

No owner approval reference, approved provisioning/restricted profile, supported restriction configuration or returned tenant identity is presently supplied. After Stage P succeeds, obtain **separate Stage F** fixture approval, then **separate Stage A/B** execution/traffic approval after native adapter/observer review. Until then the permitted work is read-only prerequisite review and local preparation.
