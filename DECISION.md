# DECISION.md — Zippy Logistics Decision Register

**Scope:** Durable decisions and explicit approval boundaries. **This is not a progress log or an authorization token.** Use [EXECUTION_TRACKER.md](docs/EXECUTION_TRACKER.md) for current work and [EVIDENCE.md](docs/EVIDENCE.md) for predecessor-linked proof. [SOUL.md](SOUL.md) explains project intent; [AGENTS.md](AGENTS.md) explains the agent workflow.

**Initial register:** 2026-10-30 (IST). Existing decisions below reflect recorded project direction and reviewed user actions. **Planned controls are marked `TARGET` and unapproved operations `PENDING` rather than pretending they have passed live validation.**

## Interpretation rules

- `ADOPTED_DIRECTION` = agreed target architecture/product boundary, not completed implementation.
- `APPROVED_SCOPED` = owner explicitly allowed the named, bounded action only; not permission for related follow-up operations.
- `PENDING` = requested or proposed, but not approved.
- `BLOCKED` = not permitted because safety, platform capability, evidence or authorization is missing.
- `TARGET` = desired behavior awaiting implementation/acceptance.
- `SUPERSEDED` = replaced by a later decision; historical record must remain.
- **Status and acceptance must be distinguished.** A decision says what we intend/permit; a test receipt proves what happened. Never relabel an implementation as complete simply because it appears here.

## Decision index

