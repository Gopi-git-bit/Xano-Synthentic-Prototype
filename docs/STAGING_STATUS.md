## Approved reservation preparation — 23 October 2026

The [separately hashed reservation revision](XANO_RESERVATION_REVISION.md) passed native preview for eight candidates plus the proposed table. All 161 current M1 offline checks pass (121 original, five prior follow-up, 35 new); these are separate from native behavior. Original sources and historical evidence are preserved. Both diagnostic tables and existing assignments remain unchanged.

**0/31 hosted M1 cases executed.** The new credential could not be issued through available tools, supported inventory reconciliation has not been supplied, and writer-bypass/concurrency proof remains unverified. The approved schema and four-row backfill were not applied. The revised snapshot intentionally refuses execution pending supported inventory reconciliation; the adapter/runner gates were not relaxed. No release/reuse support is claimed.

## Administrator remediation follow-up — 23 October 2026

The verified review bundle is preserved on the review branch at 9931cfba0d559661c73fc0420e602d8cfe1f5aeb. All 228 base Git blobs, ten bundled file hashes, the original patch hash and published ZIP bytes were checked. [Bundle verification](../backend/review-bundles/m1-native-2026-10-23/verification.json) separates **121 offline passes**, **eight native dry-run candidate acceptances**, and **31 hosted cases NOT_RUN**.

Authorized sandbox preparation added only Milestone1/admin_inventory_probe. It was previewed, imported, read back and executed as a SELECT-only diagnostic; all original 109 documents and live source hashes remained unchanged. The two unmapped tables contain two rows and zero rows respectively and were preserved. Two existing active assignments have no duplicate vehicle/driver groups. Their current indexes do not enforce active vehicle/driver uniqueness.

The [administrator remediation plan](XANO_ADMIN_REMEDIATION_PLAN.md) specifies supported inventory reconciliation, a restricted credential and two uniqueness design paths. A proposed active_assignment_reservations table passed a separate preview, with four exact backfill rows prepared. Neither schema nor backfill was applied. No permission was changed. An [unsent support request](XANO_ADMIN_SUPPORT_REQUEST.md) covers the undocumented metadata-adoption/partial-index mechanisms.

The adapter now recognizes the reviewed diagnostic only through its pinned native source hash; its inventory, access and candidate-import gates remain closed. Five additional offline checks cover source recognition/drift rejection, physical index validity and settling concurrent requests after a failure. The current total is 126 passes (107 M1 + 19 adapter); the original 121-pass record remains separate. The original bundle and historical reports are retained verbatim.

Current evidence is in the [follow-up audit](../backend/evidence/milestone1-admin-remediation-audit-2026-10-23.json). The [31-case execution plan](../backend/milestone1/admin-preparation/hosted-execution-plan.json) is explicit preparation, not a completed full-suite executor. Schema choice, restricted access and supported inventory reconciliation remain prerequisites to the revised candidate import and hosted run. Native preview and diagnostic execution are never counted as M1 behavior passes.

No diagnostic deletion, reset, live change, payment execution, agent run, merge or deployment occurred. All lifecycle, payment and idempotency decisions remain unchanged.

## Fresh native preview and authenticated preflight — 23 October 2026

Direct authenticated access now succeeds. This supersedes the authentication blocker in the historical sections below. The working source snapshot is pinned to review commit 31fac05763a762680324d014f0b1dcb32955ea84; all 228 source blobs were verified. All 109 preserved backend definitions match the fresh sandbox export after LF normalization and trimming.

Xano's native sandbox dry-run accepted all eight M1 candidates with HTTP 200: exactly three function updates, one new function and four new workflow tests. The preview contains no table changes, deletions, truncations, unresolved placeholders or reported exceptions. This establishes native preview acceptance only; it is not a runtime pass or an import. [Preview evidence](../backend/evidence/milestone1-native-preview-2026-10-23.json) includes unchanged before/after hashes for both live and sandbox source.

The new [native adapter](../backend/milestone1/native-adapter.cjs) and read-only CLI derive preflight facts from authenticated native reads. A real run completed with exit 2 / ready: false. [Native preflight evidence](../backend/evidence/milestone1-native-preflight-2026-10-23.json) records:

