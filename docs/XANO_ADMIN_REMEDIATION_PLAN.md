# M1 administrator remediation and execution plan

Status: BLOCKED pending administrator actions and verified prerequisites. Target: workspace 1, Zippy Synthetic Prototype, source v1, isolated sandbox sn9m-aat6-200c. The source branch v1 is live; it is not the execution database. Direct workspace push remains disabled. No live changes, payments, agent runs, merge or deployment are in scope.

## Preserved review and evidence categories

The review bundle was independently downloaded, checked against all 228 Git blobs at commit 31fac05763a762680324d014f0b1dcb32955ea84, and applied exactly. It is preserved in review commit 9931cfba0d559661c73fc0420e602d8cfe1f5aeb, including the original ZIP, patch, delivery manifest and verification report under [review-bundles](../backend/review-bundles/m1-native-2026-10-23/).

- ZIP SHA-256: 2e62ddf2b7e3e4e1d2453422d6ec17627641f2afb0e78e67360dac90d33d05bc
- Patch SHA-256: af84176d833575e55c63c1f403205c1d9eb0f360092e0c10fea5f122415e4a03
- Original offline result: **121 passes** = 106 M1 checks + 15 mocked adapter checks.
- Original native dry-run: **eight candidates accepted in one preview request**; three function updates and five new resources. This is syntax/preview evidence, not eight hosted behavior passes.
- Hosted M1 behavior: **0 executed / 31 NOT_RUN**. Full 15-table rollback evidence is absent.
- Additional preparation: one read-only diagnostic function was previewed, imported into the confirmed sandbox, read back and executed. Its result is administrative evidence, not one of the 31 cases.
- Proposed reservation schema: one additional successful native preview; **not imported**. Do not add this preview to the original eight or label it concurrency proof.

All 109 backend export definitions, five agent drafts, eight M1 candidate source files and historical evidence remain unchanged. New evidence is separate and dated. Five follow-up offline checks also pass (126 current total). The adapter now requires physical index validity/readiness and the runner waits for every in-flight sibling before reporting a failed cohort.

## 1. Reconcile physical inventory without deleting diagnostics

### Evidence

[Native inventory evidence](../backend/evidence/milestone1-admin-inventory-2026-10-23.json) confirms:

- 51 metadata tables map to physical application tables; physical inventory contains 53.
- Metadata GETs for table IDs 56 and 57 return 404 while physical mvpw1_56 and mvpw1_57 exist.
- mvpw1_56 has **two rows**, with ordered-row MD5 fingerprint 9908b788dab4669efa147f6da0509705.
- mvpw1_57 has **zero rows**, with fingerprint d41d8cd98f00b204e9800998ecf8427e.
- [Diagnostic catalog fingerprints](../backend/evidence/milestone1-diagnostic-retention-2026-10-23.json) preserve columns, indexes, constraints and triggers. Catalog dependency inspection found their own indexes, defaults, sequences, row types and toast objects. No dependency on another application table appeared in that query.
- A search of all 109 preserved XanoScript documents found no reference to either physical name. Dynamic SQL and external clients are not ruled out by a text search.
- MD5 here is an accidental-change fingerprint, not an adversarial integrity guarantee. The evidence files themselves are SHA-256 hashed.

### Exact proposed action

Keep both tables and every row. Have the administrator/Xano support establish their metadata lineage and choose a supported retention outcome:

1. Restore/adopt the existing physical objects into metadata **without changing their physical identifiers or contents**, if Xano provides such an operation; or
2. Confirm that they are intentionally retained diagnostic objects and document how they are backed up, inspected and retained outside normal table metadata.

The public metadata API inspected here exposes table create/update/delete but no documented adoption operation for an orphan physical table. Do not guess one, recreate a same-named table, or interpret a 404 as deletion. Schema version history can inspect existing object revisions, but the documentation does not establish that it can reattach these two absent metadata objects. Use the [prepared support request](XANO_ADMIN_SUPPORT_REQUEST.md); it has not been sent.

After a supported classification is documented, replace the exact-count gate with a reviewed **complete inventory manifest**: every declared table's GUID, physical ID, columns and indexes, plus individually documented retained diagnostics and their fingerprints/dependencies. Unexpected, missing, altered or duplicate mappings must fail. A single allowed total of 53 is insufficient. If the reservation table is approved, the manifest must additionally include its actual new ID; never assume the ID or adjust the count alone.

