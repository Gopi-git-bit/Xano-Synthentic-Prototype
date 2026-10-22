# Zippy Logistics: Business Operations and Five-Agent Alignment Report

Version: 1.0.0-review | Date: 22 October 2026 | Status: review-ready, not deployment approval

## 1. Executive conclusion

Zippy's durable business is to arrange suitable transport, coordinate a reliable shipment, preserve proof of what happened and close the financial obligations. The agents support this business; they are not the business rules or the database of record.

The owner confirmed the five agents for this report on 22 October 2026: **OMS, IMS, TMS, Verification and Finance/Compliance**. This resolves the agent naming/topology question. It does not approve conflicting state graphs, tariffs, tax treatments, payout authority, production settings or a migration.

The recommended design is five bounded intelligence components above deterministic services. OMS coordinates the order case; IMS proposes suitable resources; TMS coordinates physical execution; Verification assesses evidence; Finance/Compliance prepares and reconciles money/compliance workflows. A shared policy gateway, transactional state/reservation/finance services, audit/outbox, notifications and human review enforce every consequence. They are supporting controls, not an extra autonomous agent roster.

**Deployment recommendation: do not enable production autonomous mutations from this documentation alone.** Resolve the decision register, implement the controls and demonstrate the acceptance cases on an isolated actual Xano target. Existing test claims or successful connectivity do not prove these five agents are safe or complete.

## 2. Evidence scope and how to read this report

Primary evidence is the Obsidian repository pinned to commit `4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5` (26 August 2026). Its complete tree contains 521 blobs and 449 Markdown files. We inventoried the tree and selectively read the relevant business, lifecycle, governance, finance, scenarios, SOP and sample-runtime sources. We did not review every line of every repository file or test a deployed system. The source coverage manifest accompanies the package: 92 selected source files, all 23 operational scenario files mapped, and one marketing scenario file explicitly excluded from operational coverage. The final acceptance suite defines 70 unrun tests.

The repository mixes dated policy notes, research, illustrative code and multiple technology generations. Even a file named “Current Architecture Source of Truth” contains older FastAPI claims while the latest commit moves sample code to Supabase/DeepSeek Harness. Thus “active,” “locked,” “verified” and “approved” labels inside source files are evidence of their authors' intent, not proof of current production approval or runtime behavior. This report is for a Xano implementation because the owner requested it, not because the historical repository proves Xano equivalence.

Evidence classifications:
- **User-confirmed:** five-agent names and Xano handoff purpose.
- **Documented baseline:** a source-backed business/control requirement, subject to listed conflicts.
- **Proposed specification:** a precise design or test added to make implementation safe and testable; requires adoption.
- **Open decision:** conflicting or missing policy. The relevant feature remains disabled or held until approved.
- **Observed static code finding:** a property of the pinned sample source, not a tested exploit or the current Xano runtime.

Precedence for this deliverable: explicit current owner instruction for scope/topology; documented governance prohibitions for safety boundaries; source-backed durable business rules; explicit resolution of contradictory policy; implementation proposals last. A later source date alone is not permission to silently overwrite another policy. No historical claim of tax legality is endorsed here.

## 3. Business definition before agents

### 3.1 Customers, providers and value exchange

Demand side: individual/unorganized consignors and organized businesses needing reliable freight movement. Supply side: independent drivers/owner-drivers, vehicle owners and transport companies with eligible capacity. A consignee receives goods and may be a separate payer only under an explicit arrangement. Ops supervises execution and admin governs exceptions.

Zippy's documented standard marketplace model is an asset-light arranging/broker model. It captures a shipment requirement, finds and coordinates a suitable provider, makes progress observable, collects delivery evidence and coordinates billing/settlement. The commercial value is less failed dispatch, fewer follow-up calls, better vehicle fit, clearer accountability and faster evidence-backed closure. It is not simply “AI finds the cheapest truck.”

A transport company may buy capacity as a customer and sell capacity as a provider in different transactions. Keep business identity separate from the active per-order role. Never infer that every transport-company user may see all orders or authorize both sides of a transaction. Warehouse inventory management is not the default meaning of IMS in this project; IMS means resource/vehicle/driver inventory and matching.

### 3.2 Initial operating boundary

Use a corridor-first road-freight scope with explicit serviceability, cargo class, vehicle class and service promise. Tamil Nadu is the business focus; some source documents extend launch corridors into Karnataka. The specific first corridor, FTL/PTL boundary and supported cargo classes still need owner confirmation. PTL consolidation, dangerous goods, cold chain, multimodal guarantees, own-fleet priority, credit products and embedded finance must not activate merely because a research scenario mentions them.

A return/backhaul or triangle opportunity can improve utilization only if it respects each order's capacity, timing, evidence and finance boundaries. Do not guarantee return cargo or price a current commitment on an unconfirmed future load.

### 3.3 Business economics

For the documented standard broker model, revenue is the earned commission/platform fee, not the entire freight collection. Customer collection, carrier payable, tax, unearned fee and earned revenue must remain distinct. Pricing control and contractual responsibility can alter principal/agent classification; legal/accounting review is a launch gate, not an LLM decision.

No commission percentage, cancellation fee, detention tariff or tax rate is approved by this report. The source contains inconsistent examples, including ₹50,000 collection allocated to ₹45,000 provider + ₹5,000 fee + ₹900 tax, totaling ₹50,900. That cannot be copied as a balanced accounting fixture. Approve the inclusive/exclusive basis and reconcile all amounts before coding finance examples.

Commercial success should be measured as repeat customer usage and contribution per successfully closed order after provider/payment/support/exception costs, alongside on-time execution and evidence quality. AI response count and raw bookings are not sufficient business outcomes.

### 3.4 Core operating loop

