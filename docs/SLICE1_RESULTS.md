> Historical results retained from 21 October. Current blockers and test scope: [STAGING_STATUS.md](STAGING_STATUS.md).

# Synthetic transaction slice — actual Xano results

Inspected and executed on 2026-10-21. **This is a partially verified sandbox implementation, not a completed backend. Concurrency acceptance remains blocked.**

Reference: [Gopi-git-bit/New-logistic-](https://github.com/Gopi-git-bit/New-logistic-), revision `52ca43d8a2fb4f3d5d105dc6bb9f7420e5cfca26`. Canonical `db/zippy/migrations/` and current Markdown acceptance requirements remain authoritative. The original 41 predicate tests are not counted as transaction evidence.

## Binding and isolation

- Instance: `https://xynd-fnea-khtp.n7e.xano.io`; workspace **1**, **Zippy Synthetic Prototype**.
- Authenticated branch read confirms **v1 is live**, and it is the only source branch.
- Personal sandbox **sn9m-aat6-200c**, ID **1**, type `sandbox`, state `ok`, ingress `false`.
- Pre-write authenticated dry run: `source_workspace_mismatch: false`, correct workspace name, no operations for the unchanged workspace declaration.
- Native SQL execution: `current_database() = sn9m-aat6-200c`, 51 physical Xano tables, PostgreSQL advisory-lock function available.
- Sandbox is a separate database environment. Its definitions carry the source `v1` label; that does **not** mean mutations reached the live workspace. Sandbox commands have no separate target-branch selector; promotion would require an explicit later target selection.
- Final authenticated live definition export matches the pre-write SHA-256 exactly: `6ca83b179792534ffc80a245d585f0b52f88081fb0fc4814941d2e5d0d467b80`.

Evidence: preflight (historical local evidence; not bundled), final verification (historical local evidence; not bundled), native isolation test (historical local evidence; not bundled). No record or environment-value exports were requested. Data operations used only this run's synthetic UUIDs and `.invalid` fixture identities.

## Authentication changes

- Authentication/reset logging callers pass user IDs. `Quick Start/log_event` independently discards arbitrary metadata and persists only `{user_id}`. A native workflow supplied synthetic password/token/email fields and verified the stored metadata contains only the user ID.
- Reset URLs use `URL` and separate `URLSearchParams` values. The frontend must be HTTPS and cannot contain credentials, a fragment, or an existing query. Missing/unsafe configuration fails before reset-token generation. **`auth_password_reset_url` remains unconfigured; no frontend URL was invented.**
- Welcome email requires Xano user authentication and a matching authenticated requester/target before lookup or email execution. Self, cross-user, and anonymous authorization helper tests passed.
- Six focused authentication unit tests passed; the database-isolation test also passed. No test sent an email. These prove the helpers and stored log behavior; HTTP/JWT/email-provider integration remains untested with ingress disabled.

Evidence: the six `179260053*` / `179260054*` auth reports in [evidence](evidence/), and stored-log workflow result (historical local evidence; not bundled). That early runner used `workflow-1` in filenames for every workflow; this file is workflow **3**, auth log redaction, server timing **1.95 s**.

## Implemented transaction

`Slice1/create_and_assign` is an internal function restricted to the verified sandbox database and this run's two fixture platforms. It resolves the operational identity and memberships from server records, validates the order and test quote, checks tenant-bound vehicle/driver/provider/document/body/capacity facts, and rejects an existing active assignment. It uses a coarse platform advisory transaction lock. Concurrency effectiveness is not yet proved.

One native database transaction writes the idempotency claim/result, immutable test quote, order, two stops, dispatch requirements, customer/vendor participants, pickup commitment, explicit candidate offer, trip/assignment, three state transitions, four operational events, audit event, durable task record and outbox record. Successful internal results carry `http_status: 202` and `workflow_id`; there is no public mutation endpoint. The task is marked succeeded because this bounded synthetic command executes inline; a durable worker/lease/recovery service is not implemented.

Test pricing is explicitly synthetic (`test-m3-v1`); no production pricing/provider policy is inferred. No external dispatch, email, payment, ERP, or AI agent was executed.

## Successful runtime acceptance

| Actual Xano execution | Result | Evidence |
|---|---|---|
| 13 sequential scenarios: create with all related records, exact duplicate replay, changed-payload conflict, original-state inspection, claimed foreign platform rejection, foreign resource rejection, second-tenant positive control, overweight/body rejection, two interruption/retry pairs | `ok`, 12.38 s server time | [workflow 1](../backend/evidence/slice1/workflow-1-1792601961343.json) |
| Injected SQL division-by-zero after order creation; zero residual rows in **all 15 affected tables**; retry creates; next retry replays | `ok`, 13.43 s | [workflow 10](../backend/evidence/slice1/workflow-10-1792602068718.json) |
| Injected SQL division-by-zero after assignment, audit, task and outbox creation; zero residual rows in all 15 tables; retry creates then replays | `ok`, 14.24 s | [workflow 11](../backend/evidence/slice1/workflow-11-1792602069618.json) |
| Discard the first application result, inspect committed state, retry and verify replay with one order/idempotency record | `ok`, 14.11 s | [workflow 12](../backend/evidence/slice1/workflow-12-1792602069109.json) |
| Final positive control: assigned order, complete related-record counts, one audit and one idempotency record | `ok`, 7.20 s | [workflow 2](../backend/evidence/slice1/workflow-2-1792602174203.json) |

For a complete order the assertions require status `assigned`, version **4**, stops **2**, participants **2**, transitions **3**, operational events **4**, audit **1**, durable task **1**, outbox **1**, trip **1**, assignment **1**, and idempotency record **1**. Negative requests compare before/after counts across all 15 affected tables. The fault-provenance workflows additionally require Xano's actual `ERROR_FATAL` message to contain `division by zero`, preventing an earlier validation failure from masquerading as a rollback test.

The discarded-response test simulates application-level response loss. It does not prove an actual severed HTTP connection or process restart.

## Concurrency result: not verified

The attempted native asynchronous harness was rejected on import: `Invalid block: async`; the alternate argument syntax was also rejected: `Invalid arg: async`. These are recorded failures, not passing tests. The instance's connected syntax reference does not expose async function execution, despite the newer npm documentation showing it.

An actual overlap probe launched two authenticated workflow runs four seconds apart. While one held synthetic fixtures and slept, the other saw **zero** matching fixture platforms. This proves separate workflow runs do not provide shared fixture state here. Racing independent isolated runs would not test contention over the same order, vehicle or idempotency record. See [raw overlapping-run evidence](../backend/evidence/slice1/shared-context-probe.json).

Sandbox HTTP ingress is disabled, and sandbox function-run route probes returned HTTP 404. No live endpoint was used as a substitute. To finish concurrency acceptance, this implementation needs a supported sandbox execution path that runs overlapping commands against the same synthetic dataset. Four-way different-key assignment and identical-key races remain unexecuted against shared data; lock telemetry and attempted harnesses are preserved locally.

## Review artifacts and limits

- [backend/xano](../backend/xano/) contains the authenticated final server definitions, including workflow assertions. This is the review/export source; intermediate generator scripts are diagnostic history and must not be blindly replayed.
- Final sandbox inventory: **51 tables, 20 functions, 12 endpoints in 4 groups, 8 workflow tests, 50 unit definitions**, plus the preserved agent/tools/MCP/addon objects. Counts describe definitions, not backend completeness. The 26 state-dependent draft unit cases were removed from the function and replaced by workflow-based acceptance.
- All diagnostic failures and parser/runtime failures remain in `evidence/`; only the specific successful runs above support passing claims. Early setup unit success did not persist fixtures for a later test; workflow setup now provides the correct shared context within a run.
- Live definition hash is unchanged. Nothing was promoted or published. Database-wide foreign keys, row-level protections, partial unique indexes, general onboarding, financial services and background recovery remain outside this slice.
- At the final read the sandbox reported expiry `2026-10-21 18:03:17 UTC`; final definitions and evidence are saved locally so this ephemeral environment is not the sole copy.