| Check | Fresh result |
| --- | --- |
| Authentication and workspace | PASS: workspace 1, Zippy Synthetic Prototype, branch v1 |
| Sandbox identity | PASS: database sn9m-aat6-200c |
| Source preservation | PASS: live and sandbox exports unchanged |
| Inventory | BLOCKED: 51 metadata mappings plus two unmapped physical tables, mvpw1_56 and mvpw1_57 |
| Scoped physical indexes | Idempotency unique index observed; active-vehicle and active-driver partial unique definitions absent |
| Restricted access | BLOCKED: live-data scope 15; authenticated expiry verified, but restricted access/live denial not established |
| Candidate import/readback | NOT_IMPORTED; all eight source candidates remain unchanged |
| Hosted M1 cases / rollback evidence | 31 NOT_RUN; no new behavioral or rollback claims |

The adapter supports the existing bounded race interface, enforces the fixed target and request limits, and refuses invocations without passing fresh preflight. Its 15 mocked transport/preflight checks pass; all 106 existing M1 offline checks still pass. It does not implement negative-fixture provisioning or a complete 31-case executor. See [adapter instructions and limits](../backend/milestone1/README.md) and [verification report](../backend/evidence/milestone1-native-review-validation-2026-10-23.json).

Next dependencies remain supported inventory reconciliation, restricted development access with live-denial evidence, reviewed physical-index remediation, and then preview/import/readback of the eight candidates. No raw cleanup, bootstrap, live publication, repository push, provider action or hosted behavior case ran. All 109 backend definitions, five agent drafts, candidate source files and historical evidence remain preserved. Global staging remains blocked.

## Historical reports (superseded where contradicted by the fresh results above)

> Latest hosted attempt: from `1ca3b4ea6860e4ad310de29fb1f3a9e9704928e8`. **BLOCKED: direct Xano authentication required.** Direct MCP initialization/tool discovery succeed, but workspace and documentation reads return **Unauthorized - Authentication Required**. Prior Composio reads returned **Invalid token**. Dependent isolation, inventory/index inspection, native import and hosted execution were stopped.

## Latest hosted attempt

The local checkout was clean at `1ca3b4e`; the remote review branch matched. All 227 tracked file hashes matched that revision before this attempt. No repository instruction or frontend files were added by unrelated work.

The existing default Composio connection `custom_ccat_goat-ens` is reported ACTIVE, but both `CUSTOM_CCAT_LIST_WORKSPACES` and `CUSTOM_CCAT_DOCUMENTATION` with `type=start` returned `MCP tool error: Invalid token.` Tool log: `log_h98Xu2kF3mX0`. This is a failed authenticated read, not a successful workspace/permission check; no HTTP status was supplied by the tool. Current workspace identity, isolation, physical tables/indexes and restricted access remain unverified.

Following the user's direct-connection instruction, called the supplied metadata MCP endpoint without Composio. After enabling sandbox network access, `initialize` identified **Xano Metadata API 1.0.0** and `tools/list` exposed 243 schemas (HTTP 200). Both `listWorkspaces` and `documentation` (`type=start`) returned HTTP 200 with **`isError: true` / `Unauthorized - Authentication Required`**. Initialization and public schema discovery are reachability evidence only. No authenticated direct read succeeded. The first default-sandbox request was denied locally with `Operation not permitted`; that was not a Xano response.

Independent verification completed: all 106 M1 offline checks and existing validators pass; Python fixtures pass 37 + 13; four retained bounded claims re-evaluate successfully. The staging gate exits 1 as expected. Exact stdout, exit codes, failed reads and preservation counts are in [hosted-attempt evidence](../backend/evidence/milestone1-hosted-attempt-2026-10-23.json).

| Outcome | Status |
| --- | --- |
| Workspace listing / documentation reads | Direct: 2 MCP authentication denials, HTTP 200 / isError true. Prior Composio: 2 Invalid token errors |
| AC-01–03: identity/isolation, 53-vs-51 reconciliation, restricted access/indexes | BLOCKED |
| AC-04–08 / 31 reviewed hosted slice cases | NOT_RUN; dependent execution stopped |
| AC-09–10 | PARTIAL_SOURCE_ONLY; no fresh native pass |
| 70 operational agent cases | NOT_RUN; unchanged |
| Native syntax validation/import | NOT_RUN; supported documentation and target verification unavailable |

