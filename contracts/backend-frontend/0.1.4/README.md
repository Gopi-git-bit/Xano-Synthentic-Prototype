# Xano receipt integration review 0.1.4

Status: NOT_DEPLOYED. This is a review of the user-supplied Xano 0.1.4-draft receipt, not acceptance of a native endpoint. It adds truthful gateway capability reporting; no agent route, backend binding, review mutation or release switch is introduced.

## Implemented frontend boundary

`GET /api/status` now returns `assessmentsAvailable: false` and `assessmentReviewAvailable: false`. Client types match. Existing authentication and booking configuration cannot enable these capabilities. Booking writes and delivery remain false. A test checks this without any upstream calls.

Existing server-only configuration names are `XANO_AUTH_BASE_URL`, `XANO_LOGISTICS_BASE_URL`, `XANO_AUTH_RELEASE` and `XANO_BOOKING_READS_RELEASE`. There is no existing agent base URL or agent credential setting. Do not repoint shared preview values. An independently verified test target and reviewed endpoint contract must precede new configuration. `EVIDENCE_ID_SALT` is a proposed backend-only dependency, not a frontend setting.

## Receipt reconciliation

| Item | Evidence in receipt | Remaining correction / verification |
|---|---|---|
| Safety files | Reports 10/14 read: eight unconditional throws, one conditional, one comment-only | Four source bodies remain unread; no independent current-source/runtime proof |
| Admin scope | Membership check now applies to super_admin | Projection still exceeds the agreed minimal fields; active customer/both organization type not checked. Review before exposing |
| Pagination | Corrected ceiling formula | Actual `.items` response remains unobserved; stable tie-break sort and count/list consistency need runtime tests. Receipt's previous-result value for 25/25 is also incorrect: old formula gives ceil(49/25)=2 |
| Progression | Only start/deliver/close; membership and version checked inside transaction | `db.get` is not proven row locking. Actor status is read outside transaction; organization status and trip/POD/business prerequisites are absent. Legacy writers still bypass version discipline |
| Command response | Re-read after commit | Another transaction can change the response before this read. `from_status` uses an earlier advisory read. Return the committed command result through verified transaction semantics; do not infer command success from a later version |
| Snapshot digest | Tenant and projection included | `json_encode` alone does not establish canonical key/number ordering. Raw hash output differs from envelope's `digest:` prefix. Test deterministic serialization and multi-row consistent snapshots; hashing is not authorization or proof of atomic freshness |
| Digest test | Named 'same projection yields same digest' | Only checks defined output, not equality, changed-input inequality or tenant separation |
| Key version | String type with YAML enum `[1.0]` | Quote `"1.0"`; numeric enum conflicts with string type |
| Human review | Envelope requires literal true | Each recommendation still allows false. Enforce literal true at both levels |
| Evidence references | 16-hex salted hash and reverse mapping proposed | Reverse mapping alone does not handle collisions. Define uniqueness, collision rejection/regeneration, tenant/snapshot binding and key rotation. Prefer reviewed keyed derivation rather than an ad hoc salted concatenation |
| Evidence types | `compliance_document` contract label | Explicitly map to exported `compliance_documents`; do not infer table identifiers from browser input |
| Bounds | Recommendations/evidence capped | Bound status reasons, review reasons and all string/overall response sizes; define per-agent evidence/recommendation relationships |
| Acknowledgement | Proposed status flip | No installed table/route, authorization contract, immutable snapshot binding or transactional stale check. No frontend mutation may be enabled |

## Exact integration dependency

The Xano session reports workspace 3 only, no independent target or runtime tool, zero installed resources and zero runtime tests. It also cannot read repository attachments. Supply the pinned files through a channel that session can actually read, or paste the necessary contract directly. Repeating a filename is not evidence of delivery.

Next backend handoff must contain the isolated target evidence, actual installed identity/read/assessment paths and API groups, validated response/error examples, actor/tenant rules, source revision and executed test logs. Resolve RACE-12/13/14 before exposing any commands. No provider calls, live operations or workspace-3 modifications are authorized.
