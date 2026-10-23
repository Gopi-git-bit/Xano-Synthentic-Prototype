# M1 execution preparation v3

This revision implements the fixture and execution adapter for every ID in the existing 31-case catalog. It is committed preparation, not native validation or hosted acceptance. Activation is PENDING; no v3 helper has been previewed, imported or run. The original 121 offline passes and eight native dry-run acceptances remain historical, separate evidence. Reservation-v2's separate preview does not validate this revision.

The Xano support request was submitted through the public support form on 24 October 2026 IST. The form acknowledged receipt and stated a 2–3-business-day response window; it showed no ticket number. [Submission receipt](../backend/evidence/xano-support-submission-2026-10-24.json). Supported inventory treatment is still pending.

## Fixed fixtures and complete executor

[fixtures.json](../backend/milestone1/execution-v3/fixtures.json) allocates one immutable run namespace, m1x-20261024-prep01. It covers 31 cases plus two proof cohorts. Each seed creates its own auth user, account/membership/profile and provider assets within one native database transaction. Changed-payload and expired-key deliberately reuse positive-a. All other cohorts use disjoint assets. Seed helpers accept only a catalog case ID, not caller-provided rows, IDs, SQL or table names. Existing assignments and fixtures are not modified or released.

Ten fixture tables are allowlisted: user, accounts, customer_profiles, vendor_profiles, driver_profiles, vehicle_models, vehicles, vehicle_documents, driver_associations and account_role_memberships. Fixture readback checks every specified field. Duplicate-profile setup is expected to encounter the existing unique(platform_id,account_id) constraint. The executor verifies setup rollback and reports BLOCKED_FIXTURE, not an identity-guard pass. It does not remove the constraint or fabricate an impossible profile.

The executor implements all 19 rejection cases, both positive cases and stable replays, same-key/vehicle/driver races, changed-payload conflict, owned-key expiry, four database/application fault cases, and discarded-result recovery. It waits for every in-flight request before handling failures, never automatically retries a write, and stops further writes after unexpected failures. Every completed stage is written to a new, private evidence file.

Snapshots cover all 16 business tables and all ten fixture tables, with full-table counts, content hashes and per-row identity/digests. A separate native count detects truncated reads. Comparisons detect same-count changes, deletions and mutations of retained records. Fault cases compare all 16 business tables and fixture hashes, then require a successful retry and stable replay. The only update helper changes expires_at on the exact run-owned positive-a idempotency row after verifying ownership and succeeded/unexpired state. The expired-command comparison starts after this deliberate update. Discarded-result means the client drops a successful transport result; no network/process-crash claim is made.

## Separately reviewed reservation contention path

M1Execution/contention_command is separately hashed. It derives from reservation-v2's full command, removes the advisory-lock call, retains both reservation inserts in the same transaction as all business writes, adds two-second pre-claim and post-claim holds, and emits PID/timing markers. It does not add SQL functions, triggers or schema. The ordinary 31-case race path still tests its advisory-lock behavior; those passes cannot satisfy reservation uniqueness proof.

Two cohorts use four contenders each:

- Same vehicle, four different drivers and four different keys.
- Same driver, four different vehicles and four different keys.

The evaluator requires one created transaction, three native uniqueness failures naming the actual valid/ready reservation index, four distinct transaction PIDs, overlapping pre-claim entries, and database-observed lock waits tying every losing PID to the winning PID. A separate read-only observer uses pg_stat_activity and pg_blocking_pids; it returns no SQL text. At most four writers and one observer are in flight, with at most 24 bounded observation samples per cohort. Missing permissions, logs, waits, timing or index names fail the proof; ordinary RESOURCE_BUSY responses do not pass.

Full-table delta/preservation and losing-key inspection must prove that losing transactions leave no business rows or half-reservations. This is particularly necessary when a same-driver loser acquires its distinct vehicle claim before failing its driver claim. The adapter only accepts its own immutable native receipts, not a caller's ready/pass boolean.

