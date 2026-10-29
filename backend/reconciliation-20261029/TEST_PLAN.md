# Current-workspace acceptance plan

**BLOCKED:** no verified isolated expiring workspace-3 environment, restricted credential or approved synthetic accounts/fixture IDs. **NOT RUN:** every case below. These are test specifications, not runtime results. The executable red source checks are `scripts/check-workspace3-known-gaps.cjs`; they identify missing source controls without pretending to emulate Xano.

## Required fixture/environment receipt

Before any hosted fixture creation or mutation, record the instance, workspace 3, branch, tenant route, data-source label, physical database identity, expiry, approved synthetic scope, effective access and denial of live writes using the restricted identity. Confirm tables/columns/constraints against this workspace, not workspace 1. Provide isolated customer organizations A and B; approved active customers A/B, inactive/suspended A, removed-membership A, unsupported-role and operator identities; bookings A1/A2/B1 and a proven-absent ID. IDs are symbolic until provisioned. Capture only fixture data, pre/post hashes and sanitized status/shape receipts. Notification/payment/AI integrations must remain non-operational.

For mutation tests use a fresh run namespace, no existing live rows, per-case disjoint fixtures and recorded expiry. Fault injection must be isolated, deterministic and impossible through public production inputs. Record source hash, request ID, actor, target, expected/actual deltas and errors. No blanket cleanup/reset; retain receipts and use the approved environment lifecycle.

## A/B: identity and reader cases

| ID | Action | Required assertion |
|---|---|---|
| AB-01 | Approved A login then `auth/me` | 200/token then authoritative active ID/system role/org A; no password/hash/reset/token in event metadata; login event contains only allowlisted action and user ID |
| AB-02 | Wrong password, absent synthetic account, suspended account | Login denied with safe generic credential error; no token; suspended token also denied by `auth/me` and readers |
| AB-03 | Remove membership, deactivate organization or change role after token issue | Next request re-resolves current state; no stale token privilege; no booking success |
| AB-04 | A lists own bookings, status and page combinations | Every returned row belongs to A and requested status; page/nextPage valid; bounds enforced; no B row/count leak |
| AB-05 | A gets A1, B1 and proven-absent ID | A1 succeeds with minimal projection; foreign and missing both same not-found status/code/message/shape; no foreign cargo/holds |
| AB-06 | Browser/direct API organization selectors and forged role fields | Browser adapter rejects overrides; direct API selector requires active membership; token extras never grant scope |
| AB-07 | Vendor/driver/operator access; malformed auth projection | Customer reader denied for noncustomers; malformed/null identity rejected by adapter; no lookup before auth failure |
| AB-08 | Provider returns null, malformed page/detail, foreign item or invalid pagination | Adapter returns error (502 contract failure), never 200 empty list; only a valid tenant-scoped empty page succeeds |
| AB-09 | All 12 refusal candidates; absent, malformed and approved tokens | Non-2xx for every route/body/path variant, authenticated fixed denial; zero database/audit/outbox deltas; invalid/missing path inputs never bypass refusal |

The eight current anonymous probes are separate, already executed evidence. They do not fulfill AB-01 through AB-09.

## C: deterministic implementation and concurrency cases

| ID | Action | Required assertion |
|---|---|---|
| C-01 | Omit/null/zero/negative distance; route provider unavailable | No fabricated distance or provider evidence; refusal/hold before writes according to approved policy |
| C-02 | Valid first cargo item, invalid later weight/unit/dimension | Whole request rejected; no booking, cargo, command, audit or outbox partial commit |
| C-03 | Many valid requests within the same second | Collision-resistant references; independent successful requests have distinct IDs |
| C-04 | Same canonical payload/key concurrently from independent sessions | Exactly one committed command and result; deterministic replay; one booking/cargo/audit/outbox effect set |
| C-05 | Same key changed payload; changed JSON key ordering; cross-org reuse | Changed canonical payload conflicts; equivalent JSON replays; another tenant/actor never sees cached response |
| C-06 | Missing key, expired key and interrupted processing claim | Mandatory key; explicit expiry/recovery semantics; no stuck claim or duplicate effect |
| C-07 | Two updates with same expected version | One succeeds; other conflicts through atomic database comparison, not a prior read alone |
| C-08 | Inject failure at each booking/cargo/assignment/audit/outbox boundary | Full pre/post fixture hashes unchanged on rollback; no notification/payment escaped transaction |
| C-09 | Two bookings, same vehicle, different drivers | At most one active reservation/assignment; prove physical unique/exclusion enforcement under real overlap |
| C-10 | Two bookings, different vehicles, same driver | At most one active reservation/assignment; loser leaves no partial vehicle claim |
| C-11 | Same order competing assignments and simultaneous expiry/release | One authoritative active assignment; safe release by owner/version; no bypass writer |
| C-12 | Worker A expires, B reclaims, then A completes/extends/deletes | Stale A rejected using persisted fencing generation in the write predicate; B alone can finish |
| C-13 | Crash before send, after send/before ack, poison/duplicate outbox events | State/outbox atomicity; bounded retry, consumer dedupe, unknown-outcome reconciliation and owned dead-letter state |
| C-14 | Concurrent OTP use, invalid decision, expired/changed quote, guess budget | Secure unpredictable OTP; no reusable fixed code; atomic consume only on fully valid bound decision; failed attempts counted; no consumed challenge on invalid decision |
| C-15 | Forge/replay payment webhook or mismatch amount/currency/order/custodian | Verified provider source and exact binding required; no arbitrary transition to paid or settlement; one durable audit effect |
| C-16 | Refund without/with expired approval; changed beneficiary/amount/version | Human-bound approval and deterministic authority required; unknown provider outcome reconciles before retry; no model-approved money movement |

Successful source checks are only prerequisites. Record actual Xano transaction/lock/index/worker evidence for C-04 through C-16. Historical PostgreSQL results, static P2 strings and offline models cannot satisfy these cases.