**Only requested prerequisite:** complete the Xano CLI login in the environment that opened the supplied localhost callback link, then resume this task in that authenticated Codex environment or expose its existing authenticated direct Xano MCP connection to this session. The callback `http://127.0.0.1:57514` returns to that machine's CLI process; login completion is unverified here. `codex mcp list --json` returns `[]` in this cloud environment, and the linked desktop is offline. The endpoint URL alone carries no authentication. No Composio reconnection is required. Keep credentials out of chat and GitHub. Target: `https://xynd-fnea-khtp.n7e.xano.io/x2/mcp/meta/mcp/stream`. Authenticate workspace/documentation reads and establish AC-01–03 before dependent execution.

The backend export, five agent drafts, historical evidence and unresolved policies remain preserved. No hosted write, payment, agent run, publication, migration, merge or deployment occurred.

## Previous offline continuation

## M1 executable work and current acceptance

The remote review branch matched `6bcb139` at the start. The local folder was an incomplete non-Git mirror: 190 tracked files matched, 20 historical files were absent and two ignored reports were extra. Restored the absent files from that exact revision and reconstructed its exact Git commit/tree as a complete clean 210-file shallow checkout. No repository instruction files or frontend files exist in that revision. All 109 current backend export documents, all five agent drafts and historical native test reports remain byte-identical.

Prepared eight [review candidates](../backend/milestone1/manifest.json) separately from `backend/xano/`: profile-ambiguity rejection, application faults after order/assignment, a complete 15-table inspection helper with independent driver selection, a read-only snapshot and four native rollback workflows. Replacement candidates preserve original GUIDs. Native grammar validation, import and execution are **NOT_RUN**. The new [race orchestrator](../backend/milestone1/runner.cjs) supplies no network adapter or credentials; it refuses missing target/source/index/access proofs and occupied fixtures before commands. Existing lifecycle, payment authority and idempotency policies are unchanged.

Exact local outcomes are retained in [M1 offline evidence](../backend/evidence/milestone1-offline-2026-10-23.json):

- `node scripts/test-milestone1.cjs`: **106 passed, 0 failed**, covering actual source-expression fragments, all-table residue rejection, stable IDs, independent-driver evidence, fault provenance, preflight refusal and bounded adapter concurrency. These are offline tests, not a Xano transaction emulator.
- Existing backend/domain/export/package, safeguard and HTTP-checker validators: exit **0**. Python schema checks: **37 + 13 passed**, exit **0**.
- `node scripts/evaluate-milestone1.cjs`: exit **0**, all **31 hosted slice cases NOT_RUN**, `ready: false`. The evaluator is an evidence inventory, not a readiness gate.
- `node scripts/evaluate-historical-slice1.cjs`: exit **0**; four retained bounded claims re-evaluated successfully, but insufficient for the stricter M1 criteria. No native rerun.
- `node scripts/staging-gate.cjs`: expected exit **1**, blocked. `git diff --check`: exit **0**.

| Acceptance criterion | Current result | Remaining evidence |
| --- | --- | --- |
| M1-AC-01: fresh authenticated identity/isolation/source | BLOCKED | Successful authenticated Xano reads and current source hashes. |
| M1-AC-02: physical inventory reconciliation | BLOCKED | Resolve last observed 53 versus 51 through supported administration; no raw cleanup or whitelist. |
| M1-AC-03: restricted access/shared fixtures | BLOCKED | Scope, physical indexes, isolation and unused assets verified; native adapter wired afterward. |
| M1-AC-04: identity/tenant/eligibility rejection | NOT_RUN in Xano | Offline guards pass; provision and execute native negative fixtures without modifying existing evidence. |
| M1-AC-05: complete persisted success | NOT_RUN in Xano | Execute strict 15-table counts, linkage, version 4 and stable 202/result IDs. |
| M1-AC-06: replay/conflict/expiry | NOT_RUN in Xano | Actual same-key race, valid changed-payload 409, no residue, expired original unavailable. |
| M1-AC-07: vehicle and independent-driver contention | NOT_RUN in Xano | Shared-state cohort evidence, distinct vehicles for one driver, one winner and no losing rows. |
| M1-AC-08: four full rollback/retry cases | NOT_RUN in Xano | Import/validate candidate workflows and prove both fault types at both locations across all 15 tables. |
| M1-AC-09: all scoped controls accounted for | PARTIAL, source only | All 72 explicitly deferred in manifest; native enforcement remains unverified. All 194 controls stay blocked. |
| M1-AC-10: preservation and verification | PARTIAL, source only | Repository preservation/offline checks pass; fresh native before/after hashes and hosted results unavailable. |

