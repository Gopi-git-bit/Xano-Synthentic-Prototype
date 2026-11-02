# Session 2 alignment — 0.1.1

This supplements 0.1.0; it does not replace the deployed customer contract. Xano recovery `0.1.1-draft` remains **NOT_DEPLOYED** with **zero installed resources and zero runtime tests**, as reported by the supplied receipt. No Xano workspace was accessed or changed by this review.

## Frontend and CI decision

Keep the existing registration denial, customer read gates, eight-state lifecycle, tenant projection and owner/admin/transition refusals. No new API is enabled. Existing frontend CI automatically includes `server/recovery-contract.test.mjs` via `npm run test:server`; no second workflow is needed. CI success means the quarantine and mocks work, not that the recovery proposal is valid or deployed.

`recovery-proposal.json` is a faithful JSON conversion of the receipt's YAML, retained as **unapproved evidence**, not a client-generation input. Duplicate-key parsing succeeds and the earlier duplicate components / const issues are corrected. This is not full OpenAPI certification. `review.json` records unresolved semantic and implementation blockers.

| Receipt change | Frontend disposition | Remaining dependency |
| --- | --- | --- |
| Registration returns no token; requires organization onboarding | Keep signup/register locally blocked | Verified onboarding transaction, verification policy and separate approved login |
| Support role removed | Continue rejecting unsupported identities | Actual backend delta D-1 remains unvalidated |
| Admin items/paging/projection envelope | Do not reuse customer page adapter | Approved explicit tenant/finance policy and observed serialization |
| Global auth/logistics servers plus x-api-group | No generated client | Operation-level server binding or split specifications |
| Financial item allOf with closed base and extension | Do not accept financial responses | Flatten the schema; validate representative base/financial payloads |
| Internal fences/dispatch removed from public API | Keep internal functions inaccessible | Atomic claim ownership and no browser retry inference |
| Transition POST with expected_version | Continue refusing all mutations | Implement D-3/D-4, confirm HTTP error mapping, all-writer fencing/atomicity |
| 84/85 inventory question | Supply export-handoff.json | Full current VFS identity/hash list; preserve crosswalk and drafts |

## Inventory handoff to Xano

`export-handoff.json` supplies all **84 published and 84 draft identities, paths and hashes**, plus the **41 changed identities** from the retained October 29 capture. Both captured sets contain 33 tables and omit the named crosswalk. This supports the crosswalk hypothesis, but cannot prove all 33 operational resources match the current VFS because Session 2 did not provide its full identity list. Compare the actual lists, not totals. This is historical evidence, not a fresh live export or permission to import.

## Corrections to receipt claims

Unchanged file count does not prove unchanged bytes or no writes. The stated 85-file census must not be described as independent write verification without before/after hashes. Likewise, a liveness check before deleting a lock does not eliminate the intervening race; P5 requires atomic ownership checks and stale-owner tests. Source-level CAS claims remain conditional on real database semantics, transaction boundaries and every writer using the same invariant.

The proposed four sandbox proof items are insufficient by themselves: retain independent physical database identity, restricted principal with workspace-3 denial, no live records/secrets, enforced provider/agent egress denial and lifecycle/expiry evidence. A different datasource name is neither necessary nor sufficient for separate physical storage. No provisioning or backend execution is authorized by this alignment.

## Next backend handoff

Use the supplied historical export inventory to produce a key-by-key VFS comparison. Correct per-operation servers and financial schema composition; preserve an explicit unapproved status for broadened admin policy. Resolve paging/timestamps/error semantics and uncoded D-1–D-4. Then establish the isolated target and approved test scope before installing or running anything. Do not ask for the historical export list again: it is included here.
