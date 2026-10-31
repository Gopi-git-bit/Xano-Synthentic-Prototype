> Current update: coordinate P2 corrected in sandbox and tested with 84 regression cases; historical payment gap below was previously corrected. All remaining release blockers still apply. See [AUDIT_RESUMPTION.md](AUDIT_RESUMPTION.md).

> Update 2026-10-22: overpayment predicate corrected with eight regression cases; all runtime and integrity blockers remain. See [STAGING_STATUS.md](STAGING_STATUS.md).

# Backend review — 2026-10-21

## Outcome

The Codex output is a useful sandbox foundation, not a finished backend. The dedicated GitHub repository previously contained only an older starter export and no root README or workflows. This change preserves that export and adds the reviewed final sandbox snapshot, evidence, reproducible offline checks, and documentation.

## Findings

1. **Release blocker: database protections remain incomplete.** The table export represents 49 operational tables and 476 fields, but the builder explicitly defers SQL row security, foreign keys, cross-field checks, partial uniqueness, append-only controls, and concurrency enforcement. Track each deferred control in `backend/contracts/schema-control-map.json`; implement and prove it before production use.
2. **Release blocker: command services are unfinished.** The three Logistics endpoints are GET routes. Domain eligibility functions do not book orders, transact money, assign drivers atomically, or provide reliable background delivery.
3. **Payment validation gap, reproduced locally.** `validate_payment_plan({total:"100.00", advance:"150.00", mode:"partial"})` returns `{valid:true, code:"VALID"}`. The predicate lacks an upper bound on advances. Confirm the intended financial policy and add a rejection/regression case before exposing it through a command API. The snapshot is preserved as built; this publication does not silently alter deployed business rules.
4. **Authentication/isolation proofs are missing.** The account adapter and scoped reads require runtime tests with multiple provisioned identities, expired memberships, blocked accounts, duplicate profile records, and cross-platform requests. The build report explicitly excludes unsuccessful auth test attempts from its pass count.
5. **Health is not readiness.** The health endpoint returns a literal status and does not query persistence or verify provider dependencies.
6. **Historical evidence has a limited scope.** The retained Xano report records 41 passing domain tests. No fresh remote test, HTTP test, promotion, rollback, replay, or concurrency proof was performed during this review.

## Checks performed

- Re-ran all 41 supplied local domain contract cases.
- Added repeatable checks that execute the JavaScript extracted from each exported domain function against the same cases.
- Checked operational table/field coverage against the retained canonical map.
- Scanned the proposed snapshot for common token and private-key formats; no matches found. This is a limited scan, not a guarantee.
- Kept deployment and credentials out of the automatic workflow.

The GitHub workflow proves offline contracts and snapshot consistency only. A green run is not production or security approval.
