# First M1 acceptance execution — prepared, blocked

Baseline is `ea543e9c4679006479144fc6412597b074dd5505`. [Existing TEST_PLAN](../backend/reconciliation-20261029/TEST_PLAN.md) and its statuses remain unchanged. Source verification is not hosted acceptance.

## Prepared executable components

- `backend/m1-acceptance-preparation/runner.cjs`: portable transport-neutral Node acceptance engine.
- `approval.template.json`: committed **NOT_APPROVED**, no credentials, no real tenant/fixture IDs.
- `scripts/prepare-m1-isolated-source.cjs`: filesystem-only allowlist builder. The generated source set contains **59 definitions**, no draft business functions, agents, tasks, provider tools, records or environment secrets. **Not imported or previewed.**
- `scripts/test-m1-acceptance-preparation.cjs`: **16 new offline safety tests passed**. They exercise approval/target/expiry rejection, snapshot completeness, same-count side effects, provider/agent effects, malformed/foreign responses, error redaction, post-failure observation and preflight drift. They do not simulate a full successful hosted acceptance run.

Safe commands now:

```sh
node backend/m1-acceptance-preparation/runner.cjs --plan
node scripts/prepare-m1-isolated-source.cjs <new-empty-output-directory>
```

The source builder was executed once locally. No Xano import command ran. Existing 13 source checks, 17 frontend mocks, 23 historical model checks and the earlier LF-comparison results were preserved, not rerun. The explicitly requested seal verification was rerun; all 240 hashes passed. The original 11 failing source gates were carried forward by their recorded results, not relabeled or rerun.

## Native adapter boundary — NOT IMPLEMENTED

The engine has no default network transport. A native adapter must be separately implemented/reviewed after approval and tenant creation, pinned by SHA-256, and use **only the exact application/metadata URLs discovered for that tenant**. Never guess a tenant route, use an origin-only allowlist, inherit the default CLI profile, or fall back to parent live URLs. The adapter must have no top-level I/O; CLI verifies approval and its hash before loading it.

Required interface:

| Method | Required native behavior |
|---|---|
| `scope` | Exactly `xano_native`; offline tests use `offline_simulation` and always report zero hosted passes |
| `preflight()` | Freshly verify the approved tenant, physical DB separation, effective credentials/expiry, source manifest, fixture ownership, disabled tasks/agents/egress and evidence references. Return the verified approval-shaped target, never just echo the input file. |
| `fixtures()` | Private run-owned ID registry: org A/B; seven user aliases; revocable membership; five bookings with status; hold ID; nonexistent booking ID and UUID path tokens. Validate every ID belongs to this synthetic run. |
| `login(alias)` | Approved synthetic credentials only; store application token privately in memory by alias. Return status/body only to engine memory. Capture pre/post observation for login audit. No metadata token may reach an application endpoint. |
| `loginAudit(alias)` | Prove exactly one new allowlisted login event for that user, empty metadata and zero credential matches; additionally verify no unrelated rows/provider effects. Never return raw log metadata/credential values to the report. |
| `request(request)` | Fixed group/path/method allowlist from plan; resolve synthetic login variants and saved tokens internally. No redirects; finite response/timeout limits; no retries; recheck target and expiry before every HTTP request. Never expose arbitrary URLs/body/Authorization in errors. |
| `snapshot()` | Read-only native full 33-table count/content digest and per-row ID/hash snapshot; physical DB identity/run ID; independent provider-attempt and agent-call counters. Snapshot all isolated rows, not only known fixture IDs, so unexpected inserts are visible. Stable sorted row order required. |
| `control(command)` | Only six approved fixture control operations, using run-owned IDs/fields. Snapshot verifies no changes to unrelated rows/tables. No arbitrary SQL, table, ID or payload inputs from the test caller. |

Native catalog/row digests must come from the actual database under restricted permissions. A hash of source code, an unchanged count alone, a mock, or a client-submitted boolean is not zero-effect proof. Provider counters require independently enforced/observed egress control; empty outbox rows alone cannot prove no direct external request occurred. Read-only observation itself must not insert audit rows into the monitored database.

## Execution order after separate approvals

1. Pass [stage P isolation/access/source proofs](XANO_ISOLATION_APPROVAL.md). Preview/import only the source allowlist. Confirm the source did not drift from the reviewed hashes.
2. Approve and create stage F fixtures through a bounded seed procedure. Pin adapter hash and private fixture registry. Record expiry and approval references in a separate private readiness JSON; do not edit the committed template to pretend readiness.
3. Run six approved synthetic prerequisite logins; verify each login event. Tokens remain in memory. `pending` is a denied-login identity.
4. **A / AB-09:** 12 routes × four caller modes (anonymous, malformed bearer, customer A, restricted driver) × three variants (own path, foreign path, malformed path) = **144** refusal requests. Normal anonymous/malformed-token paths require 401; normal authenticated paths require 403 and the fixed refusal message. Malformed paths may return 400/401/403/404, never 2xx. Every call has pre/post full snapshots, including assertion/transport failures. Detect same-count mutations and provider/agent effects; stop on first failure, never retry.
5. **B / AB-01–07:** current `auth/me`, pending/wrong/absent login denials, A/B own lists, two status-filtered pages, own detail, exact foreign/missing error equality, unauthorized org selector, driver/operator denial. Then test saved-token invalidation after fixture suspension, membership revocation and organization deactivation; restore only after each case's verified result. Suspended login must also deny.
6. Capture results per case with statuses and hash receipts, no tokens/passwords/PII/raw provider diagnostics. Abort if approval/credentials expire, sources change or preflight/DB identity drifts. Observer/control errors mean **FAILED/BLOCKED**, not a successful empty result.
7. **C:** all 16 transaction/concurrency cases remain **BLOCKED** and are never called by this engine. Require separately approved implementation, physical constraint validity, supported transactions, real contention/fencing and provider-stub authority first.

Future execution command (currently blocked):

```sh
node backend/m1-acceptance-preparation/runner.cjs --execute <private-approved-readiness.json> <reviewed-native-adapter.cjs> <new-sanitized-receipt.json>
```

The current template fails before loading any adapter or contacting a network. The adapter's eventual implementation needs additional tests and review before this command may run. The prepared engine's 220-request bound covers tested A/B requests; the implementation must separately bound login, snapshot, preflight and control traffic before approval.

## Coverage qualifications

- AB-08 browser malformed-provider behavior is covered by preserved frontend mocks and new pure engine tests, **not hosted acceptance**. Foreign projected rows are an access error (403 in the existing adapter); malformed/null contracts are 502. This clarifies the shorthand in the preserved original TEST_PLAN without changing its sealed bytes.
- Browser query rejection, expired token behavior, invalid query bounds, additional role changes and any unimplemented native side-effect observation remain **NOT RUN** until explicitly added/verified. Do not claim all AB cases passed from this preparation.
- Auth/event logging assertions are not proof of historical log purging or platform debug-history retention.
- Preserve all 11 source failures: distance fallback; cargo validation ordering; timestamp references; create and confirm transaction boundaries; optional idempotency key; unenforced expiry; resource uniqueness; absent fencing; fixed OTP; premature OTP consumption. Weak atomic version enforcement and missing authoritative finance controls are **additional unresolved findings**, not extra passing tests.
- OMS, IMS, TMS, Verification and Finance agents stay inactive. Auth/read/CRM/payment release flags stay unchanged.
