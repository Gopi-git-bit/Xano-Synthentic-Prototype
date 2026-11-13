# M1 reconciliation and implementation sequence — 29 October 2026

**Current target: workspace 3 / v1 / live. Historical workspace 1 / `sn9m-aat6-200c` is a separate evidence lineage. M1 hosted acceptance is still blocked.**

Review branch `codex/xano-m1-reconciliation-20261029`, exact Git base `ed62038f571c02f339972ad7ec5d7cd1a9cffe18`. Inspected frontend `35461bd62bfd90b6f7e901791aa3d097b6649ead`; reported `8eeef1e0cdca218f8bdf17f792f3b2cb6b68937b` unavailable remotely. No current synthetic environment is verified. [Identity/inventory](XANO_CURRENT_STATE.md) and [commands/receipts](XANO_BACKEND_TEST_EVIDENCE.md) define the evidence boundary.

**VERIFIED** means the stated source/offline/HTTP check succeeded; **FAILED** means an executed assertion failed; **BLOCKED** means prerequisites absent; **NOT RUN** means no execution; **NOT IMPLEMENTED** means required current code absent.

## Historical findings reconciled

| Earlier finding | Current reconciliation |
|---|---|
| 51 declared versus 53 observed physical tables; `mvpw1_56`, `mvpw1_57` diagnostics | **BLOCKED historical reconciliation.** Workspace 1 is absent from accessible listing; no destructive action taken. Workspace 3 has 33 complete metadata declarations, not a fresh physical count. Do not remove two tables or rename metadata to force a match. |
| Staging identity, recovery, isolation and restricted access incomplete | **BLOCKED.** Current metadata identity is verified but credential is broad/nonexpiring. No current isolated expiring environment/approved accounts; historical sandbox existence/expiry cannot authorize reuse. |
| 106 offline checks | Historical count, superseded by later preparation documenting 184. This run executes the targeted 23-test execution-model subset only, not all 184. No conversion to hosted passes. |
| 31 hosted M1 cases | **NOT RUN in this task**; historical status remains 0/31. Current table IDs/schema differ, so old runners cannot be pointed at workspace 3 unchanged. |
| PostgreSQL 72 reference cases | Reference-only; not Xano acceptance, not rerun. |
| Reservation revision/native preview | Historical workspace-1 source/preview evidence retained; no workspace-3 constraints or rollback established. |
| Prior native workflow 13 success and two earlier failures | Retain historical accepted `{status:"ok",timing:1.96}`, missing-action and exact-message mismatch qualifications. No rerun or extension to current workspace; omitted-input P2 behavior remains unverified. |
| Unsafe published auth logging and incomplete identity/read routes in October 27 frontend handoff | **Superseded at published-source level.** Sixteen GUID-matched definitions changed; current logger/context/read projections reviewed and eight denied HTTP reads verified. Positive-account/tenant acceptance remains **BLOCKED**. |
| Booking writes disabled | No business writes in published stubs, but explicit failure is **NOT IMPLEMENTED**. Twelve source checks **FAILED**; local refusal candidate passes, deployment **NOT RUN**. |

Historical `docs/STAGING_STATUS.md`, `docs/XANO_NATIVE_CONTINUATION.md`, `docs/XANO_RESERVATION_REVISION.md`, sealed approval packages and previous failures remain intact. The original and nested main checkouts remain at `223bae3a1b63218f050ebe48cef7903595926db7`. No unrelated branch merge occurred.

## Current transaction/security gaps

Paths below are relative to [`backend/reconciliation-20261029/evidence`](../backend/reconciliation-20261029/evidence). Published booking/pricing functions are empty; draft observations are not deployed business behavior.