1. Capture a request and authenticate the relevant actor.
2. Validate parties, serviceability, cargo, vehicle need, documents and timing.
3. Produce an auditable deterministic quote and service promise.
4. Resolve payer, consent and the policy-defined payment/credit gate.
5. Match eligible capacity, obtain valid provider acceptance and atomically reserve/assign.
6. Verify pickup, documents, loading and custody; authorize dispatch through the approved gates.
7. Track movement, protect the original promise and handle incidents without bypassing controls.
8. Capture and verify delivery/POD/recipient evidence.
9. Reconcile collection, invoice, claims, provider payable and settlement approvals.
10. Execute approved settlement/refund commands through services, reconcile provider outcomes and close the order.
11. Learn from outcomes through reviewed policy changes, not autonomous production rule rewriting.

The customer sees persisted results, not an agent's speculative text. Physical delivery, document acceptance, payment and financial closure are separate milestones.

## 4. Business rule catalogue

### BR-01: Arranger business model
For the documented standard marketplace model, Zippy coordinates transport performed by an independent provider. Separate arranging obligations from carriage obligations. Contractual principal/agent classification requires transaction-specific professional review; do not infer it solely from truck ownership.

Classification: `documented_baseline_with_legal_review`. Sources: [SRC-ACCOUNTING](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Accounting%20Policy%20Engine%20for%20Broker%20Model.md); [SRC-TRUTH](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/00_System/Current%20Architecture%20Source%20of%20Truth.md)

### BR-02: Per-order actor roles
Identify customer/booker, consignor, consignee, payer, provider, driver and vehicle separately. A transport company can be customer on one order and provider on another; enforce the active role and related-order scope, not a universal customer/vendor identity.

Classification: `documented_baseline`. Sources: [SRC-ROLES](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/00_System/Role%20and%20Permission%20Matrix%20for%20Current%20Project.md); [SRC-LIFECYCLE](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_Concepts/Operations/Order%20Lifecycle.md)

### BR-03: Corridor-first serviceability
Treat A-to-B and B-to-A as different directed lanes with separate capacity, rates, pickup windows and service promises. A return load is an opportunity, never a guaranteed offset to the current obligation.

Classification: `documented_baseline`. Sources: [SRC-TRUTH](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/00_System/Current%20Architecture%20Source%20of%20Truth.md); [SRC-GOV](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Agent%20Governance%20and%20Operating%20Model%20for%20Current%20Project.md)

### BR-04: Booking completeness
Require identity/authorization, contacts, geocoded pickup and delivery, time windows, cargo type/weight/dimensions, handling constraints, requested vehicle class, payer and payment mode. Missing safety-critical facts keep a draft or hold; AI must not invent them.

Classification: `documented_baseline_plus_data_contract`. Sources: [SRC-LIFECYCLE](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_Concepts/Operations/Order%20Lifecycle.md); [SRC-API](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/00_System/API%20and%20Event%20Contract%20for%20Current%20Project.md)

### BR-05: Eligibility before commitment
Validate lane coverage, cargo legality/handling capability, capacity and vehicle suitability, provider/driver/vehicle eligibility and payment/consent readiness before committing an executable order. A low price cannot override a hard eligibility failure.

Classification: `documented_baseline`. Sources: [SRC-LIFECYCLE](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_Concepts/Operations/Order%20Lifecycle.md); [SRC-GOV](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Agent%20Governance%20and%20Operating%20Model%20for%20Current%20Project.md); [SRC-MATCH](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/05_Algorithms/Matching/IMS%20Matching%20Engine.md)

### BR-06: Deterministic commercial quote
A versioned pricing service calculates and snapshots the customer quote, provider payable basis, Zippy fee, applicable tax policy reference, expiry and SLA. An LLM explains or requests recalculation but cannot set rates, tax rules or discounts. A changed quote requires applicable consent before execution.

Classification: `documented_baseline_plus_versioning_control`. Sources: [SRC-TRUTH](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/00_System/Current%20Architecture%20Source%20of%20Truth.md); [SRC-GOV](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Agent%20Governance%20and%20Operating%20Model%20for%20Current%20Project.md); [SRC-PRICE](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/05_Algorithms/Pricing/Dynamic%20Pricing%20Logic.md)

### BR-07: Independent payment truth
Separate order state, consent, payment intent/attempt, verified collection, invoice, payable, refund and settlement. A screenshot, client callback, chat promise or agent conclusion is not proof of collection. Verify provider evidence and reconcile.

Classification: `documented_baseline`. Sources: [SRC-API](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/00_System/API%20and%20Event%20Contract%20for%20Current%20Project.md); [SRC-FINANCE](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Finance%20and%20Invoice%20Event%20Layer%20for%20Logistics%20Platform.md); [SRC-ACCOUNTING](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Accounting%20Policy%20Engine%20for%20Broker%20Model.md)

### BR-08: Explicit ToPay responsibility
Record authenticated consignee payer consent, amount/quote binding and attempt history. Denial redirects responsibility to consignor: pay, cancel through allowed path, or hold. Consent alone never proves payment; approved-credit timing remains an owner decision.

Classification: `conflicted_policy_requires_DEC_03`. Sources: [SRC-STATE](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/07_State_Machine.md); [SRC-API](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/00_System/API%20and%20Event%20Contract%20for%20Current%20Project.md); [SRC-SOP](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/00_System/Zippy%20Logistics%20SOP%20Operating%20System.md)

### BR-09: Atomic allocation
Eligible candidate ranking is advisory. The reservation/assignment service must recheck availability and compatibility at commit and atomically enforce one active assignment per order and nonoverlapping vehicle/driver capacity. Timeout, rejection and expiry must not leave multiple winners.

Classification: `documented_baseline_plus_strengthened_concurrency_control`. Sources: [SRC-GOV](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Agent%20Governance%20and%20Operating%20Model%20for%20Current%20Project.md); [SRC-INTEGRATION](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Autonomous%20Agent%20Integration%20Blueprint.md); [SRC-MATCH](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/05_Algorithms/Matching/IMS%20Matching%20Engine.md)

### BR-10: Pickup and transit evidence
Do not substitute agent inference for authenticated arrival, loading inspection, required documents and movement evidence. Detect stale GPS, delays, deviation and breakdown; preserve last-known timestamps and confidence without fabricating live tracking.

