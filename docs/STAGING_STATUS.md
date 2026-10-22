# Staging implementation status

Staging is BLOCKED at the database-guarantee gate. No dependent public booking, dispatch or payment implementation is accepted, and no production activation is authorized.

Fresh exports were compared to review commit 953f7ca98c00b41122d96747441447bcfc7abd36. The sandbox contained newer authentication fixes, Slice1 prototypes and workflow tests; these are preserved in backend/xano. The live export was captured separately and was not edited. Baseline hashes are in backend/evidence/export-baseline.json.

The independent payment predicate now enforces partial advances from 50% through 100% inclusive, using exact integer arithmetic. Eight new cases cover overpayment, upper boundary, odd-cent rounding and large amounts. Local predicate checks cannot establish payment-provider correctness.

## Required guarantees

Every deferred SQL control has a per-control record in backend/contracts/database-controls.json. Missing executable tests are explicitly null and blocking, not passes. Relationships, uniqueness, cross-field rules, tenant isolation, immutable evidence and protected state changes all require enforcement through supported Xano mechanisms. Existing prototype SQL/advisory locking is not proof of support or concurrency safety.

- Shared-state concurrent HTTP execution unavailable: sandbox and isolated ephemeral tenant ingress=false.
- Atomic conditional updates, duplicate exclusion, vehicle/driver exclusivity and worker claims unproven.
- Non-database failure rollback not demonstrated.
- Deferred schema controls lack demonstrated enforcement and executable integration tests.
- Booking HTTP API, provider payment/webhook handling and durable workers incomplete.
- Recovery, restoration, end-to-end journeys and alerts not demonstrated.

## Reproduction and next action

1. Inspect sandbox metadata: ingress is false. A separately created two-hour ephemeral tenant also has ingress false and no domain. CLI 1.3.4 ephemeral edit only supports display/description changes.
2. Existing shared-context keeper/observer workflow tests use isolated fixtures; observer sees zero rows while keeper holds fixtures. Thus they cannot establish competing requests on shared persisted state. See preserved Slice1 report and workflow source.
3. Provide a supported isolated Xano test environment with authenticated HTTP ingress and shared persisted synthetic fixtures. Verify database identity and two-tenant separation before writes. Do not enable live branch access as a workaround.
4. Run database and non-database failure cases separately; prove rollback, compare-and-set, unique booking/assignment and fenced worker claims. Record actual statuses and residue queries.
5. Only after all required controls pass, complete booking, dispatch/payment/workers, then API/concurrency/failure/recovery acceptance.

## Evidence limits

Historical SQL division-by-zero rollback tests and discarded-response replay are retained, not relabeled as fresh HTTP or network-failure tests. No provider credentials were used. Backup restoration, deployment rollback and production capacity are not demonstrated. The manual staging workflow is a fail-closed readiness gate until executable integration tests exist. It cannot be used as a staging acceptance pass.

## Validation completed on 22 October

All 16 payment unit tests passed in Xano after sandbox-only import. The final 104-document export is pinned by backend/evidence/tested-export.json SHA-256 entries. Offline checks pass all 49 shared and 49 exported cases plus 49 tables/476 mapped fields. The 194 deferred controls remain blocked. No production or live-branch promotion occurred.

The workflow names the synthetic-staging GitHub environment but does not configure environment protection rules. Before enabling any network suite, an administrator must configure required reviewers, restricted branches and environment-scoped provider test credentials; pass credentials only to the validated test runner, never pull-request code. Currently the gate accepts no credentials, makes no network calls and always exits unsuccessfully because the critical suite is absent.

Official platform references: [database transactions](https://docs.xano.com/the-function-stack/functions/database-requests/database-transaction) and [direct database queries](https://docs.xano.com/the-function-stack/functions/database-requests/direct-database-query). The transaction documentation limits rollback to database failures; direct queries require explicit data-source targeting. Neither proves concurrent safety in this workspace.