Affected resources: mvpw1_56, mvpw1_57; inventory checks in native-adapter.cjs and runner.cjs; the M1 snapshot candidate's current 51-table guard. Those runtime guards have **not** been relaxed.

Verification: repeat metadata and physical reads, prove a complete bijection for application tables, verify the documented diagnostic retention state and fingerprints, compare before/after live source hashes, and prove unknown-table/missing-table/schema-drift fixtures are rejected offline. The diagnostic rows must remain unchanged. No DROP, truncate, reset, or delete is proposed.

## 2. Establish restricted administrative execution access

### Evidence

The supplied credential authenticates and expires on 30 October 2026 at 15:34:43 UTC, but reports workspace:datasource:live = 15 and broad administrative scopes. The adapter correctly refuses it for M1 writes. Current successful reads do not prove a restricted credential or live-denial behavior.

Xano's documentation says token scopes apply across the instance, with effective permissions also dependent on roles and tenant settings. Tokens alone should not be described as workspace-scoped. Run & Debug also needs live datasource restrictions; selecting a branch does not provide that protection.

### Exact proposed permission change — approval required

Create a **new**, seven-day M1 development credential named zippy-m1-sandbox, delivered through secure connection/environment configuration. Preserve the existing token and account permissions. Do not revoke anything or add a paid team member.

For an existing eligible development principal, configure workspace 1 explicitly in Permissions (RBAC), then re-enter/re-authenticate and generate the token. If no suitable principal or RBAC capability exists, stop for that concrete administrator decision; do not silently change the owner's role.

Proposed operation matrix:

| Capability | Proposed access |
| --- | --- |
| Workspace metadata and code export | Read; export enabled |
| Sandbox function/workflow authoring | Create, Read, Update; no Delete |
| Run & Debug / workflow execution | Enabled only with effective live-data denial verified |
| Database schema | Read for execution; temporary Create/Update only for the separately approved schema operation |
| Synthetic database content | Create, Read, Update for namespaced fixtures and approved backfill; no general deletion |
| Live Datasource | All C/R/U/D disabled |
| Live branch publication, releases/deploy, impersonation, secrets, backups/restore, RBAC administration, cluster administration | Disabled |
| Tenant Metadata API gateway | Enable only if required for the existing sandbox and demonstrably constrained by the remaining permissions |
| Other workspaces | Denied through supported RBAC where available; the fixed adapter target remains workspace 1 |

The schema operation should use an administrator's approved sandbox-only action, then remove its temporary schema grant. This is not approval for general record deletion or reservation release operations.

The original adapter treats only numeric zero as denied and rejects every nonzero tenant permission. That is intentionally conservative but not a complete model of Xano's documented tenant Metadata API gateway. Do not copy guessed numeric masks into a token or widen this gate speculatively. Capture the new effective permission response and validate the precise supported mapping before enabling writes.

Verification:

1. New-token auth/me succeeds; expiry is within seven days and the expected principal/instance is verified.
2. Read-only workspace identity, sandbox identity, source export and diagnostic functions succeed.
3. A bounded GET for known live table content returns an actual authorization denial; discard any body if unexpectedly allowed.
4. Confirm live function/data access is denied using only an existing, reviewed read-only probe. Do not create a live probe; if none is suitable, retain that verification gap for a supported administrator mechanism. A missing function/404 is not denial proof.
5. Retain HTTP status, safe error code and request identity, with secrets and records omitted. Do not perform a live write as a test.
6. Re-run preflight and server permission checks. Preserve allow_push=false. Runtime denial must agree with the scope/role review; otherwise remain blocked.

Supported mechanisms: Xano Manage Access Tokens and Permissions (RBAC), not direct edits to token payloads or PostgreSQL roles. This session has not changed permissions or issued a new token.

## 3. Enforce active vehicle/driver assignment uniqueness

### Evidence and required semantics

Two current active assignments exist, both in fixture tenant A. There are zero duplicate active vehicle groups, zero duplicate active driver groups and zero null resource keys. The idempotency composite unique index is present, valid and ready. All observed trip_assignments indexes are valid/ready, but none uniquely constrain an active vehicle or active driver.

Required invariant: for each platform, an active vehicle and an active driver can each belong to at most one assignment. Released history must remain reusable and preserved. An ordinary nonunique index does not enforce this. Unconditional unique indexes on trip_assignments(platform_id,vehicle_id) or (platform_id,driver_profile_id) would wrongly prohibit released history.

### Option A: Xano-supported partial unique indexes

Ask Xano to confirm a supported, exportable, restorable mechanism for these exact predicates:

~~~sql
CREATE UNIQUE INDEX trip_active_vehicle_idx
ON public.mvpw1_44 (platform_id, vehicle_id)
WHERE released_at IS NULL;

CREATE UNIQUE INDEX trip_active_driver_idx
ON public.mvpw1_44 (platform_id, driver_profile_id)
WHERE released_at IS NULL;
~~~

These are **design specifications, not an executable migration**. No DDL was run. XanoScript's documented index block and the inspected createUniqueIndex API expose fields/order/unique types, but no predicate field. A Direct Database Query SQL capability does not establish support for persistent out-of-band DDL or its preservation during schema export/import. Vendor confirmation must identify the supported mechanism and lifecycle before proposing this migration for approval.

### Option B: supported active-reservation table — concrete sandbox proposal

[Proposed XanoScript](../backend/milestone1/admin-preparation/proposed_active_assignment_reservations.xs) passed a native dry-run that creates exactly one table. It is not imported.

Add active_assignment_reservations with id, reservation_id, platform_id, resource_kind (vehicle/driver), resource_id, trip_assignment_id and created_at. Enforce actual database unique indexes on:

- reservation_id;
- (platform_id, resource_kind, resource_id);
- (platform_id, trip_assignment_id, resource_kind).

This is a unique constraint on an active-only relation, not an ordinary index or a query-before-insert check. Retain historical trip_assignments.

The [backfill proposal](../backend/milestone1/admin-preparation/reservation-backfill-proposal.json) contains **four exact proposed rows**, two per existing active assignment, deterministic reservation IDs and a SHA-256 fingerprint of the source rows. Re-read and compare before application; if the active set changed, regenerate and review the delta. Never release or rewrite those existing assignments.

After separate schema approval and access/inventory verification:

1. Import only the new table through the sandbox multidoc workflow with transaction=true, delete=false, truncate=false, records=false, env=false. Read back table/column/index metadata and physical index validity.
2. Backfill the four reviewed rows in one sandbox transaction, refusing mismatched source assignments or any occupied conflicting reservation. Confirm a bijection between active assignments and their vehicle/driver reservations.
3. Revise the command candidate to insert both claims inside the same transaction as the 15 existing write tables, using its pre-generated assignment ID. Keep the existing advisory lock until the new design is proven; do not rely on it as unique-index proof.
4. Map an actual reservation uniqueness conflict to RESOURCE_BUSY only after confirming rollback. Do not catch and swallow a database error inside a transaction in a way that commits partial records.
5. Every assignment writer must use the protocol. The preserved export has one detected db.add trip_assignments writer, Slice1/create_and_assign. Re-scan API/function/query definitions and direct write capabilities before acceptance.
6. Preserve all original 15-table assertions and add reservation assertions as a **16th** table: exactly two rows per successful assignment, none for losing requests, unchanged counts/content after failures and stable linkage.
7. A later release implementation must release history and remove only its owned active reservation rows atomically. Such removal is a separate data-delete permission/change and is **not authorized by the initial table/backfill approval**. No historical or diagnostic rows would be deleted.
8. Do not claim database-wide enforcement if callers can bypass reservations and write trip_assignments directly. Restrict those paths through supported permissions/API design and test denial; if that cannot be established, the reservation option remains insufficient.

### Mandatory proof before this option clears the blocker

Use distinct database sessions and a barrier with at most four competing requests on shared persisted synthetic state. Do not use separately isolated workflow fixtures as contention evidence.

- Direct competing claim attempts must demonstrate the real unique index rejects duplicate vehicle claims and duplicate driver claims, even without the command's advisory-lock serialization.
- Different vehicles with one driver produce one winner; different drivers with one vehicle produce one winner.
- Competing multi-resource acquisitions leave no half-claim, losing business row, task, outbox or audit event.
- All four injected database/application failures preserve every original table plus reservations; retry creates once, then replays stable IDs.
- Existing reservations and assignments remain unchanged.
- Prove supported release/reuse separately before claiming lifecycle completeness; no unapproved delete is part of this turn.
- Read back actual predicates/columns/indisunique/indisvalid/indisready. Query-plan speed or index presence alone is not acceptance.
- If application exceptions fail to roll back, report FAIL and stop dependent execution. Xano's transaction documentation specifically limits its general rollback guarantee to database operations; do not re-label database faults as application-failure proof.

The initial schema approval would cover one new table and its indexes plus four backfill rows in sn9m-aat6-200c. It would not approve a live schema change, diagnostic cleanup, permission escalation, release deletes or a claim that concurrency is already proven.