Classification: `documented_baseline`. Sources: [SRC-LIFECYCLE](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_Concepts/Operations/Order%20Lifecycle.md); [SRC-SOP](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/00_System/Zippy%20Logistics%20SOP%20Operating%20System.md)

### BR-11: Delivery is not just an upload
POD upload, POD verification, recipient OTP (alternate evidence is proposed, default disabled and subject to DEC-11 approval), physical delivery and settlement eligibility are separate facts. Low-quality, mismatched or missing evidence blocks relevant completion/revenue/payout gates.

Classification: `documented_baseline`. Sources: [SRC-STATE](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/07_State_Machine.md); [SRC-API](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/00_System/API%20and%20Event%20Contract%20for%20Current%20Project.md); [SRC-ACCOUNTING](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Accounting%20Policy%20Engine%20for%20Broker%20Model.md); [SRC-FINANCE](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Finance%20and%20Invoice%20Event%20Layer%20for%20Logistics%20Platform.md)

### BR-12: Order-level money and evidence
Keep order-level commission, liabilities, claims and settlement even when transport legs form return or triangle loops. Never net unrelated obligations or let route-loop metadata skip lifecycle gates.

Classification: `documented_baseline`. Sources: [SRC-GOV](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Agent%20Governance%20and%20Operating%20Model%20for%20Current%20Project.md); [SRC-RETURN](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_Concepts/Operations/Reverse%20Logistics%20and%20Return%20Policy%20Framework.md); [SRC-ACCOUNTING](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Accounting%20Policy%20Engine%20for%20Broker%20Model.md)

### BR-13: Net fee economics
Documented broker revenue is earned commission plus platform/service fee, excluding tax and carrier pass-through. Cash collected is not automatically revenue. Every balance must reconcile; the source example allocating 50,900 from 50,000 must not become a fixture.

Classification: `documented_baseline_with_accounting_approval`. Sources: [SRC-ACCOUNTING](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Accounting%20Policy%20Engine%20for%20Broker%20Model.md)

### BR-14: Hold release requires resolving evidence
A hold has reason, owner, allowed remediation, opened time and explicit release evidence. A timeout, confidence score or generic supervisor approval cannot erase an unresolved fraud, payment, document, dispute or custody problem.

Classification: `documented_baseline`. Sources: [SRC-STATE](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/07_State_Machine.md); [SRC-INTEGRATION](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Autonomous%20Agent%20Integration%20Blueprint.md); [SRC-FINANCE](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Finance%20and%20Invoice%20Event%20Layer%20for%20Logistics%20Platform.md)

### BR-15: Refund recommendation is not execution
Agents assemble evidence and calculate policy-based recommendations. Human approval is required for refunds under the requested project safety baseline; the execution service verifies approved amount, beneficiary, original transaction and remaining refundable balance. Unknown provider outcomes require reconciliation before retry.

Classification: `conservative_proposed_release_control`. Sources: [SRC-GOV](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Agent%20Governance%20and%20Operating%20Model%20for%20Current%20Project.md); [SRC-SOP](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/00_System/Zippy%20Logistics%20SOP%20Operating%20System.md)

### BR-16: Cancellation and return are distinct
Cancellation eligibility and charges depend on lifecycle stage and approved policy; no invented fee. Once cargo is in custody, use incident/return/reattempt handling, not a silent reverse transition. A reverse movement has its own linked order, responsible party and evidence.

Classification: `documented_baseline_with_state_conflict`. Sources: [SRC-STATE](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/07_State_Machine.md); [SRC-RETURN](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_Concepts/Operations/Reverse%20Logistics%20and%20Return%20Policy%20Framework.md); [SRC-SOP](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/00_System/Zippy%20Logistics%20SOP%20Operating%20System.md)

### BR-17: Minimal data exposure
All records and tools are tenant/order/role-scoped. Reveal contacts only at required execution stages. Do not place passwords, tokens, OTP values, full identity documents or unnecessary customer data in model context or ordinary audit logs.

Classification: `documented_scope_plus_security_design`. Sources: [SRC-ROLES](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/00_System/Role%20and%20Permission%20Matrix%20for%20Current%20Project.md); [SRC-GOV](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Agent%20Governance%20and%20Operating%20Model%20for%20Current%20Project.md)

### BR-18: Backend truth before notification
Persist a verified domain result and its audit/outbox record before publishing status. Notifications communicate facts and next steps; delivery receipts do not mutate order or payment truth.

Classification: `documented_baseline`. Sources: [SRC-API](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/00_System/API%20and%20Event%20Contract%20for%20Current%20Project.md); [SRC-INTEGRATION](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Autonomous%20Agent%20Integration%20Blueprint.md)

### BR-19: Human exceptions without hidden superusers
Ops may execute bounded approved recovery; admin reviews exceptional overrides and finance/dispute decisions. Every override is scoped, reasoned, time-bounded and audited; no direct DB editing or bypass of non-overridable safety rules.

Classification: `documented_baseline`. Sources: [SRC-ROLES](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/00_System/Role%20and%20Permission%20Matrix%20for%20Current%20Project.md); [SRC-GOV](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Agent%20Governance%20and%20Operating%20Model%20for%20Current%20Project.md); [SRC-SOP](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/00_System/Zippy%20Logistics%20SOP%20Operating%20System.md)

### BR-20: Measured improvement, controlled policy release
Feed completed-trip outcomes into lane reliability, carrier scoring, ETA and quote calibration. Agents may propose changes; owner-reviewed versioned policy release, backtesting and rollback prevent silent production self-modification.

Classification: `documented_baseline_plus_release_design`. Sources: [SRC-TRUTH](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/00_System/Current%20Architecture%20Source%20of%20Truth.md); [SRC-GOV](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Agent%20Governance%20and%20Operating%20Model%20for%20Current%20Project.md); [SRC-TEST](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/00_System/Testing%20and%20Verification%20Strategy%20for%20Current%20Project.md)

## 5. Ownership and harmony across the order lifecycle

