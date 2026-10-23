# Reservation revision and approved sandbox limits — 23 October 2026

The owner approved a new seven-day **zippy-m1-sandbox** credential and, conditionally, the sandbox-only reservation table, its three unique indexes and the four reviewed backfill rows. Approval is recorded; it is not permission verification. Existing credentials and account/role permissions remain untouched.

**No schema or backfill was applied. No revised candidate was imported. All 31 hosted behavior cases remain NOT_RUN.** Supported inventory reconciliation and restricted access have not been verified. Writer-bypass prevention and physical contention proof also remain open.

## Work completed

- Prepared a separate [reservation-v2 revision](../backend/milestone1/reservation-v2/manifest.json) based on review commit f276295b90c5ecd1b444e4ccb312d6188eb3addd. Seven candidate files changed; the identity candidate remains byte-identical. The original eight candidates, original bundle/patch, 109 backend exports, five agent drafts and historical evidence are retained.
- Inserted vehicle and driver reservations in the command's existing transaction **before** its first business write. Both use the same pre-generated assignment ID used by trip_assignments. Reserved IDs use previously unused UUID slots 22 and 23. Unique-conflict errors propagate; no catch was added that could commit a half-claim. Friendly busy reads and the existing advisory lock remain, but neither is counted as uniqueness proof.
- Added reservation inspection with exact platform, assignment, vehicle and driver linkage; successful commands require exactly two claims. Replay assertions require the same reservation identities.
- Extended all four workflow rollback candidates from 15 to 16 tables. Their snapshots now cover every row in each affected sandbox table, ordered by id, with counts and SHA-256 hashes of the native JSON encoding. Failure comparisons and replay comparisons cover both counts and content. Existing 15-table expected deltas are unchanged.
- The revised snapshot contains an explicit refusing inventory guard. This is a **preview-only draft**, not execution-ready code. Replacing that guard requires the supported inventory decision, a concrete complete manifest, new hashes and another preview. It cannot be waived with an input flag.
- The original native adapter and runner are preserved and remain locked. They do not select or import reservation-v2. A future adapter revision must verify actual reservation table/index identity, the supported inventory manifest, effective permissions, source hashes, backfill linkage and writer restrictions before issuing a write lease.

## Separate evidence categories

| Evidence | Result |
| --- | --- |
| Original bundle offline suite | 121 passes, retained separately |
| Prior administrative follow-up | Five additional offline passes |
| Reservation revision assertions | 35 offline passes |
| Current three M1 offline suites | 107 + 19 + 35 = 161 passes |
| Original eight-candidate native preview | Retained; applies only to original bytes |
| Revised native preview | Eight candidates plus the unchanged proposed schema accepted in one request |
| Revised candidate imports / schema imports / backfill writes | 0 / 0 / 0 |
| Hosted M1 cases | 0 executed; 31 NOT_RUN |
| Native uniqueness contention / 16-table rollback proof | NOT_RUN |
| Release/reuse implementation and proof | Not implemented; not authorized |
| Agent acceptance runs | 0; historical 70 cases remain NOT_RUN |

The new tests evaluate evidence validators and candidate/hash boundaries offline. They are not Xano behavior proof. The first local revision-test run found a UUID-validator typo (32 pass / three fail); it was corrected and all 35 passed. The original suites and backend/safeguard validators also pass. The evidence evaluator reports ready=false with 31 NOT_RUN; the staging gate correctly exits 1.

[Offline evidence](../backend/evidence/milestone1-reservation-v2-offline-2026-10-23.json) and [new native preview](../backend/evidence/milestone1-reservation-v2-preview-2026-10-23.json) record exact outcomes.

## Native preview failure and correction

The first recorded revision preview returned HTTP 500 / SQL 42501 INSUFFICIENT PRIVILEGE. That request incorrectly attached X-Tenant to the sandbox-specific route. Its [failure evidence](../backend/evidence/milestone1-reservation-v2-preview-routing-failure-2026-10-23.json) is retained.

Inspection of official @xano/cli 1.3.4 showed that /api:meta/sandbox/multidoc/dry-run selects the authenticated user's sandbox and sends Bearer authorization plus the XanoScript content type, without X-Tenant. After confirming sandbox/me still reported sn9m-aat6-200c, state ok, the same payload with those documented CLI headers returned HTTP 200 and exactly nine operations: one table creation, three function updates, one function creation and four workflow-test creations. No permission change was made. Delete, truncate, records and environment import remained false; transaction and partial remained true.

This demonstrates a request-routing correction, not a newly restricted credential. Source readbacks after preview match their before hashes exactly:
- live: 216c1f6cd12c75183924e06d09da261882a9581aa9ab8e6d0017400f944084eb
- sandbox: 1ce5a11d7970b1e549212ab3bba2b1e46ec13dd1a7e0e8ba2d099395ee17c4e2

## Credential prerequisite: authorized, not created

The discovered 243-tool metadata catalog does not expose a metadata-token issuance operation. The available app-tool search did not find a matching issuance tool. The administration browser failed before starting with a Windows sandbox-helper error, so the authorized UI operation could not be performed. No role or account change was attempted.