| Control | Current source / finding | Required corrective proof |
|---|---|---|
| Trusted route distance | **FAILED** source gate: `draft/function/booking/create_draft.xs:88` substitutes 480; `pricing/calculate_quote.xs:163–165` also substitutes 480 and later labels evidence `mappls` without a provider lookup | Reject/hold unknown route facts; use approved, fresh route evidence. Test missing/null/invalid/provider-unavailable inputs. |
| Validate before persistence | **FAILED**: create inserts booking at line 92 before per-item positive-weight validation at line 122 | Validate all items/units/windows before first write; no partial booking on later invalid item. |
| Unique booking reference | **FAILED**: `ZIP-BK-` + date + second-resolution time | Collision-resistant identity and database uniqueness; same-second parallel test. |
| Atomic create/confirm/quote/holds/audit/outbox | **FAILED** transaction source gates; no `db.transaction` in captured draft functions. Confirm edits booking then outbox then audit separately | One supported transaction boundary; inject each failure; prove complete rollback. |
| Idempotency and versions | **FAILED** mandatory-key/expiry gates. `security/validate_command` uses optional key, JSON-encoded hash, read-then-insert claim and optional read-time version check; selected expiry unused | Mandatory tenant/actor/operation/entity binding, canonical hash, durable result, atomic conflict/replay/recovery and version write predicate. A declared unique key alone does not prove correct race handling. |
| Assignment/exclusivity | **NOT IMPLEMENTED** atomic assignment service; **FAILED** reservation index source gate: only claim UUID unique | Physical unique/exclusion controls for order/vehicle/driver as approved by interval policy; two independent sessions and loser rollback; validate every writer. |
| Workers/fencing | **NOT IMPLEMENTED** worker service; **FAILED** fencing source gate. Lease owner/expiry fields exist, scheduled task inventory empty | Persisted generation/token checked atomically by claim/heartbeat/complete/release; stale worker cannot finish after reclaim. |
| Consent/OTP | **FAILED** two additional source gates: draft challenge hashes a fixed six-digit literal; decision consumes OTP before validating decision/quote. Capability is stored/returned as a bearer value; no demonstrated attempt-budget enforcement | Secure random challenge, protected capability binding, atomic one-time consumption after complete validation, bounded guesses, quote/payer/amount/version binding. Never publish the current draft. |
| Payment/refund authority | **NOT IMPLEMENTED** signed provider event handler, deterministic settlement/refund executor or approval enforcement in current function/query inventory | Human-bound approval, custody/execution party, amount/currency/order/replay checks, audit and unknown-outcome reconciliation. Tables and `paid_escrow` flags are not authority. |
| Hold/recovery state authority | Draft hold release accepts optional evidence; resume recomputes draft/quoted/booked without a demonstrated approved global state graph/CAS | Adopt approved transitions/evidence requirements, scoped authority and transaction/version predicates; deny invalid recovery transitions. |
| P2 acceptance runner | **NOT IMPLEMENTED** published runner; draft static PASS labels/hardcoded 22 are not executed assertions | Replace with actual assertions only in verified isolation; preserve historical label artifact separately. |

Eleven final source-readiness checks fail intentionally; these are useful red baselines, not evidence that hosted transaction cases were executed. [TEST_PLAN.md](../backend/reconciliation-20261029/TEST_PLAN.md) defines 9 identity/read/refusal and 16 mutation/concurrency/finance cases, all **NOT RUN / BLOCKED**.

## Safe corrective work completed locally

Added **12 endpoint refusal candidates** under `backend/reconciliation-20261029/candidate`, preserving route identities/GUIDs. Each requires user authentication and immediately raises fixed `accessdenied`; no helper, database or provider call. Original published/draft snapshots are preserved. Regression-first sequence: captured published routes **1 coverage pass + 12 failures**, then candidate **13/13 passes**. These are source allowlist/coverage/identity checks; Xano parse/preview and runtime remain **NOT RUN**.

This addresses misleading null mutation handlers without authorizing draft booking/payment workflows. It does not implement booking creation, assignment, OTP or money movement.

## Five-agent requirement-to-implementation matrix

Current workspace has only a documentation example agent. The five historical unbound sandbox drafts and package remain references, not current installations. **No agent was executed.**

| Planned agent | Retained responsibility | Current workspace-3 substrate | Operational implementation |
|---|---|---|---|
| OMS | Orders, booking lifecycle, state transitions | Published customer readers; draft booking helpers and booking/quote/hold tables | **NOT IMPLEMENTED** guarded command/state authority |
| IMS | Vehicles, drivers, availability, matching | vehicle/driver/availability/reservation tables | **NOT IMPLEMENTED** matching/atomic assignment/exclusivity |
| TMS | Dispatch, trips, tracking, execution | trip/trip_stop/tracking_event tables | **NOT IMPLEMENTED** authenticated dispatch/tracking/recovery services |
| Verification | Documents, compliance, POD, evidence | compliance_documents/proof_of_delivery/OTP tables | **NOT IMPLEMENTED** trusted verification/immutable evidence/OTP completion |
| Finance/Compliance | Payment state, settlement, audit, human-approved refunds | payment/refund/settlement/approval/audit tables; draft selection/consent gates | **NOT IMPLEMENTED** signed financial authority and maker-checker execution |

All 20 package requirements are mapped below. `P` = captured published source; `D` = draft; `T` = table. Exact requirement and ZSC test references remain in `backend/agent-package/Zippy_Agent_Contracts.json`; all 70 ZSC acceptance scenarios remain **NOT RUN**.