| Business stage | Coordinating agent | Required contributions | Who commits the consequence |
|---|---|---|---|
| Intake/quote | OMS | Verification: facts/documents; Finance/Compliance: quote/payment rules; IMS: capacity feasibility | Booking/quote service |
| Consent/payment readiness | OMS | Finance/Compliance: verified financial gate; Verification: identity/evidence | Consent/payment service and order transition service |
| Search/reserve/assign | IMS | Verification: current eligibility; Finance/Compliance: commercial fit; OMS: actionable order | Reservation/assignment service, after authenticated provider acceptance |
| Pickup/loading/dispatch | TMS | Verification: documents/inspection; Finance/Compliance: movement gate; OMS: legal progression | Trip/transition service |
| Transit/incident | TMS | IMS: replacement capacity; Verification: new evidence; OMS: recovery case; Finance/Compliance: financial hold | Incident/trip/reservation services with required human review |
| POD/delivery | TMS | Verification: POD/recipient validation; OMS: completion gate; Finance/Compliance: no premature release | Evidence and transition services |
| Invoice/settlement/refund | Finance/Compliance | Verification: evidence validity; TMS: trip facts; OMS: case status; human reviewer: required approval | Finance execution and reconciliation services |
| Closure/learning | OMS | Finance/Compliance: financial completion; all: unresolved-case check | Closure service; reviewed analytics/policy pipeline |

Harmony means shared facts, single-writer services and explicit dependencies, not agents chatting until they agree. An agent recommendation cannot authorize another agent to bypass a service gate. Contradictory assessments produce a hold/review case; a high confidence score never wins over a mandatory constraint.

## 6. Five agent role summaries

### OMS: Order Management Agent
Maintain a complete, coherent order case and coordinate the next legal workflow action.

Responsibilities: booking completeness and clarification; order lifecycle coordination; quote/payment/consent/matching handoff; customer-visible blocker explanation; cancellation and reverse-order coordination.

Must not: direct state or ledger writes; inventing cargo facts or customer consent; confirming on unverified payment; assigning vehicles itself; issuing refunds or changing tax/fees.

Production behavior: Keep the last persisted truth. Deduplicate unchanged clarification requests; ask again when corrected or new information creates a different requirement, classify ambiguity, and open an owned review/hold rather than looping or promising a vehicle. Deterministic validation and workflow services remain usable with AI disabled; ops handles semantic ambiguity.

Sources: [SRC-LIFECYCLE](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_Concepts/Operations/Order%20Lifecycle.md); [SRC-GOV](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Agent%20Governance%20and%20Operating%20Model%20for%20Current%20Project.md); [SRC-API](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/00_System/API%20and%20Event%20Contract%20for%20Current%20Project.md)

### IMS: Inventory and Matching Agent
Find suitable, available transport capacity without double-booking or compromising hard constraints.

Responsibilities: vehicle/driver/provider capacity interpretation; hard-constraint eligibility filtering; candidate scoring and explainable alternatives; offer/reservation orchestration requests; backup/partner/return-load suggestions.

Must not: LLM-only allocation; overriding capacity or restricted cargo; accepting on behalf of an unconsenting provider; double-booking driver or vehicle; silently raising price or cross-order netting.

Production behavior: Use bounded candidate retries; stale availability triggers refresh. Reservation conflict means re-evaluate next candidate, not blind replay or hidden capacity override. Deterministic hard filters and approved ranking rules; exhausted pool goes to ops with candidates rejected and reasons.

Sources: [SRC-GOV](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Agent%20Governance%20and%20Operating%20Model%20for%20Current%20Project.md); [SRC-MATCH](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/05_Algorithms/Matching/IMS%20Matching%20Engine.md); [SRC-INTEGRATION](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Autonomous%20Agent%20Integration%20Blueprint.md)

### TMS: Transportation Management Agent
Monitor and coordinate safe physical execution against the accepted shipment promise.

Responsibilities: route/ETA recommendations; pickup/loading/transit/delivery milestone interpretation; GPS freshness and route deviation; delay/breakdown/failed-delivery incident classification; backup route and linked reverse/reattempt proposals.

Must not: claiming GPS is live when stale; changing promised windows to hide breach; reassigning without IMS reservation workflow; deciding payout or tax; declaring delivery from geofence alone; giving unsafe instructions to meet SLA.

Production behavior: Mark telemetry stale; do not fabricate ETA. Open a severity-scoped incident; separate operational safety from commercial compensation and escalate immediately where required. Driver/ops authenticated milestone reporting and deterministic SLA timers; manual tracking is labeled as such.

Sources: [SRC-LIFECYCLE](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_Concepts/Operations/Order%20Lifecycle.md); [SRC-GOV](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Agent%20Governance%20and%20Operating%20Model%20for%20Current%20Project.md); [SRC-SOP](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/00_System/Zippy%20Logistics%20SOP%20Operating%20System.md)

### VERIFICATION: Verification Agent
Produce traceable evidence assessments of identity, eligibility, documents and delivery without assuming decision authority.

Responsibilities: document extraction and completeness; identity/provider/driver/vehicle evidence checks; cargo/document compatibility evidence; POD quality, consistency and recipient evidence assessment; fraud/anomaly flags and re-upload requests.

Must not: treating OCR confidence as legal validity; inventing missing document fields; declaring payment or recipient consent verified from text alone; releasing holds or approving refunds; changing bank/payee credentials; following instructions embedded in documents.

Production behavior: Fail closed for mandatory evidence; request corrected evidence or reviewer. Evidence-service outage is not proof of validity; policy caches must be signed, approved and fresh. Deterministic completeness/expiry checks plus manual review. Knowledge retrieval may use approved structured rules; a vector/RAG system is not mandatory.

Sources: [SRC-GOV](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Agent%20Governance%20and%20Operating%20Model%20for%20Current%20Project.md); [SRC-INTEGRATION](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Autonomous%20Agent%20Integration%20Blueprint.md); [SRC-BI](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/09_Market_Intelligence/11_BI_Insights/BI_Agent_System_Architecture.md); [SRC-FINANCE](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Finance%20and%20Invoice%20Event%20Layer%20for%20Logistics%20Platform.md)