Xano documents token generation through Instances → instance settings → Metadata API → Manage Access Tokens → New Access Token. Use the approved name, seven-day expiry and [committed operation matrix](XANO_ADMIN_REMEDIATION_PLAN.md#exact-proposed-permission-change--approval-required). Configure the new credential through a secure connection; do not put its value in a PR, repository or chat. Preserve existing credentials.

[Read-only auth refresh](../backend/evidence/milestone1-reservation-access-refresh-2026-10-23.json) confirms the existing token still has workspace:datasource:live=15. It remains ineligible for M1 writes. Numeric permission masks are not guessed or reinterpreted. New-token effective-permission review, sandbox reads and actual live-read authorization-denial tests are **NOT_RUN**. Any necessary account or role change still needs a separate, concrete approval.

Supported references:
- [Xano token creation and effective permissions](https://docs.xano.com/xano-features/metadata-api)
- [Xano token scopes](https://docs.xano.com/xano-features/metadata-api/token-scopes-reference)

Token scopes are instance-wide; naming a token “sandbox” does not confine it. Runtime proof must include safe, known live resources. A 404, a bad token or a failed login is not live-read denial proof.

## Inventory prerequisite: preserved, not reconciled

The prior physical inventory is 53 tables against 51 metadata tables. A fresh, source-pinned SELECT-only diagnostic run confirms mvpw1_56 still contains two rows with ordered-row MD5 9908b788dab4669efa147f6da0509705 and mvpw1_57 remains empty with MD5 d41d8cd98f00b204e9800998ecf8427e. Dependencies and existing assignment/index observations are retained in [preservation evidence](../backend/evidence/milestone1-reservation-preservation-2026-10-23.json).

No Xano support decision establishing metadata lineage, supported adoption or intentional retained-diagnostic treatment has been received. The prepared support request remains **unsent**. No diagnostic was deleted, reset, recreated or treated as harmless merely to permit a higher table count.

After a supported decision, prepare a complete application-table mapping plus individually justified retained diagnostics and their fingerprints. Include the new reservation table's actual ID only after its authorized creation. Reject unknown, missing or changed resources; do not replace 51 with 53 or 54.

## Backfill prerequisite: exact source unchanged

The fresh full active-assignment row hash is still:
95780bb95456e4aadc4b2331f4808fe1004d420e73de32413774c91067e862af

The two source assignments and all four proposed reservation rows match the reviewed proposal. [Fresh comparison](../backend/evidence/milestone1-reservation-backfill-refresh-2026-10-23.json) records zero rows written. Re-read again immediately before any eventual import/backfill. If the source or proposed rows change, stop for review. Neither existing assignment may be released or rewritten.

## Writer enforcement and concurrency remain unproven

A source scan of all 110 current sandbox documents finds one direct XanoScript assignment writer: Slice1/create_and_assign. The proposed replacement creates both reservations in the same transaction. The baseline Prototype/native_bootstrap also contains a direct-query DDL capability and is retained without execution. [Writer audit](../backend/evidence/milestone1-reservation-writer-audit-2026-10-23.json) records the scan boundary.

This is not proof that every write path is closed. Direct metadata content writes, function authoring/run capabilities, direct database credentials, dynamically constructed SQL and external clients require separate authorization/path review. The user's existing owner credential and account permissions intentionally remain untouched. No claim of database-wide enforcement against privileged administrators is made.

Before hosted acceptance:
1. Enumerate reachable API, function, workflow, task, trigger and tool writers after readback; pin their hashes and verify every supported assignment path uses the protocol.
2. Establish supported restrictions for the intended execution principal and exposed APIs. A direct assignment insert/update that omits reservations must be denied before mutation. If a role/account change is needed, stop and request approval for that exact change. Do not attempt an unsafe bypass write merely to discover it is allowed.
3. Confirm the three actual unique indexes, their columns and indisunique/indisvalid/indisready after the permitted schema import.
4. Use additional run-owned synthetic resources for uniqueness proofs, preserving assets reserved for the 31 cases. A vehicle-only cohort must share one vehicle and use distinct drivers; a driver-only cohort must share one driver and use distinct vehicles. Bound each cohort to four real database sessions with a start barrier.
5. Exercise a reviewed native claim path without the command advisory lock so a serialized busy query cannot masquerade as index enforcement. Capture native unique-violation evidence and transaction/session timing. This additional proof path is not yet implemented/imported; the eight-candidate preview does not cover it.
6. For the driver-only cohort, a losing transaction can have acquired its distinct vehicle claim before colliding on the driver. Independently inspect all 16 tables to prove no half-claim or losing business/audit/outbox/task rows survived. Do not swallow the native exception or label an unknown error RESOURCE_BUSY.
7. Preserve every in-flight result; on ambiguity await all siblings and inspect data before any retry. Keep successful synthetic rows; no release or cleanup deletion is authorized.
8. Execute the original 31 cases only after their prerequisites pass. All four database/application faults must compare full 16-table counts and content, then prove a single successful retry and stable replay. Application-failure rollback must be observed, not inferred from database-failure documentation.

The full 31-case native fixture/execution adapter remains unfinished and inactive. The existing bounded race adapter is not a complete 31-case executor. The new offline validators and workflow drafts do not change that status.

## Authorization ledger

| Action | Current state |
| --- | --- |
| New seven-day restricted credential, existing permissions unchanged | Approved; blocked on available secure administration UI/configuration |
| Account or role changes | Not approved; none made |
| Sandbox reservation table, three unique indexes, four exact rows | Approved only after access and inventory verification; not applied |
| Revised candidate authoring, separate hashes and preview | Done; draft remains blocked and unimported |
| 16-table rollback assertions | Prepared and checked offline; native proof absent |
| Diagnostic retention | Preserved; supported reconciliation pending |
| Native uniqueness / writer-denial / 31-case execution | Prerequisites unverified; NOT_RUN |
| Release/reuse, deletion, live changes, payment execution, agent runs, merge/deployment | Not authorized; none performed |

The next safe actions are to configure the approved credential securely and obtain the supported inventory decision. Neither action requires reapproval of the already approved schema/backfill. Any account/role change or changed backfill does require its own review.

