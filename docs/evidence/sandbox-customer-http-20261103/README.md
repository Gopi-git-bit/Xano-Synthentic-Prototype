# Customer sandbox cross-stack HTTP — PASS

**Executed by OpenCode, 2026-11-03 UTC.** The approved server-only customer flow passed against a fresh Xano ephemeral tenant. [Machine-readable summary and receipt hashes](summary.json).

## Exact sources and target

| Item | Tested identity |
| --- | --- |
| Backend PR #10 | `4421892ff9c884e43711753cacde04efd4ddb7c6` |
| Frontend adapter PR #12 | `697da352a331dbe623cb21d81704bfc892079327` |
| Tracker PR #11 base | `6ad69712283ee1991ffe4870148fe620798a0a23` |
| Xano origin | `https://xynd-fnea-khtp.n7e.xano.io` |
| Parent / source branch | workspace **3**, `v1` (live); definition reads only |
| Fresh tenant | **`exwq-wsmx-c3e1`**, ID **6**, internal workspace **1**, branch `v1` |
| Expiry | **2026-11-04 06:56:09 UTC** |

PR #12 ran from a separate detached worktree. The backend development worktree and frontend worktree remained clean at their exact tested commits. A separate temporary candidate matched all 45 PR #10 Git blobs byte-for-byte before import.

The empty-tenant receipt proves zero tables/API groups/functions and zero environment keys before import. Tasks were disabled while the tenant was empty. Import/readback found **34 empty tables, two guards, two groups and seven endpoints**, with API history disabled. No executable task, agent, tool, MCP server or trigger resources existed. No records, environment values or credentials were copied from the parent.

## Commands and outcomes

| Executed command / check | Observed result |
| --- | --- |
| `npm run test:server` from PR #12 `frontend` | **67/67 passed**, including six adapter tests |
| Exact-source validation with `@xano/developer-mcp` | **45/45 valid**, exact PR #10 bytes |
| `xano ephemeral push exwq-wsmx-c3e1 -p default -w 3 -d <temporary-candidate> --dry-run` | Only 34 tables, two functions, two groups, seven endpoints created |
| Same tenant-only command with `--force` | **45 documents imported**; authenticated readback passed |
| `npm run verify:sandbox-customer` from PR #12 `frontend` | Exit **0**, `SANDBOX_CUSTOMER_FLOW_VERIFIED` |
| A/B isolation, schemas, secrets, replay and side-effect checks | Original **15/16**; the single over-constrained assertion resolved by targeted boundary recheck below |
| Parent published/draft definition comparison | **87/87 published + 87/87 draft files byte-identical** |
| `node --test scripts/validate-evidence-chain.cjs` on the tracker update | **3/3 passed** (ledger structure only) |

The manual runner used its documented local variables:

```text
ZIPPY_SANDBOX_EXPECTED_ORIGIN=https://xynd-fnea-khtp.n7e.xano.io
ZIPPY_SANDBOX_TENANT=exwq-wsmx-c3e1
ZIPPY_SANDBOX_TEST_APPROVAL=synthetic-write-test-only
```

An external Node preload observed real `fetch` calls and validated cloned responses in memory. Neither the runner nor adapter source was modified; no response was simulated. Passwords and app tokens stayed in memory. Receipts retain methods, routes, timestamps/statuses, assertions and synthetic IDs, not raw bodies, addresses, credentials or password hashes. Login's intentional auth-token response was checked in memory; the adapter's final result contains no token.

## Actual unchanged-runner HTTP receipt

Bases are `/tenant/exwq-wsmx-c3e1/api:zippy-customer-draft-auth` for auth/membership and `/tenant/exwq-wsmx-c3e1/api:zippy-customer-drafts` for bookings.

| Step | Request | HTTP | Complete response schema / secret exclusion |
| --- | --- | --- | --- |
| Register | POST `auth/register` | 200 | PASS |
| Login | POST `auth/login` | 200 | PASS |
| Identity | GET `auth/me` | 200 | PASS |
| Membership | GET `organization/membership` | 200 | PASS |
| Draft | POST `bookings` | 200 | PASS |
| List | GET `bookings?page=1&per_page=100&status=draft` | 200 | PASS |
| Detail | GET `bookings/1` | 200 | PASS |

Result: synthetic user **1**, organization **1**, pending review **1**, booking **1**, status **draft**, scope **draft_only**, operational execution disabled. See [adapter-http.json](adapter-http.json).

## Isolation and retained assertion failure

Two more complete flows through the exact adapter created independent A/B organizations **2/3** and drafts **2/3**. Each list contained only its own draft; foreign and missing detail IDs returned identical **404** bodies in both directions. Foreign organization selectors returned **403**. Anonymous/tampered reads and draft POSTs returned **401**. Forged draft ownership, actor and financial/operational state returned **400**. Idempotent replay returned the original draft; reads, denials and replay left all **34** tenant tables unchanged.

[supplement-http.json](supplement-http.json) intentionally retains its **15/16** initial result. The only failure required absent-token and sandbox-token parent `auth/me` errors to have identical bodies. All three parent calls already returned **401**. A focused recheck using synthetic identity **4** proved that the sandbox token exactly matches the **invalid-token** denial, whereas an absent token has a different denial message. All responses had only `code`/`message`, exposed no identity, and contained no secret. This resolves a test expectation error, not a product failure. See [boundary-recheck.json](boundary-recheck.json). The sandbox app token also received **401** from both tenant and parent Metadata API GETs.

Across all phases, **60 actual HTTP calls** were captured: **53 tenant requests and seven parent GET-only requests**; statuses were **26×200, 5×400, 20×401, 5×403, 4×404**. Metadata inspection/import calls are separate from this runtime count.

Final synthetic counts: four users, organizations, owner memberships and pending reviews; three draft bookings; three completed idempotency claims; seven audit rows. All other 27 tables remained empty, including payment, refund, settlement, trip/assignment, outbox, durable-task and agent records. The boundary recheck's fourth identity created no booking. Tasks stayed disabled; environment keys and executable provider/agent resources stayed absent.

## Source preservation and remaining scope

[source-integrity.json](source-integrity.json) records unchanged SHA-256 manifests for all 87 published and all 87 draft files. The parent auth/me source and its guard were inspected as read-only before the denial probe. No parent application-definition writes or production record mutations were issued. Tenant Center creation/task configuration affected only the approved ephemeral tenant. No release flag changes, production deployment, merge, provider call, payment, refund or dispatch was executed.

**Remaining sandbox-flow failures: none.** This is server-adapter sandbox HTTP acceptance. Browser/protected-preview acceptance remains unrun. Formal W3-P/AB/C and production gates remain blocked: this run does not certify restricted Metadata-credential RBAC, independent physical database identity, reverse parent-token isolation, or expiry/recovery. The original historical 48-case backend suite was not rerun; these receipts document this new bounded cross-stack execution.

**Next permitted task:** review these receipts and prepare a scoped protected sandbox UI/preview proposal against the pinned contract. Any additional runtime writes require a current verified tenant and the applicable scoped approval.