**Historical blocker at the previous continuation (superseded by the direct-connection prerequisite above):** refresh the permitted Xano Metadata API development credential through Xano's supported access/token administration, then update/reconnect the existing Composio `custom_ccat` connection `custom_ccat_goat-ens` in secure connection settings. It targets `https://xynd-fnea-khtp.n7e.xano.io/x2/mcp/meta/mcp/stream`. Keep credentials out of chat, files and PR text. The connection tool has no existing-account credential-edit operation; no credential was extracted or deleted. Resume with an authenticated workspace listing, confirm workspace 1 / Zippy Synthetic Prototype / source v1 and separate sandbox `sn9m-aat6-200c`, then re-read code, reconcile inventory and verify restricted access/indexes before native execution.

All 70 operational agent cases remain unrun. The separate 31 M1 hosted cases also remain unrun. No merge, publication, migration, deployment, provider/payment call or model/agent execution occurred.

## Earlier audit record

## Execution tracker — 23 October 2026

The [machine-readable audit](../backend/evidence/backend-audit-2026-10-23.json) inventories all 51 declared tables, all 194 mapped integrity controls, all 12 exported endpoints, 14 missing API capabilities, 22 functions, five business-agent drafts and every one of the 70 unexecuted agent scenarios. It records source hashes, CI runs, evidence limits, policy conflicts, dependencies and exact M1 acceptance criteria. The [machine staging tracker](../backend/evidence/staging-readiness.json) remains `ready: false`.

Fresh local validation passes: 49 shared and 49 exported domain cases, 84 coordinate regressions against both implementations, 49 operational tables/476 fields, export/package/safeguard checks, mocked HTTP-checker tests, and 37 schema plus 13 preparation fixtures. The staging gate exits 1 intentionally. No fresh native execution, application JWT acceptance or operational agent test is claimed. Source CI at `bacde769` passed; its HTTP job was skipped. The successful manual metadata connection run [39734248339](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/actions/runs/39734248339) tested the older `618d4b3` revision only.

Reconciled findings:

- The latest export has 109 documents, 22 functions, 58 embedded unit-test definitions and eight workflow tests. Older 104-document, 20-function and 50-test counts describe earlier snapshots. Definitions are not executed results.
- Last retained physical inventory is 53 against 51 declared tables, with retired diagnostic names `mvpw1_56` and `mvpw1_57`. Current existence, mapping and cleanup are unverified. A metadata 404 does not prove deletion. No cleanup, reset or count whitelist was performed.
- The 194 controls comprise 80 foreign keys, 78 unique constraints, 30 checks, three partial unique indexes, two partial claim indexes and one composite primary key. All retain blocked status and null per-control executable tests. Matching native unique-index declarations exist for 79 controls; their physical enforcement remains unverified.
- Later Metadata API races supersede the blanket shared-state concurrency blocker: one winner plus three busy responses, and one creation plus three replays, are retained bounded internal proof. Separate workflow fixture isolation remains observed. Disposable application-throw rollback passed; full 15-table application-failure rollback and actual process/network recovery remain unverified.
- `resolve_identity` selects the first customer profile without rejecting ambiguity. Magic-link redemption lacks an evident atomic single-use guard. Public JWT role/tenant/owner tests and restricted administrative access remain absent. The fixture command requires both customer and admin membership; this is not a general customer booking API.
- Existing seven-state rules, approved payment arithmetic and tenant/operation/key contract remain in place. Slice1 additionally embeds the actor in its operation scope; the proposed agent package adds actor/command/entity scope and 17 states/23 edges. These differences remain open decisions. No new lifecycle, payment timing, custody, credit, tariff or idempotency policy was adopted.
- All five agents remain configured/unbound drafts according to retained export evidence. All 70 operational scenarios are NOT_RUN. Offline schemas and prompts do not enforce role permissions, tenant isolation, budgets or a kill switch. The 72 legacy PostgreSQL reference cases are a separate inventory, not an automatic Xano gate.

