# Zippy Logistics — Milestone Evidence and Predecessor Chain

**Evidence snapshot:** 2026-10-30 (IST). **Current Xano status:** Stage P0 **NOT RUN**; Stage P **NOT APPROVED**.

This document is the mandatory evidence companion to [EXECUTION_TRACKER.md](EXECUTION_TRACKER.md). Review [DECISION.md](../DECISION.md) for scoped owner approvals and [SOUL.md](../SOUL.md) for durable engineering guardrails; use [AGENTS.md](../AGENTS.md) as the coding-agent entry point. Use both at the start and end of every ChatGPT/OpenCode milestone. The tracker describes *current work*; this ledger records *which prior stage it depends on, what was actually verified, and which gate still blocks progress*. **A passing Markdown check is not proof of live Xano authorization, tenant isolation, or production readiness.**

## Evidence chain and gate status

| Stage | Previous stage | Evidence actually available | Transition |
| --- | --- | --- | --- |
| B-HIST | Independent | [Historical PR #1](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/pull/1), offline code preparation; 0/31 hosted | Runtime blocked |
| FE-QA | Independent / parallel | [Frontend GitHub CI](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/actions/runs/40654010928) at 4c2e716a | Live integration blocked |
| W3-PRIVATE | B-HIST | Original local Git commit 61d1b139, checked private ZIP + ancestry; not pushed | Hosted acceptance blocked |
| W3-REVIEW | W3-PRIVATE | [Sanitized PR #4](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/pull/4) and source CI at d7cda3d | Review only |
| **W3-P0** | W3-REVIEW | **NOT RUN:** fresh read-only workspace-3 identity, RBAC, tenant capability | Read-only discovery allowed |
| W3-P | W3-P0 | **NOT RUN:** no isolated tenant; no scope/expiry proof | **Owner approval required** |
| W3-AB | W3-P (+ FE-QA) | **NOT RUN:** synthetic fixtures, native adapter and tenant-access tests | Separate fixture/test approval |
| W3-C | W3-AB | **NOT RUN:** rollback, idempotency, uniqueness, fencing, OTP and finance | Deterministic implementation + tests |
| W3-RELEASE | W3-C (+ FE-QA) | **NOT RUN:** live release and external provider integrations | Explicit production approval |

OpenCode's workspace-1 historical physical table discrepancy and source tests are **not** workspace-3 physical or runtime evidence. The original private 61d1b139 is **not** the sanitized GitHub d7cda3d commit.

## Required transition protocol

1. **Before a milestone:** read the matching record below. Confirm its `previous` and `source_ref` against the prior checkpoint. Recheck changed GitHub refs or Xano code/permissions rather than inheriting stale results.
2. **Execute only permitted work:** record actual target workspace/branch/tenant, identity and permission scope, test or GET-only command, date, expected and observed outcome, sanitized receipt hash and negative side-effect observation. Keep secrets, customer data and machine paths private.
3. **Before marking complete:** update `verification`, `gate`, `approval`, `approval_ref`, `runtime_evidence_refs` and `source_ref`. OpenCode must update [EXECUTION_TRACKER.md](EXECUTION_TRACKER.md) in the **same reviewable commit**.
4. **Approval boundary:** Stage P0 read-only inspection requires no new provisioning permission; Stage P tenant creation, credential issuance, preview/import and environment changes require owner approval. Stage AB fixture generation/testing requires **separate approval**. Stage C and release are further gated.
5. **Validate:** run `node --test scripts/validate-evidence-chain.cjs`. The validator checks continuity and obvious forbidden status transitions, *not* the truth of remote test receipts or GitHub links.
6. **On a new SHA, published Xano revision, permission or approval change:** mark dependent claims for revalidation. Do not silently upgrade previous source, offline or CI tests into hosted runtime passes. Preserve original failures and immutable private evidence.

## Machine-readable predecessor ledger

Maintain unique IDs and complete the current stage in order. This structured register is consumed by GitHub CI; it is not a substitute for a human review of proofs.

<!-- EVIDENCE_CHAIN_START -->
```json
{
  "schema_version": 1,
  "repository": "Gopi-git-bit/Xano-Synthentic-Prototype",
  "snapshot_ist": "2026-10-30",
  "records": [
    {
      "id": "B-HIST",
      "previous": null,
      "related": [],
      "as_of": "2026-10-30",
      "source_ref": "ed62038f571c02f339972ad7ec5d7cd1a9cffe18",
      "verification": "VERIFIED_GITHUB_SOURCE",
      "gate": "BLOCKED_RUNTIME",
      "approval": "NOT_APPLICABLE",
      "approval_ref": null,
      "evidence_scope": "Historical backend preparation; offline checks, no hosted M1 passes",
      "evidence_refs": [
        "https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/pull/1"
      ],
      "runtime_evidence_refs": [],
      "blocker": "0/31 hosted acceptance",
      "next_action": "Preserve historical evidence and verify downstream conditions"
    },
    {
      "id": "FE-QA",
      "previous": null,
      "related": [],
      "as_of": "2026-10-30",
      "source_ref": "4c2e716aaa90e5352e45474be45eb33488f584ac",
      "verification": "PASSED_CI",
      "gate": "BLOCKED_LIVE_INTEGRATION",
      "approval": "NOT_APPLICABLE",
      "approval_ref": null,
      "evidence_scope": "Frontend PR#2 CI passed; does not certify latest frontend live Xano reads",
      "evidence_refs": [
        "https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/actions/runs/40654010928"
      ],
      "runtime_evidence_refs": [],
      "blocker": "Live auth/read runtime missing",
      "next_action": "Preserve historical evidence and verify downstream conditions"
    },
    {
      "id": "W3-PRIVATE",
      "previous": "B-HIST",
      "related": [],
      "as_of": "2026-10-30",
      "source_ref": "61d1b139d27646187f7d4a52bcc6546e11b70a4c",
      "verification": "VERIFIED_PRIVATE_BUNDLE",
      "gate": "BLOCKED_HOSTED",
      "approval": "NOT_APPLICABLE",
      "approval_ref": null,
      "evidence_scope": "Original private Git ancestry and transfer ZIP independently checked; original source remains private",
      "evidence_refs": [
        "private:reconciliation.bundle#sha256=293a58f244b1abbea5f9d89e7b8fc0244788b32c98c4d380a5ef2b7a1edd450a"
      ],
      "runtime_evidence_refs": [],
      "blocker": "Current workspace-3 runtime acceptance missing",
      "next_action": "Preserve historical evidence and verify downstream conditions"
    },
    {
      "id": "W3-REVIEW",
      "previous": "W3-PRIVATE",
      "related": [],
      "as_of": "2026-10-30",
      "source_ref": "d7cda3d0cac0a53699ffd2e60d02eece1fe16abf",
      "verification": "PASSED_CI",
      "gate": "REVIEW_ONLY",
      "approval": "APPROVED_SANITIZED_REVIEW",
      "approval_ref": "Owner approved sanitized public review, 2026-10-30",
      "evidence_scope": "Sanitized 12 GUID-free refusal copies and source CI only; no live Xano operation",
      "evidence_refs": [
        "https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/pull/4"
      ],
      "runtime_evidence_refs": [],
      "blocker": "No Xano runtime import or proof",
      "next_action": "OpenCode execute W3-P0 read-only evidence capture"
    },
    {
      "id": "W3-P0",
      "previous": "W3-REVIEW",
      "related": [],
      "as_of": "2026-10-30",
      "source_ref": "NOT_ASSIGNED",
      "verification": "NOT_RUN",
      "gate": "READ_ONLY_ALLOWED",
      "approval": "NOT_REQUIRED_READ_ONLY",
      "approval_ref": null,
      "evidence_scope": "Fresh authenticated Xano workspace-3 permission/isolation/capability inspection not yet executed",
      "evidence_refs": [
        "https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/pull/3"
      ],
      "runtime_evidence_refs": [],
      "blocker": "Fresh authenticated Xano workspace-3 permission/isolation/capability inspection not yet executed",
      "next_action": "Return exact Stage P approval scope and evidence"
    },
    {
      "id": "W3-P",
      "previous": "W3-P0",
      "related": [],
      "as_of": "2026-10-30",
      "source_ref": "NOT_ASSIGNED",
      "verification": "NOT_RUN",
      "gate": "NOT_APPROVED",
      "approval": "NOT_APPROVED",
      "approval_ref": null,
      "evidence_scope": "Four-hour isolated tenant and one-hour restricted credential proposed only; owner approval pending",
      "evidence_refs": [
        "https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/pull/3"
      ],
      "runtime_evidence_refs": [],
      "blocker": "Four-hour isolated tenant and one-hour restricted credential proposed only; owner approval pending",
      "next_action": "After separate owner approval prove isolation and permissions"
    },
    {
      "id": "W3-AB",
      "previous": "W3-P",
      "related": [
        "FE-QA"
      ],
      "as_of": "2026-10-30",
      "source_ref": "NOT_ASSIGNED",
      "verification": "NOT_RUN",
      "gate": "NOT_APPROVED",
      "approval": "NOT_APPROVED",
      "approval_ref": null,
      "evidence_scope": "Separate synthetic fixture/test approval, native adapter and runtime negative/positive tests pending",
      "evidence_refs": [
        "https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/pull/4"
      ],
      "runtime_evidence_refs": [],
      "blocker": "Separate synthetic fixture/test approval, native adapter and runtime negative/positive tests pending",
      "next_action": "After separate owner approval run bounded synthetic A/B acceptance"
    },
    {
      "id": "W3-C",
      "previous": "W3-AB",
      "related": [],
      "as_of": "2026-10-30",
      "source_ref": "NOT_ASSIGNED",
      "verification": "NOT_RUN",
      "gate": "BLOCKED_IMPLEMENTATION",
      "approval": "NOT_APPROVED",
      "approval_ref": null,
      "evidence_scope": "Eleven draft source failures; no accepted transaction/assignment/OTP/finance/worker proof",
      "evidence_refs": [
        "https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/pull/4"
      ],
      "runtime_evidence_refs": [],
      "blocker": "Eleven draft source failures; no accepted transaction/assignment/OTP/finance/worker proof",
      "next_action": "Resolve controls and prove isolated rollback/concurrency"
    },
    {
      "id": "W3-RELEASE",
      "previous": "W3-C",
      "related": [
        "FE-QA"
      ],
      "as_of": "2026-10-30",
      "source_ref": "NOT_ASSIGNED",
      "verification": "NOT_RUN",
      "gate": "NOT_APPROVED",
      "approval": "NOT_APPROVED",
      "approval_ref": null,
      "evidence_scope": "Production, provider/finance and autonomous agent release prohibited pending separate approval",
      "evidence_refs": [
        "https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/pull/2"
      ],
      "runtime_evidence_refs": [],
      "blocker": "Production, provider/finance and autonomous agent release prohibited pending separate approval",
      "next_action": "Require explicit production release approval"
    }
  ]
}
```
<!-- EVIDENCE_CHAIN_END -->

## Mandatory Stage P0 evidence package

Before advancing W3-P0, OpenCode must return a **read-only** receipt stating actual Xano instance/workspace 3, source branch v1, authenticated principal's effective permissions (sanitized), current published/draft contracts, tenant/ephemeral inventory, and whether the platform supports isolated physical database identity, parent-live denial, noncopy of live records, credential expiry and provider egress restrictions. Identify which facts were proven vs only described in product documentation. **No tenant must be created in P0.**

The next transition W3-P must include a distinct owner Stage P approval, evidence of restricted access and live-denial/physical separation, expiry/recovery, no copied live records, no provider side effects, source manifest and actual tenant-scoped receipt identifiers. W3-AB then requires its *own* synthetic-fixture/test authorization. None of these approvals is inferred from the owner's separate approval of a sanitized public GitHub branch.

## Required new stage fields

`id`, `previous`, `related`, `as_of`, `source_ref`, `verification`, `gate`, `approval`, `approval_ref`, `evidence_scope`, `evidence_refs`, `runtime_evidence_refs`, `blocker`, `next_action`.

**Do not add a new stage without naming its previous milestone and whether the predecessor's blocker was resolved.** If `NOT_RUN` or `BLOCKED`, document the next permitted action rather than claiming completion.
