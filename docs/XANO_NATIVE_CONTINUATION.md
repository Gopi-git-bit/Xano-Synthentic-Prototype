# Xano-native development safeguards and proof results

Xano remains the implementation and database platform. Gopi-git-bit/Xano-Synthentic-Prototype is the current repository. The owner name git-bit-gopi could not be resolved. New-logistic- is used only as a pinned historical contract/test reference, not as a second deployed backend or external database. No PostgreSQL instance or connection was introduced.

## Completed safeguards

- Added zippy-synthetic-dev local profile, explicitly bound to the verified instance, workspace 1 and branch v1. Credentials were backed up locally; the default profile was preserved. The live branch label is source metadata: all mutations used sandbox/ephemeral routes only.
- Fresh native SQL and authenticated Metadata API calls prove sandbox database sn9m-aat6-200c with 51 physical tables. Dedicated ephemeral probe proves database e9aa-vgbb-7f5c.
- Public signup now fails before any database operation. Both sandbox MCP servers have empty tool bindings. Their server shells remain; transport authentication is not newly certified.
- Live definitions were preserved and hash-verified unchanged during this task. The new empty request middleware is not an authorization control and was not copied into sandbox. Direct Workspace Push remains disabled.
- Server-reported token scopes include broad workspace and live-data-source permissions. The new profile reuses that credential; it does not reduce privileges. Dedicated restricted, expiring credentials remain required before unattended execution. RBAC was enabled on the disposable tenant only.

## Corrected diagnostic and executed tests

The function/run response is nested as result.status and result.result. Earlier probes parsed the wrong level and incorrectly treated the response as empty. Current evidence supersedes that specific diagnostic blocker; it does not invalidate the observed separate-fixture behavior of native workflow tests.

Authenticated Metadata API HTTP calls share persisted synthetic state: a fresh read saw zero fixture users/platforms, setup created them, and two independent later reads each saw one. Four simultaneous different-key commands produced one CREATED and three RESOURCE_BUSY results, across four database sessions; maximum lock wait was 6972 ms. Four identical retries produced one CREATED and three REPLAY results, across four sessions; maximum lock wait was 6360 ms. Post-run inspections confirm one active assignment, complete winning related records and no losing order/idempotency records. These prove only the bounded internal fixture path, not public JWT API authorization, driver-independent exclusivity, worker fencing, universal database constraints or production capacity.

Independent rollback probes in a disposable table reached insertion, then raised either a database division error or an application throw. Both were caught and left zero matching rows. This is observed behavior for these exact functions on this instance, not a guarantee for arbitrary non-database errors or multi-table booking rollback.

The generic tenant command supports ingress and RBAC settings even though ephemeral edit does not. Both are now enabled for the verified initially empty disposable tenant. No hostname is assigned, so public application HTTP acceptance remains unverified. It expires at 2026-10-22 05:37:12 UTC (11:07:12 Asia/Calcutta); it is not a durable staging environment. No public fixture/fault-injection endpoints were created.

## All 72 source cases mapped, not accepted

backend/contracts/postgres-case-map.json records each original function/parameter case, exact source commit 19f828b6f7be56ae5db7930ce99368bdffa3c471, verified Git blob hash, original executable selector, required assertions, missing native adapter and evidence status. Counts: core 2, dispatch 31, finance 23, payment privileges 4, governance 12. All remain NOT_VERIFIED for complete Xano acceptance. They cannot be run unchanged against Xano: the original tests require PostgreSQL roles/RLS/RPC plus the old Python service. Port each invariant to a supported Xano test rather than introducing another database or relabeling these bounded proofs.

## Reproduce the bounded concurrency proof

Node 22 or newer, XANO_METADATA_TOKEN supplied locally (never in Git), ZIPPY_SYNTHETIC_PROOF=confirm and an unused adjacent fixture pair selected with ZIPPY_PROOF_ASSET_BASE (0 through 10). Run node scripts/run-sandbox-concurrency.cjs from this repository. The runner refuses a different database and occupied assets, caps concurrency at four and writes a sanitized report. It uses administrative Metadata API authentication, not application user tokens. The current run occupied assets 0 and 1; no existing assignment was released or deleted. Synthetic fixtures are intentionally retained.

## Remaining blockers

Restricted expiring admin scope, a supported durable isolated HTTP hostname, application-token permissions across roles and tenants, independently competing driver assignments, worker fencing/claims, complete non-database failure coverage, immutable/relationship controls, concrete native adapters for all 72 cases, provider test flows, and recovery/restoration remain unresolved. Staging gate stays blocked.