### Next executable milestone: M1 — complete the existing internal synthetic booking-to-assignment proof

Reuse `Slice1/create_and_assign`: trusted synthetic identity -> create -> eligibility -> assign -> audit/task/outbox. Keep the existing two fixture tenants, dual-role restriction, `test-m3-v1` pricing and fixed pending/quoted/confirmed/assigned progression. No public fixture endpoint, model run or provider side effect is part of M1. This scoped proof does not clear the global staging gates.

| Task | Owner | Dependencies | Status / exact deliverable |
| --- | --- | --- | --- |
| CX-01 | Codex | None | Complete: pinned audit, source hash verification, offline execution, machine report and tracker update. |
| XN-01 | Xano-native / account owner | None | BLOCKED: complete the CLI login in its originating environment and expose authenticated direct Xano access here or resume there; successfully list workspaces and verify workspace 1, source v1/live distinction and separate sandbox identity before any write. |
| XN-02 | Xano-native / support | XN-01 | BLOCKED: map 51 declarations to physical tables and resolve the two diagnostics through supported administration, preserving definitions/dependencies/evidence. No raw DROP/reset or cleanup by this audit. |
| XN-03 | Xano-native administrator | XN-01 | BLOCKED: supported expiring development scope and durable isolated shared execution target; retain safe sandbox-allow/live-denial proof. |
| CX-02 | Codex | XN-01 | Compare fresh code-only export with all 109 pinned documents; report drift and retain before hashes. |
| CX-03 | Codex | CX-02, XN-02, XN-03 | Prepare minimal profile-ambiguity rejection and focused sandbox assertions; preserve GUIDs and existing policies. |
| CX-04 | Codex | CX-03 | Extend bounded runner/fixtures: independent-driver race, replay/conflict/expiry, identity/tenant negatives and multi-table database/application-fault provenance; cap concurrency at four. |
| XN-04 | Xano-native execution | CX-04 | Preview/import only reviewed sandbox changes; read back, run named cases on shared synthetic state and retain results plus unchanged live-source hash. Do not run migration/bootstrap helpers. |
| CX-05 | Codex | XN-04 | Independently assess M1-AC-01 through M1-AC-10 and update per-control evidence; keep global staging blocked. |
| OWNER-POLICY | Gopi / business owners | None | Open: lifecycle DEC-01/07, payment DEC-03/04/05/12, public idempotency scope/canonicalization/expiry. Does not change the existing fixture contract. |
| M2-HTTP | Codex + Xano-native | CX-05, OWNER-POLICY, XN-03 | Later: exact public booking/workflow schemas and real JWT role/tenant/owner acceptance on a supported isolated hostname. |

M1 passes only with all ten criteria in the audit report supported by actual native evidence. Required persisted success is `202` with stable order/trip/workflow IDs, assigned order version 4, one quote, two stops, one requirement, two participants, one commitment, one offer/trip/assignment, three transitions, four events, one audit/task/outbox/idempotency row. Same-key races give one creation and three replays; changed payload gives 409 without residue. Separate vehicle and driver-only contention each permit one active assignment. Identity/eligibility/tenant negatives and both fault types leave no new rows across all 15 affected tables; retry creates once then replays. Every one of the 72 mapped controls on those write tables has a test or explicit scoped deferral. Before/after live hashes match and existing fixtures/evidence remain preserved. These 72 scoped control records are distinct from the 72 legacy PostgreSQL cases.

No Xano object, record, configuration, payment, agent binding or live branch was changed by this audit. No merge or deployment occurred. Current Xano confirmation remains blocked until an authenticated read succeeds.

## Retained staging history

The following sections preserve earlier reports. The dated tracker above and the machine audit qualify any conflicting blanket statement below.

# Staging implementation status