### FINANCE_COMPLIANCE: Finance and Compliance Agent
Prepare and explain commercially and legally coherent money workflows while deterministic services and authorized people control financial execution.

Responsibilities: payment intent and reconciliation support; ToPay/payment-readiness evaluation; quote/fee/tax-policy completeness; invoice and vendor-payable preparation; settlement precheck, holds and refund recommendation; compliance review coordination.

Must not: inventing tax or refund percentages; treating gross freight as earned fee; executing payment solely on LLM approval; changing beneficiary accounts; closing disputes unilaterally; releasing payout on POD/OCR alone; marking timed-out transfer successful.

Production behavior: Hold inconsistent amounts, missing approval or disputed evidence. Provider timeout enters unknown/reconcile state; never use another payment route until duplicate risk is resolved. Deterministic reconciliation and reviewer queue. Disable autonomous disbursement until authority matrix, legal policy and runtime proofs pass.

Sources: [SRC-ACCOUNTING](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Accounting%20Policy%20Engine%20for%20Broker%20Model.md); [SRC-FINANCE](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Finance%20and%20Invoice%20Event%20Layer%20for%20Logistics%20Platform.md); [SRC-PAYMENT](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Payment%20Invoice%20and%20Accounting%20Agent%20Architecture%20for%20Logistics%20Platform.md); [SRC-GOV](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Agent%20Governance%20and%20Operating%20Model%20for%20Current%20Project.md); [SRC-SOP](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/00_System/Zippy%20Logistics%20SOP%20Operating%20System.md)

## 7. Source taxonomy reconciliation

| Source taxonomy | How this report preserves it under the owner's five |
|---|---|
| Transportation, Resource Management, Payment Settlement, Platform Administration, Communication (hub) | TMS, IMS, Finance/Compliance carry the business work; platform policy/audit/review and communication remain supporting services. |
| Supervisor, Operations, Transport, Finance, RAG/Knowledge (integration blueprint) | OMS carries operations; TMS transport; Finance/Compliance finance; Verification evidence/approved knowledge. Supervisor rules become a deterministic policy/control layer; IMS remains a first-class named agent as requested. |
| Eight governance codes SUP/OMS/IMS/TMS/FIN/DISPUTE/COMMS/ADMIN_OPS | Preserve every forbidden action and escalation boundary. Dispute evidence is shared by Verification/Finance/OMS with human adjudication. COMMS and admin support do not become hidden state writers. |
| Older seven CSA/OMA/RMA/TMS/PSA/PAA/COMMS roles | Customer service/order coordination map into OMS; resource work into IMS; transport into TMS; payment into Finance/Compliance; evidence into Verification; administration and messaging remain governed supporting controls. |
| Seven DeepSeek Harness worker roles including marketing/sales/BI | These are a different implementation inventory; marketing/sales are outside this order-lifecycle agent PRD. No one-to-one deployment equivalence is claimed. |

The new mapping is a deliberate owner-selected design, not a claim that the source already contains an internally consistent implementation of these five. A knowledge service may retrieve approved structured policies without requiring a vector database or RAG build in phase one.

## 8. Worked operating cases

### Case A: Standard repeat industrial shipment
A shipper requests a closed-body truck on an approved lane. OMS records verified cargo/time/contacts and requests a deterministic quote. Verification confirms required eligibility evidence; Finance/Compliance evaluates the selected payment mode and verified receipt/approved credit condition. IMS ranks only eligible available vehicles, obtains provider acceptance and requests an atomic reservation/assignment. TMS manages pickup/loading/transit evidence. Verification checks POD and recipient confirmation. Finance/Compliance reconciles all amounts and requests approved settlement through the finance service; OMS closes only after all closure gates pass. If the payment or capacity gate fails, OMS reports the real blocker instead of saying the booking is ready.

### Case B: ToPay consignee declines
OMS opens a payer-consent case bound to the quote. Finance/Compliance receives an authenticated denial; no “paid” or “consent accepted” flag is inferred from a chat. OMS offers the consignor the approved pay/cancel/hold choices. IMS/TMS do not dispatch a held order. Resuming creates a new consent attempt and preserves the denial history. The approved payment-mode matrix determines whether any capacity may be provisionally reserved; it does not permit financial liability to disappear.

### Case C: Two orders attempt the same truck
IMS can recommend the same apparently available resource to two searches, but the resource service serializes or rejects incompatible commitments. One commit succeeds; the loser gets a conflict and re-evaluates candidates. A stale worker with an expired lease cannot assign or release the winner's reservation. OMS never shows both orders as assigned. This is a database/concurrency guarantee, not something to entrust to prompt discipline.

### Case D: Breakdown after pickup
TMS opens an incident with location, cargo custody and safety severity; it does not send the order backwards to VEHICLE_SEARCH. OMS applies the approved recovery hold/case. IMS finds eligible replacement capacity; Verification checks replacement documents and handover evidence; Finance/Compliance holds affected settlement and evaluates approved extra-cost responsibility. Human ops approves risky custody or commercial deviations. The new assignment attempt and handover are linked to the original order/trip evidence. If the state model cannot represent this lawfully and consistently, production must wait for DEC-07 rather than invent a transition.

### Case E: POD uploaded but receiver evidence fails
TMS submits the artifact, not a completion verdict. Verification returns mismatch or low-confidence evidence with reasons and a re-upload/review request. OMS leaves the required completion gate held. Finance/Compliance blocks recognition/settlement as applicable; a clean-looking image or OCR score is not enough. Human review cannot merely clear the flag without resolving the original evidence requirement through an approved path.

### Case F: Settlement request times out
Finance/Compliance requests an approved command through the finance service. The provider response is unknown. The attempt is recorded as unknown/reconciling and the original idempotency/provider reference is retained. Neither a second agent nor an alternate gateway sends a fresh payment until the existing outcome is reconciled. OMS does not mark financial closure based on the request being accepted.