The offline review checked transaction boundaries, preservation of the two inserts and subsequent business writes, absence of advisory locking on this path, failure propagation outside the transaction, bounded observation, and rejection of missing/forged proof. Native behavior remains unproven. Native log/error serialization and monitor visibility must be validated against this exact revision; insufficient observation is a failure, not permission to relax the test.

Supported language/API basis: Xano documents [database operations](https://docs.xano.com/xanoscript/function-reference/database-operations) and [debug logging / try-catch](https://docs.xano.com/xanoscript/function-reference/utility-functions). PostgreSQL documents [pg_blocking_pids](https://www.postgresql.org/docs/current/functions-info.html) and [pg_stat_activity](https://www.postgresql.org/docs/current/monitoring-stats.html). Their documentation does not establish this Xano principal's effective privileges; those require actual verification.

## Activation evidence and remaining gates

The committed activation record is false/PENDING. The CLI defaults to an offline gate check:

    node scripts/run-m1-execution.cjs --check

After prerequisites are independently verified and pinned, the explicit execution entry point is:

    node scripts/run-m1-execution.cjs --execute NEW_PRIVATE_EVIDENCE_FILE

It takes the restricted token only from XANO_SANDBOX_METADATA_TOKEN; it does not read the exposed owner token or print credentials. The adapter has no import, arbitrary SQL, direct CRUD, deployment or deletion API.

Activation requires separately hashed VERIFIED artifacts for:

1. Access: named seven-day credential, a new token ID, exact native-scope hash and independently interpreted effective denials for live data, deployment, release, secrets, RBAC, impersonation, backup/restore, cluster administration and delete. Keep existing token/account untouched. Current auth/me must match; a fresh live read must return authorization denial (403). A 401, 404, timeout or empty response cannot pass.
2. Inventory: Xano support reference and decision hash, all metadata IDs/names/GUIDs, exact physical table list, retained diagnostic fingerprints and dependencies. The gate reconciles identities, not just a count. Neither diagnostic is removed or silently whitelisted.
3. Writer enforcement: the actual supported enforcement mechanism and negative bypass-probe evidence, no unprotected assignment path for the execution principal. Adapter allowlists and static source review alone are insufficient. A necessary account/role change needs separate approval.
4. Exact import/readback: this revision's native validation, reviewed sandbox export hash, unchanged live export hash, unchanged approved schema and fresh backfill source hash. Changes introduced by native formatting must be reviewed and bound to the actual export.

Fresh preflight verifies token identity/scopes/expiry, live-read denial, workspace and database identity, complete reviewed source hashes, inventory, diagnostic preservation, and actual catalog uniqueness/validity/readiness/non-null keys. It issues a short internal execution lease. The full suite cannot start until both contention cohorts pass.

The approved table and four-row backfill are unchanged and need no duplicate schema approval after the existing conditions pass. Immediately re-read source assignments before applying the backfill; changed rows require review. No schema/backfill or imported writer restriction is claimed in this revision.

The administration UI is still inaccessible through the local Windows browser helper. A secure sign-in setup for the available TinyFish profile is pending the user's login response; the profile has no recorded Xano sign-in. This is an authentication prerequisite, not another credential/schema approval.

## Evidence boundaries

The new tests are offline models and fail-closed checks. The full simulated executor reaches all 31 cases, qualifying duplicate-profile coverage separately, and records zero hosted passes. Current M1 offline checks total 184: the original 121, five prior follow-up, 35 reservation-v2, and 23 execution-v3 checks. Native preview counts remain unchanged. Hosted M1 execution remains 0/31, and native reservation contention remains NOT_RUN.

Reservation creation does not implement release/reuse or the complete assignment lifecycle. Existing policies, 109 backend exports, five agent drafts, the original bundle/patch and prior evidence are preserved. No live changes, deletion, release, payment execution, Xano agent runs, merge or deployment occurred.
