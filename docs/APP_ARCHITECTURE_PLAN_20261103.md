# Zippy Logistics — Application Architecture Execution Plan

**Checkpoint:** 2026-11-03; review-only, not release authorization.  
**Project:** Gopi-git-bit/Xano-Synthentic-Prototype.  
**Control documents:** docs/EXECUTION_TRACKER.md and docs/EVIDENCE.md on the execution-tracker review lineage.  
**Backend source:** draft PR #10, commit 4421892ff9c884e43711753cacde04efd4ddb7c6.  
**Frontend:** draft PR #7 base integration, #8 API-alignment, #9 safety regression; Vercel read-only protected preview.  

## Application layers

| Layer | Responsibility | Trust boundary |
| --- | --- | --- |
| React/Vite/Tailwind | Responsive Customer, unified Vehicle Owner including salaried drivers, and Admin dashboards | Browser never trusts client-supplied roles, prices, payment status or Xano tool IDs |
| Vercel server gateway | Bearer authentication, business API proxies, per-capability release flags, bounded response schemas, error mapping | Cannot expose Xano metadata/debug/MCP/internal transactional APIs |
| Xano deterministic services | Customers/orgs; booking/cargo/quote; vendor fleet/driver/trip/dispatch; POD/tracking; invoice/payment/refund/settlement; audit/reliability | Tenant ownership and user roles verified server-side on every request |
| Five Xano agents | OMS, IMS, TMS, Verification, Finance/Compliance | Assessment or recommendation only, least-privilege tools, human approval for financial and disputed operations |
| External providers | Mappls, Telnyx, Razorpay test-mode, Zoho CRM | Signed callbacks, scoped identifiers and secrets; no browser/provider credentials |

## Implementable milestones (no dates promised)

| Phase | Backend deliverable | Frontend deliverable | Acceptance gate |
| --- | --- | --- | --- |
| 0 | Preserve seven tool definitions and separate customer milestone source | Keep PR #7/#8/#9 gates disabled | PR #10 review, source hashes, sanitized evidence; no production merge |
| 1 | Stable isolated customer register, org/member, login/me, bookings list/detail, idempotent draft POST | Sandbox-only registration + draft booking adapter behind independently accepted contracts | Cross-tenant, suspended/revoked, same-key replay, 20-way concurrency and rollback; release flags remain blocked live |
| 2 | Vendor, fleet and salaried driver onboarding; scoped owner trip GET; admin minimal dashboard GET | Owner jobs/vehicles and Admin role-scoped reads | Other-vendor / other-driver denial and no sensitive field leakage |
| 3 | Cargo editing, Mappls route distance with real provenance, tariff quote + payment/consent gating | Validated customer booking and quote preview | Never quote fabricated 480 km / fallback route; protected draft-to-confirm lifecycle |
| 4 | Atomic vehicle/driver/booking reservation and trip offers; tracking and status transitions | Assigned trips, accept/decline and customer tracking | No double allocation in races, role state transitions, no data crosswalk leaks |
| 5 | POD private evidence, human review, exceptions and settlement holds | Driver POD submission and Admin verification review | Private object ownership, no plaintext OTP, no self-approval or financial unlock from upload alone |
| 6 | Telnyx outbound worker + signed receipts; Razorpay signed test-mode payment/refund; CRM identity map | Accurate status, notifications, restricted CRM reads | Signature replay, duplicate, timeout and refund human-approval tests |
| 7 | OMS/IMS/TMS/Verification/Finance assessment-only agents on reviewed tools | Non-autonomous agent recommendations behind role-scoped dashboards | Model/tool authorization and prompt-injection denial, human review required |
| 8 | Independently verified stage chain, rollback and provider e2e | Protected preview then authorized production Vercel deployment | Separate owner production approval, actual selected Xano published hashes, no unresolved P0 blockers |

## Evidence interpretation

OpenCode reported 48/48 definitions and 65/65 authenticated synthetic tool-debug assertions for seven read-only tools, plus 45/45 definitions and 48/48 synthetic HTTP assertions for customer register/member/draft. The source and receipts were pushed and independently located on GitHub, but ChatGPT did not replay Xano calls. The separate ephemeral tenants expire November 4, 2026, and are not a durable API deployment.

The October 30 Stage P and AB gates in the formal predecessor evidence chain remain unapproved. Temporary tenant testing does not retroactively satisfy those approvals.

## Exact next task for each owner

**OpenCode / Xano:** supply the stable sandbox-only URL/canonicals and versioned request/response schemas for customer registration, login/me, membership and draft booking; reproduce the A/B role, rollback and concurrency cases in a verified isolated target; preserve no-copy and no-live-change evidence.

**ChatGPT + Composio / frontend:** compare the new Xano schemas to PR #8; add isolated adapter and mock/e2e tests in a narrow draft PR without changing production release flags. Keep the seven tool-debug endpoints unreachable from the browser.

**Owner:** individually approve schema migrations, external provider activation, refunds and production merges only when acceptance evidence supports them. This plan is not approval.
