# Zippy P0 Read-Only Integration Development Gate — 2026-10-31

**Checkpoint:** `P0_READ_ONLY_DEVELOPMENT_AUTHORIZED_BY_SCOPE`
**Workspace:** Zippy Synthetic Prototype_1, ID 3, `v1`, live data source
**Status:** Documentation-only development gate. NOT a live API, schema, concurrency, Stage P, payment, webhook, or production approval.

## Read-only evidence

- Xano Agent report: `ZIPPY_P0_BLOCKER_RESOLUTION_REVIEW` (user-supplied 2026-10-30 output). Agent proposed three new tables, four functions and one authenticated refund execution API; no Xano writes or runtime tests occurred.
- Independent syntax validator: official local `@xano/developer-mcp` v2.2.6; **8/8** complete proposed definitions syntactically valid. The snippet changing notification worker checks is not a complete separately validated definition.
- After this report, fresh CLI **read-only** pulls from workspace 3 / branch `v1` returned **85 published XanoScript files and 85 draft XanoScript files**, including **34 table definitions in both views**.
- No changes compared with the 2026-10-31 preserved post-crosswalk published/draft snapshots. The additional table is the CSV-imported `ZIPPY_DB_CROSSWALK_49_TO_XANO33`, not 49 migrated business entities.
- The existing **14 unpublished safety patches** remain preserved. The transactional booking two-file correction and this P0 proposal remain **offline-only**.

## Stage authorized for safe development

**A. Frontend:** Continue booking, customer, vehicle-owner and admin UX, unavailable-state warnings, strict role-specific views, error/empty/loading states and mocked E2E tests. Keep customer booking creation, quote acceptance, payment/ToPay, refunds and provider notification buttons disabled until independently cleared.

**B. Backend inspection:** Read-only schema/metadata verification and documented GET-only integration contracts are allowed with service-scoped permissions. No customer/vendor/business record export. Use controlled synthetic/mocked data for tests. Ensure gateway denies write operations irrespective of frontend button state.

**C. Offline engineering:** Complete pure local XanoScript syntax and static security checks for transactional booking and P0 ledger proposals. Produce test plans and migration dependency designs without saving definitions.

**D. Vercel:** Source-based preview only; preserve protection and no production alias/credential changes. Mock gateway test suite and TypeScript/lint/build remain prerequisite for any future preview updates.

## Outstanding critical acceptance blockers

1. **Refund concurrency and ledger lifecycle:** The proposed `payment_refund_ledger` unique payment row and conditional `db.increment` may reserve funds atomically, but *runtime* isolation and transaction rollback have not been demonstrated. Missing verified capture-time initialization, fail/succeed settlement transitions, provider idempotency reconciliation, audit and payment state invariants. The refund API must not be exposed.
2. **Finance authorization:** `finance_executor_authorizations` requires a trusted grant/revoke implementation with independently verified approver/executor separation, org scope and tamper resistance; merely defining the table is not sufficient. Super-admin cross-org behavior must be explicitly designed. Ordinary billing/profile roles cannot grant refunds.
3. **Participant actions:** `security/authorize_participant_action` still accepts `caller_user_id`; every actual invoking API must bind it to `$auth.id`, validate owning org and role with trusted membership context, and never grant new privileges via a participant row alone.
4. **Notification fencing:** A nonempty user-provided `worker_id` and `lease_owner` string comparison is not authenticated worker identity or a generation/fencing guarantee. Require trusted credentials, epoch/nonce and atomic conditional allocation plus isolated concurrency tests.
5. **Webhook authenticity:** Provider account ID and signed raw body must originate from an authenticated HTTP request; provider-specific Razorpay/Telnyx signature specifications and key rotation are unimplemented. Generic HMAC comparison is not sufficient; do not permit invalid-signature event IDs to block later legitimate deliveries (quarantine/dedup poisoning).
6. **Schema/runtime isolation:** Xano draft table save might trigger live DDL. Stage P support has not established the required tenant/DB/network isolation. No schema create/delete, hosted tests or live publication.
7. **Compatibility:** Existing legacy `processing` idempotency rows and request-hash changes need reconciliation. `expires_at` is retention metadata, not safe automatic reclamation.

## Next limited execution sequence

1. Verify frontend feature flags and gateway write guards; enumerate GET read contracts and their resource-ownership filters; keep write routes disabled.
2. Re-run local TypeScript/Vite/lint and mocked gateway tests after any frontend change. Do not claim live booking E2E coverage.
3. Prepare isolated synthetic concurrency acceptance specification for booking create, cumulative refunds, outbox worker fencing and provider callbacks.
4. Obtain independent isolated environment/security approval and explicit per-migration owner authorization before any Xano schema change or hosted verification.
5. Separate future deployment gates: `OFFLINE_SOURCE_REVIEWED` → `ISOLATED_RUNTIME_VERIFIED` → `SECURITY_GATE_APPROVED` → `PUBLISHED`. Neither Stage P nor production follows automatically from a local code commit.

## Non-actions and ownership

This checkpoint does not authorize Xano database clearing, importing the 49-row crosswalk, merging P0 tables, deleting the crosswalk table, granting finance permissions, sending SMS/emails, refunding funds, processing Razorpay transactions, enabling AI agents, changing live credentials or deploying production.

**Decision:** Proceed with safe frontend work and read-only integration preparations. Preserve all source and data; stay blocked for sensitive operations.