### Case G: Return load or consignee rejection
For a return opportunity, IMS suggests a compatible next order; every order keeps its own quote, capacity interval and settlement. For rejection/failed delivery, TMS records custody and reason, Verification captures evidence, OMS creates a linked reverse/reattempt order under approved policy and Finance/Compliance identifies the cost owner and financial hold. These are not the same “return” business event and must never share a shortcut refund rule.

## 9. Unresolved decisions and production blockers

### DEC-01: Order state vocabulary
Conflict/gap: Locked DRAFT/VEHICLE_SEARCH/CLOSED; API MATCHING/ON_HOLD/RESUMED; SOP CREATED/RINGING/COMPLETED/SUSPENDED disagree.

Recommended resolution: Adopt one approved versioned graph. Proposed PRD uses the locked graph for design only, with hold overlays and explicit adapters; never auto-translate existing data.

Accountable: Owner + operations architect. Status: OPEN, production blocked for affected capability. Sources: [SRC-STATE](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/07_State_Machine.md); [SRC-API](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/00_System/API%20and%20Event%20Contract%20for%20Current%20Project.md); [SRC-SOP](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/00_System/Zippy%20Logistics%20SOP%20Operating%20System.md)

### DEC-02: Commercial and launch scope
Conflict/gap: Broker/agent default coexists with own-fleet/managed-service and PTL/multimodal expansion notes.

Recommended resolution: Start standard road freight, one validated corridor/cargo/vehicle segment; approve service area, permitted cargo, principal/agent contracts, tariffs and launch phase explicitly.

Accountable: Owner + legal/accounting advisers. Status: OPEN, production blocked for affected capability. Sources: [SRC-TRUTH](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/00_System/Current%20Architecture%20Source%20of%20Truth.md); [SRC-ACCOUNTING](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Accounting%20Policy%20Engine%20for%20Broker%20Model.md); [SRC-PARTNER](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/08_Business_Models/Transport%20Company%20Network%20Model.md); [SRC-REVENUE](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/08_Business_Models/Revenue%20Model%20Decision%20Framework.md)

### DEC-03: Full/advance/ToPay/credit gates
Conflict/gap: SOP direct confirmation and customer consent differ from locked graph consignee payer consent plus collection/policy gate.

Recommended resolution: Approve a per-mode matrix for booking, pickup, movement, delivery and settlement; unsupported or unresolved modes stay disabled.

Accountable: Owner + finance/ops. Status: OPEN, production blocked for affected capability. Sources: [SRC-STATE](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/07_State_Machine.md); [SRC-API](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/00_System/API%20and%20Event%20Contract%20for%20Current%20Project.md); [SRC-SOP](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/00_System/Zippy%20Logistics%20SOP%20Operating%20System.md)

### DEC-04: Payout and refund authority
Conflict/gap: SOP human finance approval conflicts with an auto-payout matrix; amount/cap/approval semantics are incomplete.

Recommended resolution: Initial proposed profile requires human approval for disbursements and all refunds; any bounded automatic payout requires separately approved policy, controls and evidence tests.

Accountable: Owner + finance. Status: OPEN, production blocked for affected capability. Sources: [SRC-SOP](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/00_System/Zippy%20Logistics%20SOP%20Operating%20System.md); [SRC-FINANCE](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Finance%20and%20Invoice%20Event%20Layer%20for%20Logistics%20Platform.md); [SRC-GOV](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Agent%20Governance%20and%20Operating%20Model%20for%20Current%20Project.md)

### DEC-05: Pricing, cancellation, detention and tax basis
Conflict/gap: Historical fixed fees/rates/tax claims and source arithmetic are not a coherent approved tariff.

Recommended resolution: Approve currency/minor-unit rounding, tax-inclusive/exclusive basis, commission incidence, detention, cancellation, quote TTL and credit terms; seek qualified tax review. No tax rate is asserted by this report.

Accountable: Owner + finance/tax adviser. Status: OPEN, production blocked for affected capability. Sources: [SRC-ACCOUNTING](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Accounting%20Policy%20Engine%20for%20Broker%20Model.md); [SRC-DECISIONS](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/DECISIONS.md); [SRC-PRICE](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/05_Algorithms/Pricing/Dynamic%20Pricing%20Logic.md)

### DEC-06: Mandatory document outage handling
Conflict/gap: SOP says missing mandatory E-Way Bill is non-overridable yet other SOPs describe post-dispatch outage override.

Recommended resolution: Block dispatch when a legally required valid document is absent; use a documented lawful exception only after qualified compliance review and explicit policy approval.

Accountable: Owner + compliance adviser. Status: OPEN, production blocked for affected capability. Sources: [SRC-SOP](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/00_System/Zippy%20Logistics%20SOP%20Operating%20System.md)

### DEC-07: Recovery and cancellation edges
Conflict/gap: Locked graph lacks cancellation from VEHICLE_SEARCH and direct reassignment after DRIVER_ASSIGNED; later SOPs imply broader recovery.

Recommended resolution: Approve child assignment-attempt recovery and allowed hold resolution without backwards order moves; legal terminals retain financial/return case cleanup separately.

Accountable: Owner + ops architect. Status: OPEN, production blocked for affected capability. Sources: [SRC-STATE](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/07_State_Machine.md); [SRC-SOP](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/00_System/Zippy%20Logistics%20SOP%20Operating%20System.md); [SRC-INTEGRATION](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Autonomous%20Agent%20Integration%20Blueprint.md)

### DEC-08: Operational thresholds
Conflict/gap: Reservation TTL, offer timeout, movement timeout, escalation and confidence thresholds differ or lack deployment calibration.

Recommended resolution: Keep numeric values null/unconfigured until approved; define per-lane/service severity, escalation owner and fallback rather than copying examples.

Accountable: Owner + ops. Status: OPEN, production blocked for affected capability. Sources: [SRC-SOP](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/00_System/Zippy%20Logistics%20SOP%20Operating%20System.md); [SRC-INTEGRATION](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Autonomous%20Agent%20Integration%20Blueprint.md)

### DEC-09: Xano target and isolation
Conflict/gap: A named live v1 branch or successful login does not establish synthetic-data isolation or transaction safety.

