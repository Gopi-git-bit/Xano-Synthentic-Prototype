# M1 acceptance and publication gates (sanitized summary)

**Reviewer scope:** Xano workspace 3, v1 source. No live publication or tenant provisioning performed by this review branch.

## Evidence that exists (bounded)

| Subject | Evidence level | Outcome |
| --- | --- | --- |
| Current metadata discovery | Read-only source / metadata | 33 table declarations; 84 published and 84 draft definitions; 41 differences in captured snapshots |
| Published authentication and booking reads | Source review and negative HTTP probes | Source hardening reviewed; 8/8 missing or malformed token requests returned 401 |
| Frontend adapter behavior | Offline mocked server tests | 17/17 passed in OpenCode's reported run |
| Mutation refusal candidates | Source-only static validation | All 12 local denial candidates passed 13 source checks in the private audit; not parsed or run in Xano |
| Isolation readiness engine | Local offline preparation | 16 offline safety checks passed; native adapter not yet implemented |
| Hosted positive authentication/tenant access | Live app acceptance | BLOCKED / NOT RUN |
| Hosted M1 operational cases | Native staging acceptance | 0/31 verified |
| Finance, dispatch and AI agents | Runtime capability | NOT IMPLEMENTED / NOT ACCEPTED |

These are reported bounded results from the private, SHA-verified handoff. This public derivative does not republish sealed receipts. A source-level security finding is not a runtime security proof.

## Remaining issues

- Input validation and route evidence must precede persistence/quoting; no assumed distance.
- Booking identity collision resistance, mandatory idempotency, durable state/version predicates and atomic rollback remain unverified.
- Real independent driver/vehicle exclusivity and worker fencing remain unimplemented as accepted controls.
- Consent/OTP requires unpredictable challenge generation, protected binding, atomic validation/consumption and attempt limits.
- Payment, settlement and refunds need signed provider evidence, reconciliation, audit and explicit human approval. No automated refund authorization.
- Safe positive/negative account tests, organization A/B isolation, suspended identity, revocation and persisted-log inspection require approved synthetic identities.
- Historic workspace-1 physical counts and tests do not constitute workspace-3 acceptance.

## Approval gates — all blocked by default

**G: Public source disclosure.** Original raw Git history remains private; this derivative excludes the identified environment-specific metadata. A source review branch is not permission to publish a full unredacted bundle later.

**P: Isolated test environment.** Separate explicit owner approval is required to create one time-limited workspace-3 ephemeral tenant, with restricted scoped credential, no parent-live record access, independent database identity and verified provider/agent egress isolation. Proposed planning scope was four-hour tenant and one-hour credential; no creation or credential minting was authorized by this GitHub action.

**A/B: Synthetic fixtures and acceptance.** A further owner approval is required for synthetic accounts, organizations, bookings and limited auth/tenant-read/mutation-denial runtime checks, with positive and negative cases. Do not use an admin Metadata token as a customer app token.

**C: Transaction, dispatch, finance and agents.** Separate policy, database and runtime acceptance, including actual contention, rollback, fencing and finance review, before enabling operations.

At no point does merging this source-review PR automatically activate Xano, payments, messaging, CRM, Vercel deployment or production switches.

## Review checklist

- Confirm precisely 12 sanitized refusal examples and no original `guid =` declarations.
- Confirm source audit passes at the proposed commit.
- Inspect every file for user/machine identity, Xano live instance details, secrets, absolute paths, raw HTTP bodies and unsafe drafts.
- Keep GitHub review branch distinct from the local private continuation commit `61d1b139...`.
- Do not merge into `main`, `codex/xano-backend-review`, or `feat/frontend-tailwind-polish` until later acceptance and explicit review.