| ID | Decision / scope | State | Owner/record basis | Operational consequence |
| --- | --- | --- | --- | --- |
| ZD-001 | **Active project** is `Xano-Synthentic-Prototype`; historical `New-logistic-`/Paperclip/Odoo source is reference, not the active runtime control plane | ADOPTED_DIRECTION | Project reconciliation and active [GitHub repository](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype) | Do not resurrect legacy runtime without a new owner decision |
| ZD-002 | Xano workspace **3**, source **v1** is the current backend target; parent data source labeled `live` | ADOPTED_DIRECTION | Private workspace-3 reconciliation and [PR #3](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/pull/3) | Never default to workspace 1 or infer physical isolation from labels |
| ZD-003 | Frontend stack is **React + Vite + TypeScript + Tailwind** on the frontend feature branch, hosted via Vercel | ADOPTED_DIRECTION | [Frontend PR #2](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/pull/2) and feature branch source | Preserve implemented frontend and release gates; no uncontrolled rewrite |
| ZD-004 | Separate **Customer**, consolidated **Vehicle Owner / Driver**, and restricted **Admin** experiences; organization membership/resource scope governs access | ADOPTED_DIRECTION | Existing frontend handoff and product direction | No role injection, tenant leakage or driver access to unrelated finance records |
| ZD-005 | **Only sanitized workspace-3 public review** was expressly authorized and completed in [PR #4](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/pull/4). Exact original private Git history stays private | APPROVED_SCOPED | Owner approval 2026-10-30 and verified derived public commit `d7cda3d0cac0a53699ffd2e60d02eece1fe16abf` | No authority to publish raw private bundle or merge PR #4 |
| ZD-006 | Track milestones through [EXECUTION_TRACKER.md](docs/EXECUTION_TRACKER.md) and [EVIDENCE.md](docs/EVIDENCE.md), with predecessor/receipt/approval links | ADOPTED_DIRECTION | User-directed project tracker and [draft PR #5](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/pull/5) | Every completed milestone updates both; use validator; no retroactive fake pass |
| ZD-007 | **Stage P0** permits only authenticated *read-only* workspace-3 capability/permission discovery | APPROVED_SCOPED | User-directed P0 prompt and private OpenCode report | No tenant creation, token issuance, preview/import or fixture writes |
| ZD-008 | **Stage P** proposal: one four-hour workspace-3 ephemeral tenant, owner-scoped one-hour restricted credential, independent parent-live denial/physical DB/no-copy/egress proofs | PENDING | [Stage P gate](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/pull/3); OpenCode P0 report supplied 2026-10-30 | No provisioning until separate owner authorization **and** verified feasible platform controls |
| ZD-009 | **Stage F/AB** synthetic fixtures and application acceptance require distinct later approvals | PENDING | [Evidence chain](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/pull/5) and private acceptance plan | No fixture seeding, login/test writes or mutation refusal runtime calls yet |
| ZD-010 | **Stage C** transactions, assignment/worker fencing, idempotency, consent/OTP, finance, POD and agents stay disabled pending native proof | BLOCKED | [Sanitized M1 review](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/pull/4) | No activation or assumption of 31-case hosted acceptance |
| ZD-011 | Refund authorization/disbursement remains **human controlled** with immutable audit; driver POD submit is distinct from independent verification | TARGET | Project governance and preserved backend design | Never give operational agents refund-approval authority or make POD submission close delivery |
| ZD-012 | Razorpay, Telnyx, Outlook, Zoho CRM and MapmyIndia are planned integrations; configuration is not proven end-to-end acceptance | TARGET | Existing project integration handoffs | Verify approved sandbox/provider delivery and security before live workflows |
| ZD-013 | **Production live release, payment/refund operations, provider messaging, agent activation and PR merges** require separate explicit approval | BLOCKED | Owner governance and current [tracker](https://github.com/Gopi-git-bit/Xano-Synthentic-Prototype/pull/5) | Neither this register nor a passed source check authorizes release |
| ZD-014 | **Current Xano Essential restrictions** are unresolved; tenant-only RBAC/live-denial, empty bootstrap, physical identity, provider egress and JWT expiry/invalidation need supported proof | PENDING | OpenCode `docs/XANO_M1_ISOLATED_TEST_READINESS.md`, supplied 2026-10-30; no current public receipt | Obtain platform/owner capability decision before Stage P; do not auto-upgrade plan |
| ZD-015 | The reported **Stage P0 completion** must be reconciled against private receipts before the shared tracker/evidence state advances | PENDING | OpenCode 2026-10-30 report; draft PR #5 still records `W3-P0: NOT_RUN` at this snapshot | Commit verified private continuation, sanitize handoff and update evidence + tracker together |

| ZD-016 | New private Stage P0 continuation SHA 55d4dd278602c5a81706db70d91b53ca363f4d9c and sanitized handoff ZIP SHA-256 da33dc5e6cdb2702246653603ecddf6ee3c5ed601cc165e5bef24fd808cc3130 are **REPORTED** from OpenCode. Canonical Stage P0 remains pending independent receipt review and supported platform isolation answers; Stage P NOT APPROVED | PENDING | OpenCode report supplied 2026-10-30; [W3-P0 evidence](docs/EVIDENCE.md) | Verify private receipts and structural CI; obtain Xano platform capability before requesting separate Stage P approval |

| ZD-017 | Stage P0 private receipt and Git ancestry integrity was independently rechecked through authorized remote device; all seven ZIP files and 12 Git receipt hashes matched. Status upgraded **only** to VERIFIED_READ_ONLY for preserved P0 evidence, not new live Xano tests. No Stage P entitlement, isolation proof or owner approval was gained. | ADOPTED_DIRECTION | 2026-10-30 Git receipt inspection, original private commit 55d4dd278602c5a81706db70d91b53ca363f4d9c, [W3-P0 evidence](docs/EVIDENCE.md) | Continue supported Xano Essential capability confirmation; Stage P remains NOT_RUN / NOT_APPROVED |

### Explicitly NOT approved

Approval to create a sanitized public review does **not** authorize: (1) uploading the original Git bundle, (2) merging PRs, (3) granting broader Xano permissions, (4) creating any tenant/credential, (5) importing 59 definitions, (6) creating fixture users/bookings, (7) sending notifications, (8) running financial transactions, or (9) production deployment.

No code agent may infer approval from a `README`, a task description, a proposed CLI command or a successful preview. Ask the owner for the **exact target, scope, duration and operation** when an approval gate is reached.

## Decision change protocol (append-only)

Before editing a material rule, create a new `ZD-###` entry rather than silently rewriting the older decision. Include:

- Date (IST), actor/owner and authority (confirmed owner direction vs proposed engineering recommendation).
- Existing decision ID and exact change / supersession relationship.
- Why the decision is needed and considered alternatives (including leaving the gate blocked).
- Affected repo branch, Xano workspace/tenant, source SHA, data source, external providers and release flags.
- Scope allowed and **explicitly excluded** actions, time limit and rollback/cleanup obligations.
- Supporting evidence/issue/PR or **private receipt identifier** (never raw credentials).
- Effect on [EVIDENCE.md](docs/EVIDENCE.md) stage gate and [EXECUTION_TRACKER.md](docs/EXECUTION_TRACKER.md) next task.

### Pending decision queue (not approvals)

| Queue | Question requiring explicit decision | Prerequisite |
| --- | --- | --- |
| PQ-01 | Does this instance support tenant-only restricted identity and no parent-live read/write access with documented, observable enforcement? | Xano support/product capability and fresh Stage P0 evidence |
| PQ-02 | Can an ephemeral tenant be created without parent records/secrets and with independent physical database identity and safe expiry? | Supported platform evidence, owner Stage P scope |
| PQ-03 | Can provider egress, task/agent scheduling and cross-tenant app JWT use be blocked and observed? | Native capabilities and independent checks |
| PQ-04 | Keep 86,400-second application JWT with verified destruction/isolation, or approve a separate isolated-only shorter-TTL source change? | Technical evidence + exact source delta approval |
| PQ-05 | Stage F/AB synthetic records and runtime acceptance traffic: exact roles, fixture bounds, observer authority and time window | Stage P isolation accepted, separate owner approval |
| PQ-06 | Production release / merges / financial and autonomous agent activation | Accepted P, F/AB, C controls and independent production decision |

## Relationship to project documents

| File | Question it answers |
| --- | --- |
| [SOUL.md](SOUL.md) | Why the product exists and which engineering guardrails are durable |
| **DECISION.md** | What scope has been adopted, proposed, approved, rejected or superseded |
| [EXECUTION_TRACKER.md](docs/EXECUTION_TRACKER.md) | What is done, blocked, who owns the next task, and the current stage |
| [EVIDENCE.md](docs/EVIDENCE.md) | What evidence supports a transition and how it links to the predecessor |
| [AGENTS.md](AGENTS.md) | What every code agent should read/check before operating |

**Important:** These files complement rather than overwrite source control, authenticated Xano state, signed test receipts or the owner's explicit approval.