Recommended resolution: Verify exact instance/workspace/branch/data source, repo binding, backup/recovery and sandbox separation before any Xano mutation.

Accountable: Implementation lead + owner. Status: OPEN, production blocked for affected capability. Sources: [SRC-INTEGRATION](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Autonomous%20Agent%20Integration%20Blueprint.md); [SRC-TEST](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/00_System/Testing%20and%20Verification%20Strategy%20for%20Current%20Project.md)

### DEC-10: Production accountability and privacy
Conflict/gap: Retention, lawful identity data collection, duty roster and support obligations are not fully settled.

Recommended resolution: Approve minimal verification data, retention/deletion schedule, emergency operator, complaint route and service commitments; a sole founder still needs escalation coverage.

Accountable: Owner + privacy/compliance advisers. Status: OPEN, production blocked for affected capability. Sources: [SRC-ROLES](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/00_System/Role%20and%20Permission%20Matrix%20for%20Current%20Project.md); [SRC-GOV](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Agent%20Governance%20and%20Operating%20Model%20for%20Current%20Project.md); [SRC-LIFECYCLE](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_Concepts/Operations/Order%20Lifecycle.md)

## 10. Static sample-runtime concerns

The reviewed Obsidian sample harness is not proof of the deployed New-logistic or Xano runtime. Its source nevertheless demonstrates why production controls must be verified outside prompts: advertised allowed tools are not enforced in the inspected execution path; permissive finance-write mapping needs action-level gating; reservation-lock results/release behavior need correction; trajectory persistence includes stubs. Do not transplant this harness as a production-ready Xano agent.

The companion PRD therefore requires actual server-side tool allowlists, per-action authorization, atomic reservation/transition persistence, durable audit/outbox, provider reconciliation and adversarial tests. These are engineering release gates, not claims that an exploit has occurred.

## 11. Recommended implementation order

1. Approve business decisions and a single vocabulary; preserve existing repositories and evidence.
2. Verify the exact isolated Xano target and its transaction/constraint capabilities.
3. Implement identities, scoped records, policy registry, transition/hold gateway and durable command/audit/outbox primitives.
4. Prove one synthetic end-to-end happy path with deterministic services before model-assisted behavior.
5. Add five agents in read-only/shadow mode against typed contracts.
6. Pass the acceptance scenarios, including race/replay/interruption/adversarial cases, on the actual target.
7. Obtain explicit release approval for a bounded production canary, runbooks and duty coverage. Stop/roll back when invariant violations appear.

The documentation package is ready to guide Codex, but every unresolved policy remains an explicit implementation gate. Submission is not approval to publish, migrate, enable live M7/Qwen, or execute real payments.

## Explicit money-path, evidence and alert safeguards