| Requirement | Current evidence / gap | Current disposition |
|---|---|---|
| PRD-01 Five scoped agents | One example agent only; historical five unbound prompts are workspace 1 | **NOT IMPLEMENTED** |
| PRD-02 Typed intake/commercial snapshot | D create/quote contain fallback and validation-order defects | **FAILED** source prerequisites |
| PRD-03 Single transition authority | D booking helpers update independently; no global atomic transition authority | **NOT IMPLEMENTED** |
| PRD-04 Transactional assignment | T reservations; ordinary resource indexes; no assignment command | **NOT IMPLEMENTED**, exclusivity gate **FAILED** |
| PRD-05 Durable idempotency | D validate/complete helpers; optional key, no expiry enforcement/CAS proof | **FAILED** source prerequisites |
| PRD-06 Outbox/replay | T outbox/tasks; D non-atomic writes; no worker | **NOT IMPLEMENTED** end-to-end |
| PRD-07 Evidence/document security | T compliance/POD; P safe auth event projection; D unsafe OTP | **BLOCKED** immutable/quarantine/security acceptance |
| PRD-08 Deterministic finance | T payment/refund/settlement/approval; no provider authority handler | **NOT IMPLEMENTED** |
| PRD-09 Consent/mode gates | D ToPay/prepaid checks; fixed OTP and premature consumption | **FAILED** source prerequisites; policy approval **BLOCKED** |
| PRD-10 Finance separation | Distinct tables; draft quote minor-unit arithmetic with fallback policy/distance | **BLOCKED** approved custody/tariff/tax/rounding and ledger proof |
| PRD-11 Holds/manual review | D manage_hold, T approval_request; no bound approval executor | **NOT IMPLEMENTED** complete authority |
| PRD-12 Trip observability | T trip/tracking only | **NOT IMPLEMENTED** trusted telemetry/freshness |
| PRD-13 Notification semantics | P welcome endpoint refuses; T outbox and D intents only | **NOT IMPLEMENTED** approved routing/receipts/escalation |
| PRD-14 Tenant/role isolation | P resolve_context/authorize_resource/readers; eight HTTP denials | **VERIFIED** source/denial scope; positive tenant runtime **BLOCKED** |
| PRD-15 Bounded failure handling | Retry count/lease columns, no scheduled workers | **NOT IMPLEMENTED** durable recovery |
| PRD-16 Model output contract | Package JSON schema; no current scoped agent gateway | **VERIFIED** LF-normalized offline schema only; runtime **NOT IMPLEMENTED** |
| PRD-17 Controlled deployment | No current approved isolation; release untouched | **BLOCKED** |
| PRD-18 Operational completeness | Hold/incident tables, no validated duty queues/runbooks | **NOT IMPLEMENTED** |
| PRD-19 Return/multi-leg linkage | No current deterministic return command | **NOT IMPLEMENTED** |
| PRD-20 Evidence registry | This bundle has source hashes and actual denial/offline receipts; current P2 is static | **VERIFIED** bounded evidence; hosted acceptance **NOT RUN** |

Package validation uncovered a separate **FAILED** byte-manifest check: CRLF exists in committed blobs, while manifest hashes describe LF. All nine manifest files match after explicit LF conversion in a separate temporary comparison copy; there, configuration/cross-reference validation and **37 schema + 13 binding-preparation fixtures pass**. Original bytes, failures and manifest are preserved; this does not count as a raw package pass. Resolve canonical package-byte policy in a separate review rather than silently replacing hashes. Fifteen policy decisions remain open.

## Prioritized next work

1. **Exact next task: provision/identify and verify an approved, expiring, isolated workspace-3 synthetic environment with a restricted credential and approved A/B/suspended fixtures.** Capture physical database identity/constraints and live-denial evidence; establish expiry/recovery. Current admin access does not meet this gate. Creation/provisioning needs the owner's approved scope; do not reuse historical sandbox routing.
2. In that environment, preview the 12 refusal candidates and run AB-09 with zero-effect assertions. Selectively compare their GUIDs against a fresh capture; any drift requires review. Live publication remains separately authorized.
3. Run AB-01–AB-08 against the current auth/read implementation, including synthetic log inspection and status/membership changes. Obtain the reported frontend commit remotely; keep release flags blocked until evidence is complete.
4. Implement C-01–C-08 locally/isolation-first: full validation, trusted routes, collision-resistant references, mandatory idempotency, transaction/CAS and rollback. Keep mutation routes refusing until accepted.
5. Implement/prove C-09–C-13 resource exclusivity and worker fencing. Get supported physical-catalog inventory without changing tables to match historical counts.
6. Replace unsafe consent draft and implement approved financial authority only after policy resolution; execute C-14–C-16 with provider stubs. Bind agents only after deterministic controls and permissions pass independently.

The immediate review and local correction are complete; production readiness, hosted M1 acceptance and five-agent implementation are not claimed.