## Ordered hosted execution after verified prerequisites

The [31-case execution plan](../backend/milestone1/admin-preparation/hosted-execution-plan.json) preserves every existing case ID, lists fixture conditions, asset allocation and the required assertions. It is preparation, not an execution report.

1. Obtain all three prerequisite proofs above; record target/source/permission/index/inventory hashes. No readiness flags are caller-supplied overrides.
2. Verify the existing 109 source definitions and any explicitly reviewed preparation resources; investigate drift.
3. If reservation integration changes any of the eight M1 candidates, preserve the original candidates/archive, create a separately hashed revision and run a new native preview. The old eight-pass preview applies only to the original bytes.
4. Preview the exact reviewed candidate set with no schema/data/env deletion or truncation. Import into the confirmed sandbox only after prerequisites and any schema approval pass. Read back all affected definitions, preserve replacement GUIDs, and reconcile server formatting explicitly rather than assuming raw hashes survive formatting.
5. Provision additive namespaced negative fixtures. Do not change existing users, memberships, documents, vehicles, drivers or occupied assets. Stop on missing fixture prerequisites.
6. Execute 19 rejection cases, two positive cases, three races, changed-payload and expiry cases, four full rollback cases, and discarded-result replay. Record raw native status/error plus independently inspected before/after data.
7. For expiry, change only the newly created run-owned idempotency record after capturing its created result; verify no new rows and unavailable-original behavior. For discarded-result, discard only the client response and inspect/replay; do not label it a network/process crash test.
8. On transport uncertainty, await all in-flight requests and inspect state before deciding whether to retry. Never automatically replay an ambiguous write.
9. Run the evidence evaluator, update each case with its exact outcome and scope, compare live source hashes and preserved diagnostics/fixtures, then update the audit and PR. Global staging and the 194 deferred controls remain blocked unless their own evidence exists.

One case needs explicit coverage qualification: customer_profiles declares UNIQUE(platform_id,account_id), so a duplicate-profile fixture may be rejected by the database before resolve_identity runs. Preserve that constraint. Record any native fixture-insertion rejection as database-layer protection, not execution of the ambiguous-profile guard. A mocked query or temporarily dropped unique index cannot substitute for hosted behavior proof.

## Approval/action ledger

| Item | State |
| --- | --- |
| Preserve bundle/patch/adapter/evidence on review branch and update PR | Authorized; bundle committed |
| Read-only sandbox diagnostic preparation | Authorized; imported/read back/executed |
| Retain both diagnostics and gather evidence | Done; supported metadata reconciliation still required |
| Change permissions / issue restricted credential | Proposed; specific administrator approval/action required |
| Add reservation table/indexes and four backfill rows | Proposed; native preview accepted; schema approval required |
| Raw partial-index DDL | Not proposed for execution without confirmed Xano support |
| Delete diagnostics / reset sandbox / ordinary-index substitution | Not proposed |
| Import M1 candidates / run 31 cases | Authorized conditionally; prerequisites remain unverified |
| Live changes, payments, agents, merge, deployment | Excluded |

## Primary documentation inspected

- [Sandbox workflow](https://docs.xano.com/xano-cli/sandbox): isolated database, partial push/preview and destructive reset behavior.
- [XanoScript database indexes](https://docs.xano.com/xanoscript/db) and [unique-index API](https://docs.xano.com/xano-features/metadata-api/instance_api/create_a_unique_index_on_table_fields_to_enforce_data_uniqueness_and_improve_query_performance): composite unique fields are supported; no partial predicate is documented in the inspected contracts.
- [Token scopes](https://docs.xano.com/xano-features/metadata-api/token-scopes-reference), [Metadata API permissions](https://docs.xano.com/xano-features/metadata-api) and [RBAC permission reference](https://docs.xano.com/enterprise/enterprise-features/rbac-role-based-access-control): token/role/tenant layers, live datasource controls and Run & Debug.
- [Database transactions](https://docs.xano.com/the-function-stack/functions/database-requests/database-transaction): the documented distinction between database and other errors.
- [Direct Database Query](https://docs.xano.com/the-function-stack/functions/database-requests/direct-database-query): supported read mechanism and physical table naming.
- [Schema versioning](https://docs.xano.com/the-database/database-performance-and-maintenance/schema-versioning): revision inspection; it does not document adoption of absent metadata objects.

Public documentation was retrieved on 23 October 2026. Where support is not established, this plan states the gap rather than inferring a supported operation.