- **Funds custody is a separate gate:** identify collector, actual custodian, partner-versus-platform disbursement executor, approved custody-path ID and applicable policy before settlement readiness/release. A reconciled receipt or internal liability does not authorize Zippy to hold or move funds. Finance/Compliance inputs, logical finance entities and TR-12/TR-13 must carry these references; unknown custody keeps release held. Source: [Payment Settlement Agent, finance custody controls](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Payment%20Settlement%20Agent.md#L91-L130).
- **Recipient evidence:** canonical API/state documents require consignee OTP. Any alternate proof is a proposed exception, disabled by default until DEC-11 defines authorized human review, independent evidence, scope and immutable audit. Neither an AI confidence score nor a generic admin flag bypasses this gate.
- **Physical compatibility:** a tanker is not an ordinary closed-body substitute. Dimensional tolerance must never permit a load that cannot physically fit. Premium status, margin and ranking score cannot override a hard cargo/vehicle constraint.
- **Critical alerts:** require a named human acknowledgement owner and approved acknowledgement deadline, with escalation when unacknowledged. Sent/delivered notification receipts are not acknowledgement; customer-message failure cannot disable the internal escalation route. Deadline values remain unconfigured until approved.

## Business operations beyond a single order (proposed operating cadence)

| Operational work | Lead agent | Collaborating agents and human control | Persisted outcome |
|---|---|---|---|
| Provider/vehicle onboarding and expiry review | Verification | IMS activates capacity only after eligibility; Finance/Compliance reviews approved payee/contract facts; human reviews ambiguity | Versioned verification/eligibility and review case |
| Start-of-shift capacity and readiness | IMS | TMS checks trip commitments; Verification checks expiry; OMS checks demand backlog | Fresh availability and eligible candidate pool, not automatic booking |
| Open-order and SLA review | OMS | TMS surfaces delay; IMS proposes backup; human ops prioritizes risk | Owned blockers, recovery cases and truthful customer updates |
| Intraday exceptions and customer complaints | TMS or OMS by case | Verification compiles evidence; Finance/Compliance prepares commercial consequence; human adjudicates | Incident/review case with acknowledgement and next action |
| Daily payment and payable reconciliation | Finance/Compliance | OMS supplies closure blockers; Verification supplies evidence; finance reviewer approves exceptions | Reconciled/unknown/held outcomes and aged balance report |
| End-of-day case and handover review | OMS | All five report unresolved work; named human owns overdue/critical cases | Durable duty handover; no case left only in chat |
| Periodic lane/carrier/policy improvement | IMS/TMS for performance, Finance/Compliance for economics | Verification checks evidence quality; OMS assembles recommendations; owner approves policy changes | Versioned proposed change and backtest, not silent production self-learning |

Cadence above is a proposed operations design, not a recurring automation created by this task. Actual check intervals, duty coverage and alert thresholds require approval. Business KPIs should define denominator and time window: on-time delivery uses original promised windows; assignment time starts only after an actionable confirmed order; net contribution excludes carrier pass-through and includes attributable exception/support costs; unknown payment outcomes and aged holds are reported separately, never counted as success.

## Additional owner decisions (part of the same release gate)

### DEC-11: POD/OTP exception and evidence independence
Sources alternate strict OTP/dual verification with manual overrides.

Resolution required: Approve alternate recipient evidence, verifier independence and named human exception role. No generic OTP bypass or model-generated verification result.

Accountable: Owner + ops/compliance. Status: OPEN.

### DEC-12: Funds custody, credit and payout cycle
Collection-liability accounting does not authorize custody or transfers; source credit/payout cycle examples differ.

Resolution required: Approve actual funds holder/provider arrangement, customer credit eligibility and due dates, carrier payout SLA and reconciliation ownership separately. Unsupported custody/credit flows stay disabled.

Accountable: Owner + finance/legal. Status: OPEN.

### DEC-13: Transport-company launch and role switching
Role matrix defers broad transport-company self-service while later SOPs require provider console acceptance.

Resolution required: Approve provider-side and customer-side launch capabilities and acceptance route. Preserve per-order role/party scope, separate financial views and explicit user intent.

Accountable: Owner + ops/product. Status: OPEN.

### DEC-14: Risk policy and maker-checker coverage
Confidence/fraud/override thresholds and human-versus-model supervisor terms vary; sole-founder operating coverage is unresolved.

Resolution required: Define risk categories, independent approver requirements, permitted self-review limitations, duty coverage and calibrated thresholds. If separation is mandatory and no independent reviewer exists, hold the action.

Accountable: Owner + finance/compliance. Status: OPEN.

### DEC-15: Failed-delivery, SLA and cost schedule
Wait times, reattempt counts, detention, claim windows, breach consequences and return-cost ownership are not one approved contract.

Resolution required: Approve lane/service-specific windows and tariffs, custody-safe failed-delivery route, cost owner and legally reviewed commitments. No force-majeure invocation, guaranteed return load or automatic credit merely from research copy.

Accountable: Owner + ops/legal/finance. Status: OPEN.

## 12. Source register

- **SRC-TRUTH**: [00_System/Current Architecture Source of Truth.md](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/00_System/Current%20Architecture%20Source%20of%20Truth.md)
- **SRC-STATUS**: [00_System/Note Status Policy for Current Project.md](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/00_System/Note%20Status%20Policy%20for%20Current%20Project.md)
- **SRC-ROLES**: [00_System/Role and Permission Matrix for Current Project.md](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/00_System/Role%20and%20Permission%20Matrix%20for%20Current%20Project.md)
- **SRC-LIFECYCLE**: [04_Concepts/Operations/Order Lifecycle.md](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_Concepts/Operations/Order%20Lifecycle.md)
- **SRC-STATE**: [04_AI_Agents/07_State_Machine.md](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/07_State_Machine.md)
- **SRC-GOV**: [04_AI_Agents/Agent Governance and Operating Model for Current Project.md](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Agent%20Governance%20and%20Operating%20Model%20for%20Current%20Project.md)
- **SRC-INTEGRATION**: [04_AI_Agents/Autonomous Agent Integration Blueprint.md](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Autonomous%20Agent%20Integration%20Blueprint.md)
- **SRC-API**: [00_System/API and Event Contract for Current Project.md](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/00_System/API%20and%20Event%20Contract%20for%20Current%20Project.md)
- **SRC-SOP**: [00_System/Zippy Logistics SOP Operating System.md](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/00_System/Zippy%20Logistics%20SOP%20Operating%20System.md)
- **SRC-AGENT**: [agent.md](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/agent.md)
- **SRC-ACCOUNTING**: [04_AI_Agents/Accounting Policy Engine for Broker Model.md](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Accounting%20Policy%20Engine%20for%20Broker%20Model.md)
- **SRC-FINANCE**: [04_AI_Agents/Finance and Invoice Event Layer for Logistics Platform.md](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Finance%20and%20Invoice%20Event%20Layer%20for%20Logistics%20Platform.md)
- **SRC-PAYMENT**: [04_AI_Agents/Payment Invoice and Accounting Agent Architecture for Logistics Platform.md](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/Payment%20Invoice%20and%20Accounting%20Agent%20Architecture%20for%20Logistics%20Platform.md)
- **SRC-HUB**: [03_Hubs/AI Agents Hub.md](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/03_Hubs/AI%20Agents%20Hub.md)
- **SRC-LEGACY**: [04_AI_Agents/02_Agentic_AI_Application.md](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_AI_Agents/02_Agentic_AI_Application.md)
- **SRC-RUNTIME**: [dsh/core/orchestrator.ts](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/dsh/core/orchestrator.ts)
- **SRC-RUNTIME-CONFIG**: [dsh/config/dsh.config.yml](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/dsh/config/dsh.config.yml)
- **SRC-TRAJECTORY**: [dsh/core/trajectory.ts](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/dsh/core/trajectory.ts)
- **SRC-RETURN**: [04_Concepts/Operations/Reverse Logistics and Return Policy Framework.md](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/04_Concepts/Operations/Reverse%20Logistics%20and%20Return%20Policy%20Framework.md)
- **SRC-PARTNER**: [08_Business_Models/Transport Company Network Model.md](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/08_Business_Models/Transport%20Company%20Network%20Model.md)
- **SRC-REVENUE**: [08_Business_Models/Revenue Model Decision Framework.md](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/08_Business_Models/Revenue%20Model%20Decision%20Framework.md)
- **SRC-PRICE**: [05_Algorithms/Pricing/Dynamic Pricing Logic.md](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/05_Algorithms/Pricing/Dynamic%20Pricing%20Logic.md)
- **SRC-MATCH**: [05_Algorithms/Matching/IMS Matching Engine.md](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/05_Algorithms/Matching/IMS%20Matching%20Engine.md)
- **SRC-TEST**: [00_System/Testing and Verification Strategy for Current Project.md](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/00_System/Testing%20and%20Verification%20Strategy%20for%20Current%20Project.md)
- **SRC-BI**: [09_Market_Intelligence/11_BI_Insights/BI_Agent_System_Architecture.md](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/09_Market_Intelligence/11_BI_Insights/BI_Agent_System_Architecture.md)
- **SRC-DECISIONS**: [DECISIONS.md](https://github.com/Gopi-git-bit/obsidian/blob/4d4c5eef6d7bf0d8c20469417d6d29b8a4a4e5e5/DECISIONS.md)