Staging is BLOCKED at the database-guarantee gate. No dependent public booking, dispatch or payment implementation is accepted, and no production activation is authorized.

Fresh exports were compared to review commit 953f7ca98c00b41122d96747441447bcfc7abd36. The sandbox contained newer authentication fixes, Slice1 prototypes and workflow tests; these are preserved in backend/xano. The live export was captured separately and was not edited. Baseline hashes are in backend/evidence/export-baseline.json.

The independent payment predicate now enforces partial advances from 50% through 100% inclusive, using exact integer arithmetic. Eight new cases cover overpayment, upper boundary, odd-cent rounding and large amounts. Local predicate checks cannot establish payment-provider correctness.

## Required guarantees

Every deferred SQL control has a per-control record in backend/contracts/database-controls.json. Missing executable tests are explicitly null and blocking, not passes. Relationships, uniqueness, cross-field rules, tenant isolation, immutable evidence and protected state changes all require enforcement through supported Xano mechanisms. Existing prototype SQL/advisory locking is not proof of support or concurrency safety.

- Shared-state concurrent HTTP execution unavailable: sandbox and isolated ephemeral tenant ingress=false.
- Atomic conditional updates, duplicate exclusion, vehicle/driver exclusivity and worker claims unproven.
- Non-database failure rollback not demonstrated.
- Deferred schema controls lack demonstrated enforcement and executable integration tests.
- Booking HTTP API, provider payment/webhook handling and durable workers incomplete.
- Recovery, restoration, end-to-end journeys and alerts not demonstrated.

## Reproduction and next action

1. Inspect sandbox metadata: ingress is false. A separately created two-hour ephemeral tenant also has ingress false and no domain. CLI 1.3.4 ephemeral edit only supports display/description changes.
2. Existing shared-context keeper/observer workflow tests use isolated fixtures; observer sees zero rows while keeper holds fixtures. Thus they cannot establish competing requests on shared persisted state. See preserved Slice1 report and workflow source.
3. Provide a supported isolated Xano test environment with authenticated HTTP ingress and shared persisted synthetic fixtures. Verify database identity and two-tenant separation before writes. Do not enable live branch access as a workaround.
4. Run database and non-database failure cases separately; prove rollback, compare-and-set, unique booking/assignment and fenced worker claims. Record actual statuses and residue queries.
5. Only after all required controls pass, complete booking, dispatch/payment/workers, then API/concurrency/failure/recovery acceptance.

## Evidence limits

Historical SQL division-by-zero rollback tests and discarded-response replay are retained, not relabeled as fresh HTTP or network-failure tests. No provider credentials were used. Backup restoration, deployment rollback and production capacity are not demonstrated. The manual staging workflow is a fail-closed readiness gate until executable integration tests exist. It cannot be used as a staging acceptance pass.

## Validation completed on 22 October

All 16 payment unit tests passed in Xano after sandbox-only import. The final 104-document export is pinned by backend/evidence/tested-export.json SHA-256 entries. Offline checks pass all 49 shared and 49 exported cases plus 49 tables/476 mapped fields. The 194 deferred controls remain blocked. No production or live-branch promotion occurred.

The workflow names the synthetic-staging GitHub environment but does not configure environment protection rules. Before enabling any network suite, an administrator must configure required reviewers, restricted branches and environment-scoped provider test credentials; pass credentials only to the validated test runner, never pull-request code. Currently the gate accepts no credentials, makes no network calls and always exits unsuccessfully because the critical suite is absent.

Official platform references: [database transactions](https://docs.xano.com/the-function-stack/functions/database-requests/database-transaction) and [direct database queries](https://docs.xano.com/the-function-stack/functions/database-requests/direct-database-query). The transaction documentation limits rollback to database failures; direct queries require explicit data-source targeting. Neither proves concurrent safety in this workspace.

## Subsequent Xano-native safeguards and proofs

See [XANO_NATIVE_CONTINUATION.md](XANO_NATIVE_CONTINUATION.md). The earlier shared-state function-run blocker was partly caused by incorrect response parsing and is superseded by fresh authenticated Metadata API persistence/concurrency evidence. Public application HTTP acceptance and the remaining integrity gates stay blocked.
