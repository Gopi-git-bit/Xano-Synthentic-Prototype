# SOUL.md — Zippy Logistics Project Charter

**Purpose:** A durable project charter for OpenCode, Codex, ChatGPT and other coding agents. This document defines Zippy's product intent and how agents should work. It is **not** an authorization to operate production systems or a substitute for evidence.

**Active repository:** `Gopi-git-bit/Xano-Synthentic-Prototype`  
**Canonical checkpoints:** [EXECUTION_TRACKER.md](docs/EXECUTION_TRACKER.md), [EVIDENCE.md](docs/EVIDENCE.md), [DECISION.md](DECISION.md)  
**First read:** [AGENTS.md](AGENTS.md)  
**Last charter review:** 2026-10-30 (IST)

## 1. Mission — what Zippy is

Build and safely operate a logistics booking and dispatch platform for India. A customer can request transport, discover suitable fleet capacity and track order status. Vehicle owners and authorized drivers receive and manage assigned jobs. Restricted administrators coordinate dispatch and compliance; finance personnel reconcile money with human approvals.

The target system combines order management (OMS), inventory/vehicle availability (IMS), transport management (TMS), verification/POD, finance and compliance. These are **business responsibilities**, not proof that autonomous agents or corresponding APIs are already deployed.

### Product experiences

- **Customer:** registration, profile, booking request, vehicle/cargo/route/schedule, payment choice and status, order history, support and notifications.
- **Vehicle Owner / Driver:** consolidated mobile experience for owners, fleet operators and salaried drivers, with role-bound availability, assigned work, accept/decline, progress and POD submission.
- **Admin (web):** restricted order/fleet/dispatch oversight, identity/permission control, exceptions, verification, finance views and audited broadcast/notification operations.
- A transport company may act as customer or vendor depending on a **specific transaction**; authorization is based on active organization membership and the role for that transaction, not display names.

## 2. Architecture boundary

- **Backend of record:** Xano workspace **3**, source branch **v1**. Its parent data source is labeled **live**. Do not confuse historical workspace-1 sandbox artifacts or the old `New-logistic-` repository with the current backend.
- **Frontend:** React, Vite, TypeScript and Tailwind on the frontend feature branch, delivered via Vercel. Preview implementations and mocked tests are **not** automatically proof of live Xano integration.
- **External services:** MapmyIndia for mapping, Razorpay for payment processing, Telnyx/email/SMS and messaging, Outlook receiving, Zoho CRM and planned WhatsApp integrations. Configuration does **not** establish end-to-end delivery, authorization or settlement.
- **GitHub:** source and review history; `main` does not automatically contain every frontend or backend review branch. Existing PRs must be reviewed independently.
- **Operational AI:** OMS, IMS, TMS, Verification and Finance/Compliance are **future audited assistants**, not autonomous operators now.

For current implementation, exact refs, test scope, active blockers and decisions, follow the checkpoint documents rather than assuming this charter is a live status report.

## 3. Non-negotiable operating principles

1. **Safety over speed.** Never trade tenant isolation, privacy, physical database integrity or correct accounting for a green test.
2. **Fail closed.** Missing identity, active membership, authorization, reliable distance, quote evidence, payment confirmation or response contract must block the operation, not produce an invented successful state.
3. **No silent live mutations.** Do not create/delete Xano tenants, modify permissions/schema/records, run imports, deploy releases, execute payments/refunds, message users, activate operational agents or merge PRs unless the specific operation and target are authorized. A broad instruction to “continue” is not a new approval.
4. **Human controls money and compliance.** AI may analyze, pre-screen or recommend. Refund approval and disbursement authority remain with authorized human Finance/Admin controls and an immutable audit trail; POD submission is not POD verification.
5. **Real tenant authorization.** Enforce roles, active organizations and resource ownership on the server; frontend route guards are UX, not security. A driver must not obtain another organization's records or restricted finance data.
6. **Idempotent, transactional workflows.** Booking, dispatch, reservation, consent, payment and refund transitions require authoritative identifiers, concurrency protection, expected-version predicates, audited rollback/replay and explicitly verified native behavior.
7. **Evidence before claims.** Label source review, offline tests, CI checks, metadata reads, authenticated hosted tests, physical constraints and provider delivery separately. **`NOT_RUN` remains `NOT_RUN`** until executed with verifiable receipts.
8. **Protect history and secrets.** Preserve sealed private evidence and Git ancestry; use sanitized public derivatives when necessary. Never commit credentials, private machine/account paths, customer information, raw admin permission maps or secret-bearing responses.
9. **Small, reversible increments.** Reuse existing code and tests, identify changed paths, avoid destructive migrations/force pushes and stop at a failed gate. Do not rewrite historical evidence to improve results.
10. **No fabricated completion.** Never count a source stub, prepared harness, simulated API response or passing CI as hosted, financial or production acceptance.

## 4. Roles and responsibility

| Actor | Permitted responsibility | Not automatically permitted |
| --- | --- | --- |
| Owner | Decide product scope and explicitly authorize named gated operations | A past review approval does not authorize a new tenant, data migration or release |
| OpenCode / Codex | Inspect, implement, test and document within approved workspace/ref | Use broad Xano admin credentials as app identities; bypass RBAC; push private evidence into public Git |
| ChatGPT / connected tools | Summarize and verify available facts, maintain reviews and documents | Claim Xano runtime verification without authenticated evidence |
| Admin / Dispatcher | Authorized logistics oversight and dispatch according to role | Unauthorized tenant access or arbitrary financial disbursement |
| Finance Manager / Compliance Officer | Human finance approval / independent compliance-POD verification | Delegating final approval to autonomous agents |
| Customer / Vehicle Owner / Driver | Role-and-resource-scoped app functions | Cross-organization access or unrestricted admin/financial data |

## 5. Definition of done

An item is **source ready** when the correct branch and implementation are pinned, source checks pass, and known deficiencies are disclosed. It is **integration verified** only when authorized identities, native Xano responses and negative isolation paths are observed. It is **release ready** only after separate owner approval, isolated rollback/concurrency/side-effect proofs, payment/compliance guardrails and production-relevant checks.

Every milestone must produce:

- Its previous stage ID, source SHA and unresolved predecessor limitations.
- Exact target and branch/workspace, actual tests and result counts, sanitized evidence links or receipt hashes.
- Approval reference for any external effect; explicit `NOT_RUN` for everything not executed.
- Updated [EVIDENCE.md](docs/EVIDENCE.md) **and** [EXECUTION_TRACKER.md](docs/EXECUTION_TRACKER.md) with the next permitted task.
- A [DECISION.md](DECISION.md) entry **only** if the owner adopts, defers, rejects or supersedes a material choice; preserve the original decision history.

**North star:** A reliable, auditable logistics operation that cannot leak organizations' data, double-assign scarce resources, misstate payment/POD status or allow an agent to exercise human-only financial authority.
